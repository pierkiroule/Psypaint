import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "../vendor/three.module.js";
import { advanceAudioMotion, initialAudioMotion } from "../utils/audioMotion.js";
import { mapOrientationToView } from "../utils/gyroView.js";

const MAX_MARKS = 36;
const VERTEX = `attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}`;
const FRAGMENT = `precision highp float;
uniform vec2 uResolution,uView;uniform float uTime,uFlow,uShimmer,uDiffusion,uPropagation,uCount,uImmersive;uniform vec4 uMarks[36];uniform float uKinds[36],uOpacity[36];
float hash(float n){return fract(sin(n*127.13)*43758.5453);}float soft(float d,float w){return smoothstep(w,0.,abs(d));}
vec3 pal(float k,float x){
 if(k<.5)return mix(vec3(.02,.28,.62),vec3(.25,.95,1.),x);if(k<1.5)return mix(vec3(.8,.08,.015),vec3(1.,.75,.12),x);
 if(k<2.5)return mix(vec3(.04,.3,.12),vec3(.62,.9,.22),x);if(k<3.5)return mix(vec3(.25,.08,.8),vec3(.05,.85,1.),x);
 if(k<4.5)return mix(vec3(.28,.38,.5),vec3(.85,.94,1.),x);if(k<5.5)return mix(vec3(.55,.58,1.),vec3(1.,.82,.3),x);
 if(k<6.5)return mix(vec3(.08,.1,.36),vec3(.68,.72,1.),x);return mix(vec3(.18,.8,.78),vec3(1.,.48,.78),x);}
vec3 markField(vec2 p,vec4 m,float k,float alpha,float id){float age=uTime-m.z;if(age<0.)return vec3(0.);vec2 o=(m.xy-.5*uResolution)/uResolution.y;float seed=hash(id*9.7+k*31.);float life=exp(-age*.018)*alpha;float phase=uTime*.18+uFlow+seed*6.28;vec2 q=(p-o)/m.w;if(uImmersive>.5)q.x-=floor(q.x/1.8+.5)*1.8;float r=length(q),a=atan(q.y,q.x);float line=0.,dust=0.;
 if(k<.5){line=soft(q.y-sin(q.x*15.-phase*2.)*.045,.025);dust=soft(r-(.09+.035*sin(a*5.+phase)),.012)*uShimmer;}
 else if(k<1.5){line=soft(q.x+sin(q.y*18.+phase*4.)*.035,.02)*smoothstep(.18,-.12,q.y);dust=pow(max(0.,sin(a*11.+phase*5.-r*40.)),12.)*smoothstep(.2,.02,r);}
 else if(k<2.5){line=soft(sin(a*3.+sin(r*19.-phase))*.7,.055)*smoothstep(.22,.015,r);dust=pow(.5+.5*sin(r*70.-phase*3.),16.)*line*uShimmer;}
 else if(k<3.5){line=soft(r-(.03+.018*a+.025*phase),.014)+soft(r-.11-sin(a*4.+phase)*.018,.01);dust=pow(.5+.5*sin(a*18.-phase*5.),18.)*smoothstep(.24,.03,r);}
 else if(k<4.5){line=smoothstep(.2,.015,r)*(.18+.35*hash(floor((q.x+q.y)*45.)));dust=soft(r-.14,.035)*.25;}
 else if(k<5.5){dust=pow(hash(floor(q.x*70.)+floor(q.y*70.)*19.+id),22.)*smoothstep(.22,.015,r)*(1.+uShimmer*1.8);line=soft(q.y-sin(q.x*22.+phase)*.018,.009)*.35;}
 else if(k<6.5){line=smoothstep(.2,.01,r)*.12+soft(r-.1-sin(phase)*.01,.018);dust=soft(r-.16,.008)*uShimmer;}
 else{line=soft(fract(r*13.+sin(a*5.+phase)*.12)-.5,.075)*smoothstep(.21,.015,r);dust=soft(r-.16,.012)*uShimmer;}
 float advect=exp(-r*r*(55.-uDiffusion*12.));float propagation=soft(r-(.04+fract(uFlow*.18)*.24),.012)*uPropagation;return pal(k,fract(seed+age*.018+r*2.))*(line*.36+dust*.62+advect*.08+propagation*.22)*life;}
void main(){vec2 p=(gl_FragCoord.xy-.5*uResolution)/uResolution.y;if(uImmersive>.5){p.x+=uView.x;p.y+=uView.y;p*=1.+dot(p,p)*.12;}vec3 c=vec3(.006,.009,.018);for(int i=0;i<36;i++){if(float(i)>=uCount)break;c+=markField(p,uMarks[i],uKinds[i],uOpacity[i],float(i));}c=1.-exp(-c*1.45);float vig=smoothstep(1.2,.15,length((gl_FragCoord.xy-.5*uResolution)/uResolution.y));gl_FragColor=vec4(pow(c*vig,vec3(.82)),1.);}`;

export function useThreeVisualizer(getAudioData) {
  const canvasRef=useRef(null), runtime=useRef(null), marks=useRef([]), active=useRef(null), selected=useRef(0), settings=useRef({size:1,opacity:.82}), immersive=useRef(false), orientation=useRef({target:[0,0],current:[0,0],baseline:null}), audioMotion=useRef(initialAudioMotion()), history=useRef([]), [count,setCount]=useState(0);
  const setArchetype=useCallback(index=>{selected.current=index;},[]);
  const setBrushSettings=useCallback(patch=>Object.assign(settings.current,patch),[]);
  const setImmersive=useCallback(async value=>{immersive.current=value;orientation.current.baseline=null;orientation.current.target=[0,0];const Orientation=globalThis.DeviceOrientationEvent;if(value&&typeof Orientation?.requestPermission==="function"){try{await Orientation.requestPermission();}catch{ /* Gyroscope permission is optional. */ }}},[]);
  const addMark=(event,force=false)=>{const canvas=canvasRef.current,rect=canvas.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width,y=1-(event.clientY-rect.top)/rect.height,last=marks.current.at(-1),now=performance.now()/1000;if(!force&&last&&Math.hypot(x-last.x,y-last.y)<.018)return;marks.current.push({x,y,kind:selected.current,born:now,size:settings.current.size,opacity:settings.current.opacity});if(marks.current.length>MAX_MARKS){marks.current.shift();history.current=history.current.map(n=>Math.max(0,n-1));}setCount(marks.current.length);};
  const down=useCallback(event=>{event.preventDefault();canvasRef.current.setPointerCapture(event.pointerId);if(immersive.current){active.current={id:event.pointerId,view:true,x:event.clientX,y:event.clientY};return;}history.current.push(marks.current.length);active.current={id:event.pointerId,view:false};addMark(event,true);navigator.vibrate?.(10);},[]);
  const move=useCallback(event=>{const gesture=active.current;if(gesture?.id!==event.pointerId)return;event.preventDefault();if(gesture.view){orientation.current.target[0]-=(event.clientX-gesture.x)/innerWidth;orientation.current.target[1]+=(event.clientY-gesture.y)/innerHeight;gesture.x=event.clientX;gesture.y=event.clientY;return;}for(const sample of event.getCoalescedEvents?.()||[event])addMark(sample);},[]);
  const up=useCallback(event=>{if(active.current?.id===event.pointerId)active.current=null;},[]);
  const clear=useCallback(()=>{marks.current=[];history.current=[];setCount(0);},[]);
  const undo=useCallback(()=>{const length=history.current.pop();if(length===undefined)return;marks.current=marks.current.slice(0,length);setCount(marks.current.length);},[]);
  useEffect(()=>{const onOrientation=event=>{if(!immersive.current)return;const state=orientation.current,sample={alpha:event.alpha,beta:event.beta,gamma:event.gamma},mapped=mapOrientationToView(sample,state.baseline,screen.orientation?.angle||0);state.baseline=mapped.baseline;state.target=[mapped.x,mapped.y];};addEventListener("deviceorientation",onOrientation);return()=>removeEventListener("deviceorientation",onOrientation);},[]);
  useEffect(()=>{const canvas=canvasRef.current,renderer=new THREE.WebGLRenderer({canvas});if(!renderer.gl)return;renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera();const uniforms={uResolution:{value:new THREE.Vector2()},uView:{value:new THREE.Vector2()},uTime:{value:0},uFlow:{value:0},uShimmer:{value:0},uDiffusion:{value:0},uPropagation:{value:0},uCount:{value:0},uImmersive:{value:0},uMarks:{value:new Float32Array(MAX_MARKS*4),type:"4fv"},uKinds:{value:new Float32Array(MAX_MARKS),type:"1fv"},uOpacity:{value:new Float32Array(MAX_MARKS),type:"1fv"}};const material=new THREE.ShaderMaterial({uniforms,vertexShader:VERTEX,fragmentShader:FRAGMENT}),geometry=new THREE.PlaneGeometry(2,2);scene.add(new THREE.Mesh(geometry,material));runtime.current={uniforms};
    const resize=()=>{const rect=canvas.getBoundingClientRect();renderer.setSize(rect.width,rect.height);uniforms.uResolution.value.set(canvas.width,canvas.height);};resize();const observer=new ResizeObserver(resize);observer.observe(canvas);let frame;
    const render=now=>{const dt=Math.min(.05,(now-(render.last||now))/1000);render.last=now;const a=getAudioData(),motion=audioMotion.current=advanceAudioMotion(audioMotion.current,a,dt),list=marks.current,o=orientation.current;o.current[0]+=(o.target[0]-o.current[0])*.045;o.current[1]+=(o.target[1]-o.current[1])*.045;uniforms.uTime.value=now/1000;uniforms.uFlow.value=motion.flow;uniforms.uShimmer.value=motion.shimmer;uniforms.uDiffusion.value=motion.diffusion;uniforms.uPropagation.value=motion.propagation;uniforms.uCount.value=list.length;uniforms.uImmersive.value=immersive.current?1:0;uniforms.uView.value.set(o.current[0],o.current[1]);list.forEach((m,i)=>{uniforms.uMarks.value[i*4]=m.x*canvas.width;uniforms.uMarks.value[i*4+1]=m.y*canvas.height;uniforms.uMarks.value[i*4+2]=m.born;uniforms.uMarks.value[i*4+3]=m.size;uniforms.uKinds.value[i]=m.kind;uniforms.uOpacity.value[i]=m.opacity;});renderer.render(scene,camera);frame=requestAnimationFrame(render);};frame=requestAnimationFrame(render);return()=>{cancelAnimationFrame(frame);observer.disconnect();geometry.dispose();material.dispose();renderer.dispose();};
  },[getAudioData]);
  return{canvasRef,canvasProps:{onPointerDown:down,onPointerMove:move,onPointerUp:up,onPointerCancel:up},setArchetype,setBrushSettings,setImmersive,clear,undo,count};
}
