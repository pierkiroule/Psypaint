import { useCallback, useEffect, useRef } from "react";
import { PALETTES } from "../data/palettes";
import { VirtualJoystick } from "./VirtualJoystick";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function project(point, width, height, view) {
  const longitude=(point.x-.5)*Math.PI*1.7, latitude=(.5-point.y)*Math.PI*.8;
  const radius=5;
  let x=Math.sin(longitude)*Math.cos(latitude)*radius-view.px;
  let y=Math.sin(latitude)*radius-view.py;
  let z=-Math.cos(longitude)*Math.cos(latitude)*radius-view.pz;
  const cy=Math.cos(view.yaw), sy=Math.sin(view.yaw); [x,z]=[x*cy-z*sy,x*sy+z*cy];
  const cp=Math.cos(view.pitch), sp=Math.sin(view.pitch); [y,z]=[y*cp-z*sp,y*sp+z*cp];
  const depth=-z;
  if(depth<.08)return null;
  const scale=(height*.5)/Math.tan(view.fov*.5)/depth;
  return {x:width*.5+x*scale,y:height*.5-y*scale,scale:clamp(scale/height,.35,2.4)};
}

function paintStroke(ctx, stroke, width, height, view, time) {
  if(stroke.points.length<2)return;
  const colors=stroke.colors || [stroke.ink,stroke.ink], base=stroke.brush==="wash"?18:stroke.brush==="ink"?2.2:stroke.brush==="pencil"?1.2:3;
  const layers=stroke.brush==="wash"?4:1;
  for(let layer=0;layer<layers;layer++){
    ctx.beginPath();let started=false;
    stroke.points.forEach((point,index)=>{const p=project(point,width,height,view);if(!p){started=false;return;}const wobble=stroke.brush==="wash"?Math.sin(index*.35+time+layer)*layer*1.5:0;if(!started){ctx.moveTo(p.x,p.y+wobble);started=true;}else ctx.lineTo(p.x,p.y+wobble);});
    ctx.strokeStyle=stroke.brush==="ink"?stroke.ink:colors[layer%2];ctx.lineWidth=base+(stroke.brush==="wash"?layer*7:0);ctx.globalAlpha=stroke.brush==="wash"?.08:stroke.brush==="pencil"?.55:.72;ctx.lineCap="round";ctx.lineJoin="round";ctx.stroke();
  }
  if(stroke.brush==="bloom"||stroke.brush==="leaf")for(let i=3;i<stroke.points.length;i+=stroke.brush==="bloom"?7:4){const p=project(stroke.points[i],width,height,view);if(!p)continue;const radius=(stroke.brush==="bloom"?9:6)*p.scale;ctx.fillStyle=colors[i%2];ctx.globalAlpha=.38;ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fill();}
}

export function Immersive360({ active, palette, getStrokes, canvasRef, onExit }) {
  const localRef=useRef(null);
  const navigation=useRef({input:{x:0,y:0,magnitude:0},velocity:0,yawVelocity:0,pitchVelocity:0});
  const view=useRef({yaw:0,pitch:0,fov:Math.PI/2,drag:false,x:0,y:0,pinch:0,px:0,py:0,pz:0});
  const setNavigationInput=useCallback(input=>{navigation.current.input=input;},[]);
  useEffect(()=>{canvasRef.current=localRef.current;return()=>{canvasRef.current=null;};},[canvasRef,active]);
  useEffect(()=>{
    if(!active)return;
    const canvas=localRef.current,ctx=canvas.getContext("2d");let frame,lastTime=0;const points=new Map();
    const resize=()=>{const d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(innerWidth*d);canvas.height=Math.round(innerHeight*d);canvas.style.width=`${innerWidth}px`;canvas.style.height=`${innerHeight}px`;ctx.setTransform(d,0,0,d,0,0);};
    const render=ms=>{const w=innerWidth,h=innerHeight,pal=PALETTES[palette],t=ms/1000,dt=Math.min((ms-lastTime)/1000,.04)||0;lastTime=ms;
      const ship=navigation.current,input=ship.input,v=view.current,throttle=-input.y;
      ship.velocity+=throttle*2.1*dt;ship.velocity*=Math.exp(-(Math.abs(throttle)<.01?1.15:.22)*dt);ship.velocity=clamp(ship.velocity,-.72,2.25);
      const targetYawVelocity=-input.x*.78,turnBlend=1-Math.exp(-3.2*dt);ship.yawVelocity+=(targetYawVelocity-ship.yawVelocity)*turnBlend;v.yaw+=ship.yawVelocity*dt;
      const forwardX=-Math.sin(v.yaw),forwardZ=-Math.cos(v.yaw),distance=Math.hypot(v.px,v.pz),outward=distance?(v.px*forwardX+v.pz*forwardZ)/distance:0;
      if(distance>3.15&&ship.velocity*outward>0)ship.velocity*=Math.exp(-4.5*dt);
      v.px+=forwardX*ship.velocity*dt;v.pz+=forwardZ*ship.velocity*dt;
      const safeDistance=Math.hypot(v.px,v.pz);if(safeDistance>3.7){v.px=v.px/safeDistance*3.7;v.pz=v.pz/safeDistance*3.7;ship.velocity*=.75;}
      const background=ctx.createRadialGradient(w*(.35+Math.sin(t*.05)*.08),h*.35,0,w*.5,h*.5,Math.max(w,h));background.addColorStop(0,pal.paper[0]);background.addColorStop(.48,pal.paper[1]);background.addColorStop(1,pal.ink);ctx.globalAlpha=1;ctx.fillStyle=background;ctx.fillRect(0,0,w,h);ctx.globalCompositeOperation="multiply";getStrokes().forEach(stroke=>paintStroke(ctx,stroke,w,h,v,t));ctx.globalCompositeOperation="source-over";ctx.globalAlpha=.08;for(let i=0;i<90;i++){const x=(Math.sin(i*91.7)*.5+.5)*w,y=(Math.sin(i*37.3)*.5+.5)*h;ctx.fillStyle=i%3?pal.ink:"#fff";ctx.fillRect(x,y,1,1);}frame=requestAnimationFrame(render);};
    const down=e=>{canvas.setPointerCapture(e.pointerId);points.set(e.pointerId,{x:e.clientX,y:e.clientY});view.current.drag=true;view.current.x=e.clientX;view.current.y=e.clientY;if(points.size===2){const[a,b]=[...points.values()];view.current.pinch=Math.hypot(a.x-b.x,a.y-b.y);}};
    const move=e=>{if(!points.has(e.pointerId))return;points.set(e.pointerId,{x:e.clientX,y:e.clientY});if(points.size===2){const[a,b]=[...points.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);view.current.fov=clamp(view.current.fov-(distance-view.current.pinch)*.003,.7,2.25);view.current.pinch=distance;return;}view.current.yaw-=(e.clientX-view.current.x)*.004;view.current.pitch=clamp(view.current.pitch+(e.clientY-view.current.y)*.0035,-1.15,1.15);view.current.x=e.clientX;view.current.y=e.clientY;};
    const up=e=>{points.delete(e.pointerId);view.current.drag=points.size>0;},wheel=e=>{view.current.fov=clamp(view.current.fov+e.deltaY*.001,.7,2.25);};
    resize();addEventListener("resize",resize);canvas.addEventListener("pointerdown",down);canvas.addEventListener("pointermove",move);canvas.addEventListener("pointerup",up);canvas.addEventListener("pointercancel",up);canvas.addEventListener("wheel",wheel,{passive:true});frame=requestAnimationFrame(render);
    return()=>{cancelAnimationFrame(frame);removeEventListener("resize",resize);canvas.removeEventListener("pointerdown",down);canvas.removeEventListener("pointermove",move);canvas.removeEventListener("pointerup",up);canvas.removeEventListener("pointercancel",up);canvas.removeEventListener("wheel",wheel);};
  },[active,palette,getStrokes]);
  if(!active)return null;
  return <div className="immersive-360"><canvas ref={localRef} onDoubleClick={onExit} aria-label="Vue 3D à 360 degrés de votre peinture"/><VirtualJoystick onInput={setNavigationInput}/><p>Propulsez et virez avec le manche · Glissez pour regarder</p></div>;
}
