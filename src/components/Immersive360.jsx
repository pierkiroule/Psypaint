import { useEffect, useRef } from "react";
import { PALETTES } from "../data/palettes";

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
  const localRef=useRef(null),joystickRef=useRef(null),movement=useRef({x:0,y:0,pointer:null});
  const view=useRef({yaw:0,pitch:0,fov:Math.PI/2,drag:false,x:0,y:0,pinch:0,px:0,py:0,pz:0});
  useEffect(()=>{canvasRef.current=localRef.current;return()=>{canvasRef.current=null;};},[canvasRef,active]);
  useEffect(()=>{
    if(!active)return;
    const canvas=localRef.current,ctx=canvas.getContext("2d");let frame,lastTime=0;const points=new Map();
    const resize=()=>{const d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(innerWidth*d);canvas.height=Math.round(innerHeight*d);canvas.style.width=`${innerWidth}px`;canvas.style.height=`${innerHeight}px`;ctx.setTransform(d,0,0,d,0,0);};
    const render=ms=>{const w=innerWidth,h=innerHeight,pal=PALETTES[palette],t=ms/1000,dt=Math.min((ms-lastTime)/1000,.04)||0;lastTime=ms;
      const input=movement.current,speed=1.45*dt,forward=-input.y*speed,right=input.x*speed,v=view.current;
      v.px+=-Math.sin(v.yaw)*forward+Math.cos(v.yaw)*right;v.pz+=-Math.cos(v.yaw)*forward-Math.sin(v.yaw)*right;
      const distance=Math.hypot(v.px,v.pz);if(distance>3.6){v.px=v.px/distance*3.6;v.pz=v.pz/distance*3.6;}
      const background=ctx.createRadialGradient(w*(.35+Math.sin(t*.05)*.08),h*.35,0,w*.5,h*.5,Math.max(w,h));background.addColorStop(0,pal.paper[0]);background.addColorStop(.48,pal.paper[1]);background.addColorStop(1,pal.ink);ctx.globalAlpha=1;ctx.fillStyle=background;ctx.fillRect(0,0,w,h);ctx.globalCompositeOperation="multiply";getStrokes().forEach(stroke=>paintStroke(ctx,stroke,w,h,v,t));ctx.globalCompositeOperation="source-over";ctx.globalAlpha=.08;for(let i=0;i<90;i++){const x=(Math.sin(i*91.7)*.5+.5)*w,y=(Math.sin(i*37.3)*.5+.5)*h;ctx.fillStyle=i%3?pal.ink:"#fff";ctx.fillRect(x,y,1,1);}if(!v.drag&&!input.x&&!input.y)v.yaw+=.00018;frame=requestAnimationFrame(render);};
    const down=e=>{canvas.setPointerCapture(e.pointerId);points.set(e.pointerId,{x:e.clientX,y:e.clientY});view.current.drag=true;view.current.x=e.clientX;view.current.y=e.clientY;if(points.size===2){const[a,b]=[...points.values()];view.current.pinch=Math.hypot(a.x-b.x,a.y-b.y);}};
    const move=e=>{if(!points.has(e.pointerId))return;points.set(e.pointerId,{x:e.clientX,y:e.clientY});if(points.size===2){const[a,b]=[...points.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);view.current.fov=clamp(view.current.fov-(distance-view.current.pinch)*.003,.7,2.25);view.current.pinch=distance;return;}view.current.yaw-=(e.clientX-view.current.x)*.004;view.current.pitch=clamp(view.current.pitch+(e.clientY-view.current.y)*.0035,-1.15,1.15);view.current.x=e.clientX;view.current.y=e.clientY;};
    const up=e=>{points.delete(e.pointerId);view.current.drag=points.size>0;},wheel=e=>{view.current.fov=clamp(view.current.fov+e.deltaY*.001,.7,2.25);};
    resize();addEventListener("resize",resize);canvas.addEventListener("pointerdown",down);canvas.addEventListener("pointermove",move);canvas.addEventListener("pointerup",up);canvas.addEventListener("pointercancel",up);canvas.addEventListener("wheel",wheel,{passive:true});frame=requestAnimationFrame(render);
    return()=>{cancelAnimationFrame(frame);removeEventListener("resize",resize);canvas.removeEventListener("pointerdown",down);canvas.removeEventListener("pointermove",move);canvas.removeEventListener("pointerup",up);canvas.removeEventListener("pointercancel",up);canvas.removeEventListener("wheel",wheel);};
  },[active,palette,getStrokes]);
  const moveJoystick=e=>{if(movement.current.pointer!==e.pointerId)return;const rect=e.currentTarget.getBoundingClientRect(),radius=rect.width*.32,dx=e.clientX-(rect.left+rect.width/2),dy=e.clientY-(rect.top+rect.height/2),length=Math.hypot(dx,dy),factor=length>radius?radius/length:1,x=dx*factor/radius,y=dy*factor/radius;movement.current.x=x;movement.current.y=y;joystickRef.current?.style.setProperty("transform",`translate(${x*radius}px, ${y*radius}px)`);};
  const startJoystick=e=>{movement.current.pointer=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);moveJoystick(e);};
  const stopJoystick=e=>{if(movement.current.pointer!==e.pointerId)return;movement.current={x:0,y:0,pointer:null};joystickRef.current?.style.setProperty("transform","translate(0, 0)");};
  const keyJoystick=(e,pressed)=>{const keys={ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0],ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1]},value=keys[e.key];if(!value)return;e.preventDefault();movement.current.x=pressed?value[0]:0;movement.current.y=pressed?value[1]:0;const radius=24;joystickRef.current?.style.setProperty("transform",`translate(${movement.current.x*radius}px, ${movement.current.y*radius}px)`);};
  if(!active)return null;
  return <div className="immersive-360"><canvas ref={localRef} onDoubleClick={onExit} aria-label="Vue 3D à 360 degrés de votre peinture"/><div className="travel-joystick" role="application" tabIndex="0" aria-label="Joystick pour voyager dans le paysage" onPointerDown={startJoystick} onPointerMove={moveJoystick} onPointerUp={stopJoystick} onPointerCancel={stopJoystick} onKeyDown={e=>keyJoystick(e,true)} onKeyUp={e=>keyJoystick(e,false)}><span ref={joystickRef}/><small>VOYAGER</small></div><p>Joystick pour avancer · Glissez pour regarder · Pincez pour zoomer</p></div>;
}
