import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "../vendor/three.module.js";

const MAX_MARKS = 36;
const VERTEX = `attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}`;
const FRAGMENT = `precision highp float;
uniform vec2 uResolution;uniform float uTime,uLow,uMid,uHigh,uEnergy,uTransient,uCount;uniform vec4 uMarks[36];uniform float uKinds[36];
float hash(float n){return fract(sin(n*127.13)*43758.5453);}float soft(float d,float w){return smoothstep(w,0.,abs(d));}
vec3 pal(float k,float x){
 if(k<.5)return mix(vec3(.02,.28,.62),vec3(.25,.95,1.),x);if(k<1.5)return mix(vec3(.8,.08,.015),vec3(1.,.75,.12),x);
 if(k<2.5)return mix(vec3(.04,.3,.12),vec3(.62,.9,.22),x);if(k<3.5)return mix(vec3(.25,.08,.8),vec3(.05,.85,1.),x);
 if(k<4.5)return mix(vec3(.28,.38,.5),vec3(.85,.94,1.),x);if(k<5.5)return mix(vec3(.55,.58,1.),vec3(1.,.82,.3),x);
 if(k<6.5)return mix(vec3(.08,.1,.36),vec3(.68,.72,1.),x);return mix(vec3(.18,.8,.78),vec3(1.,.48,.78),x);}
vec3 markField(vec2 p,vec4 m,float k,float id){float age=uTime-m.w;if(age<0.)return vec3(0.);vec2 o=(m.xy-.5*uResolution)/uResolution.y,v=m.zw;v.y=0.;float seed=hash(id*9.7+k*31.);float life=exp(-age*.018);float phase=uTime*(.18+uMid*.22)+seed*6.28;vec2 q=p-o;float r=length(q),a=atan(q.y,q.x);float line=0.,dust=0.;
 if(k<.5){line=soft(q.y-sin(q.x*15.-phase*2.)*(.045+uLow*.04),.025);dust=soft(r-(.09+.035*sin(a*5.+phase)),.012)*uHigh;}
 else if(k<1.5){line=soft(q.x+sin(q.y*18.+phase*4.)*.035,.02)*smoothstep(.18,-.12,q.y);dust=pow(max(0.,sin(a*11.+phase*5.-r*40.)),12.)*smoothstep(.2,.02,r)*(1.+uTransient);}
 else if(k<2.5){line=soft(sin(a*3.+sin(r*19.-phase))*.7,.055)*smoothstep(.22,.015,r);dust=pow(.5+.5*sin(r*70.-phase*3.),16.)*line*uHigh;}
 else if(k<3.5){line=soft(r-(.03+.018*a+.025*phase),.014)+soft(r-.11-sin(a*4.+phase)*.018,.01);dust=pow(.5+.5*sin(a*18.-phase*5.),18.)*smoothstep(.24,.03,r);}
 else if(k<4.5){line=smoothstep(.2,.015,r)*(.18+.35*hash(floor((q.x+q.y)*45.)));dust=soft(r-.14,.035)*.25;}
 else if(k<5.5){dust=pow(hash(floor(q.x*70.)+floor(q.y*70.)*19.+id),22.)*smoothstep(.22,.015,r)*(1.+uHigh*3.);line=soft(q.y-sin(q.x*22.+phase)*.018,.009)*.35;}
 else if(k<6.5){line=smoothstep(.2,.01,r)*.12+soft(r-.1-sin(phase)*.01,.018);dust=soft(r-.16,.008)*uHigh;}
 else{line=soft(fract(r*13.+sin(a*5.+phase)*.12)-.5,.075)*smoothstep(.21,.015,r);dust=soft(r-.16,.012)*uHigh;}
 float advect=exp(-r*r*55.)*(.7+uEnergy*.5);return pal(k,fract(seed+age*.018+r*2.))*(line*.36+dust*.62+advect*.08)*life;}
void main(){vec2 p=(gl_FragCoord.xy-.5*uResolution)/uResolution.y;vec3 c=vec3(.006,.009,.018);for(int i=0;i<36;i++){if(float(i)>=uCount)break;c+=markField(p,uMarks[i],uKinds[i],float(i));}c*=.88+uEnergy*.42;c=1.-exp(-c*1.45);float vig=smoothstep(1.05,.18,length(p));gl_FragColor=vec4(pow(c*vig,vec3(.82)),1.);}`;

export function useThreeVisualizer(getAudioData) {
  const canvasRef=useRef(null), runtime=useRef(null), marks=useRef([]), active=useRef(null), selected=useRef(0), history=useRef([]), [count,setCount]=useState(0);
  const setArchetype=useCallback(index=>{selected.current=index;},[]);
  const addMark=(event,force=false)=>{const canvas=canvasRef.current,rect=canvas.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width,y=1-(event.clientY-rect.top)/rect.height,last=marks.current.at(-1),now=performance.now()/1000;if(!force&&last&&Math.hypot(x-last.x,y-last.y)<.018)return;const vx=last?(x-last.x):0,vy=last?(y-last.y):0;marks.current.push({x,y,vx,vy,kind:selected.current,born:now});if(marks.current.length>MAX_MARKS){marks.current.shift();history.current=history.current.map(n=>Math.max(0,n-1));}setCount(marks.current.length);};
  const down=useCallback(event=>{event.preventDefault();canvasRef.current.setPointerCapture(event.pointerId);history.current.push(marks.current.length);active.current=event.pointerId;addMark(event,true);navigator.vibrate?.(10);},[]);
  const move=useCallback(event=>{if(active.current!==event.pointerId)return;event.preventDefault();for(const sample of event.getCoalescedEvents?.()||[event])addMark(sample);},[]);
  const up=useCallback(event=>{if(active.current===event.pointerId)active.current=null;},[]);
  const clear=useCallback(()=>{marks.current=[];history.current=[];setCount(0);},[]);
  const undo=useCallback(()=>{const length=history.current.pop();if(length===undefined)return;marks.current=marks.current.slice(0,length);setCount(marks.current.length);},[]);
  useEffect(()=>{const canvas=canvasRef.current,renderer=new THREE.WebGLRenderer({canvas});if(!renderer.gl)return;renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera();const uniforms={uResolution:{value:new THREE.Vector2()},uTime:{value:0},uLow:{value:0},uMid:{value:0},uHigh:{value:0},uEnergy:{value:0},uTransient:{value:0},uCount:{value:0},uMarks:{value:new Float32Array(MAX_MARKS*4),type:"4fv"},uKinds:{value:new Float32Array(MAX_MARKS),type:"1fv"}};const material=new THREE.ShaderMaterial({uniforms,vertexShader:VERTEX,fragmentShader:FRAGMENT}),geometry=new THREE.PlaneGeometry(2,2);scene.add(new THREE.Mesh(geometry,material));runtime.current={uniforms};
    const resize=()=>{const rect=canvas.getBoundingClientRect();renderer.setSize(rect.width,rect.height);uniforms.uResolution.value.set(canvas.width,canvas.height);};resize();const observer=new ResizeObserver(resize);observer.observe(canvas);let frame;
    const render=now=>{const a=getAudioData(),list=marks.current;uniforms.uTime.value=now/1000;uniforms.uLow.value=a.low;uniforms.uMid.value=a.mid;uniforms.uHigh.value=a.high;uniforms.uEnergy.value=a.energy;uniforms.uTransient.value=a.transient;uniforms.uCount.value=list.length;list.forEach((m,i)=>{uniforms.uMarks.value[i*4]=m.x*canvas.width;uniforms.uMarks.value[i*4+1]=m.y*canvas.height;uniforms.uMarks.value[i*4+2]=m.vx;uniforms.uMarks.value[i*4+3]=m.born;uniforms.uKinds.value[i]=m.kind;});renderer.render(scene,camera);frame=requestAnimationFrame(render);};frame=requestAnimationFrame(render);return()=>{cancelAnimationFrame(frame);observer.disconnect();geometry.dispose();material.dispose();renderer.dispose();};
  },[getAudioData]);
  return{canvasRef,canvasProps:{onPointerDown:down,onPointerMove:move,onPointerUp:up,onPointerCancel:up},setArchetype,clear,undo,count};
}
