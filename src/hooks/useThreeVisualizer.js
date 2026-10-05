import { useCallback, useEffect, useRef } from "react";
import * as THREE from "../vendor/three.module.js";

const VERTEX = `attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}`;
const FRAGMENT = `precision highp float;
uniform vec2 uResolution,uTouch,uTouchVelocity;uniform float uTime,uAudioLow,uAudioMid,uAudioHigh,uAudioEnergy,uTransient,uTouchStrength,uTouchActive,uTouchDuration,uTapPulse,uFrom,uTo,uMorph;
#define PI 3.14159265359
float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+1.),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(.8,.6,-.6,.8);for(int i=0;i<4;i++){v+=a*n2(p);p=m*p*2.03+17.1;a*=.5;}return v;}
float soft(float d,float w){return smoothstep(w,0.,abs(d));}
vec3 tonemap(vec3 c){return 1.-exp(-max(c,0.));}

vec3 wave(vec2 p,float t,vec2 touch){
 float breath=.5+.5*sin(t*.31+sin(t*.071)*2.);float dist=length(p-touch),dent=uTouchStrength*exp(-dist*dist*13.);p+=normalize(p-touch+.001)*dent*.13;
 float warp=fbm(p*2.7+vec2(t*.035,-t*.021));vec2 q=p+vec2(sin(p.y*3.+t*.22),cos(p.x*2.4-t*.17))*(.07+.05*uAudioMid)+uTouchVelocity*.08*exp(-dist*7.);
 float membrane=soft(length(vec2(q.x*.82,q.y))- (.48+.035*sin(atan(q.y,q.x)*5.+t*.19)+warp*.075+breath*.025+uAudioLow*.06),.065);
 float inner=smoothstep(.55,.05,length(q))*pow(.35+.65*fbm(q*4.+warp+t*.018),1.7);float caustic=pow(max(0.,sin((q.x+warp*.18)*26.+t*.8)+sin((q.y-warp*.12)*19.-t*.51))*.5,5.);
 float ripple=soft(dist-(fract(uTapPulse)*.8),.025)*(1.-step(.98,uTapPulse));
 vec3 deep=vec3(.015,.12,.29),cyan=vec3(.05,.72,.88),pearl=vec3(.62,.96,1.);vec3 c=mix(deep,cyan,inner+warp*.25)*(inner*.7+membrane*.55);c+=pearl*(caustic*(.08+uAudioHigh*.3)+ripple*.55+membrane*.12);return c;
}
vec3 growth(vec2 p,float t,vec2 touch){
 float breath=1.+sin(t*.23+sin(t*.047))* .035+uAudioLow*.05;p/=breath;float td=length(p-touch),attract=uTouchStrength*exp(-td*td*10.);p=mix(p,touch,attract*.1);
 float angle=atan(p.y,p.x),r=length(p),warp=fbm(p*3.+t*.015);float body=smoothstep(.58,.08,r)*(.16+.3*fbm(p*4.2+warp));vec3 c=vec3(.018,.1,.06)*body;
 for(int i=0;i<7;i++){float fi=float(i),a=angle+sin(r*(8.+fi*.8)-t*(.09+fi*.011)+fi*2.1)*(.32+.15*warp);float target=fi*.897-PI;float branch=soft(sin((a-target)*(.9+fi*.08))+sin(r*13.-t*.13+fi)*.13,.035+.018*r);float taper=smoothstep(.66,.04,r)*smoothstep(.015,.12,r);float pulse=pow(.5+.5*sin(r*34.-t*(1.1+uAudioHigh)+fi),10.);vec3 hue=mix(vec3(.05,.36,.17),vec3(.5,.91,.32),r+warp*.25);c+=hue*branch*taper*(.42+uAudioMid*.3)+vec3(.75,1.,.5)*branch*pulse*(.2+uAudioHigh*.65);}
 float bloom=exp(-td*td*32.)*uTouchStrength*(.15+uTouchDuration*.05);c+=vec3(.32,.8,.28)*bloom*(.4+.6*fbm(p*18.));c+=vec3(.7,1.,.6)*uTransient*soft(r-.25,.025);return c;
}
vec3 vortex(vec2 p,float t,vec2 touch){
 vec2 drift=vec2(sin(t*.071),cos(t*.053))*.055;vec2 center=drift+mix(vec2(0.),touch,uTouchStrength*.55);p-=center;float r=length(p),a=atan(p.y,p.x);float breath=1.+uAudioLow*.16+sin(t*.19)*.025;r/=breath;
 vec3 c=vec3(0.);for(int i=0;i<5;i++){float fi=float(i),tilt=.58+fi*.075;vec2 op=vec2(p.x,p.y/tilt);float rr=length(op),aa=atan(op.y,op.x);float orbit=.1+fi*.09+.025*sin(aa*3.+t*.17+fi);float filament=soft(rr-orbit-.035*sin(aa*(2.+fi*.2)-t*(.23+uAudioMid*.2)+fi),.018+fi*.003);float flow=pow(.5+.5*sin(aa*17.-t*(.8+uAudioMid)+rr*31.+fi),12.);vec3 hue=mix(vec3(.22,.08,.72),vec3(.02,.78,.92),fi/4.);c+=hue*filament*(.22+flow*(.6+uAudioHigh));}
 float core=exp(-r*r*38.);float dust=pow(hash21(floor((p+vec2(a*.04,t*.008))*55.)),19.)*smoothstep(.68,.08,r);c+=vec3(.32,.12,.9)*core*.75+mix(vec3(.3,.28,1.),vec3(.4,1.,1.),hash21(floor(p*55.)))*dust*(.4+uAudioHigh);c+=vec3(.5,.85,1.)*uTransient*soft(r-.35-fract(uTapPulse)*.2,.025);return c;
}
vec3 archetype(float kind,vec2 p,float t,vec2 touch){if(kind<.5)return wave(p,t,touch);if(kind<1.5)return growth(p,t,touch);return vortex(p,t,touch);}
void main(){vec2 p=(gl_FragCoord.xy-.5*uResolution)/uResolution.y, touch=(uTouch-.5*uResolution)/uResolution.y;float grain=n2(gl_FragCoord.xy+uTime);vec3 from=archetype(uFrom,p,uTime,touch),to=archetype(uTo,p,uTime,touch);float veil=smoothstep(0.,1.,uMorph);veil=veil*veil*(3.-2.*veil);vec3 color=mix(from,to,veil);color+=vec3(.008,.014,.027)*(1.-length(p)*.55);color*=.92+.22*uAudioEnergy;color=tonemap(color*1.35);color+=grain*.012;float vignette=smoothstep(1.05,.22,length(p));gl_FragColor=vec4(pow(color*vignette,vec3(.82)),1.);}`;

export function useThreeVisualizer(getAudioData) {
  const canvasRef=useRef(null), runtime=useRef(null), selected=useRef(0), touch=useRef({position:[.5,.5],velocity:[0,0],strength:0,active:false,duration:0,lastTime:0,startTime:0,moved:false,tapPulse:2});
  const setArchetype=useCallback(index=>{const rt=runtime.current;if(!rt||index===selected.current)return;rt.uniforms.uFrom.value=selected.current;rt.uniforms.uTo.value=index;rt.transitionStart=performance.now();selected.current=index;},[]);
  const point=event=>{const rect=canvasRef.current.getBoundingClientRect();return[(event.clientX-rect.left)/rect.width,1-(event.clientY-rect.top)/rect.height];};
  const down=useCallback(event=>{event.preventDefault();canvasRef.current.setPointerCapture(event.pointerId);const now=performance.now(),p=point(event);touch.current={position:p,velocity:[0,0],strength:.12,active:true,duration:0,lastTime:now,startTime:now,moved:false,tapPulse:touch.current.tapPulse};},[]);
  const move=useCallback(event=>{const state=touch.current;if(!state.active)return;const now=performance.now(),p=point(event),dt=Math.max(16,now-state.lastTime);state.velocity=[(p[0]-state.position[0])*1000/dt,(p[1]-state.position[1])*1000/dt];state.moved ||= Math.hypot(...state.velocity)>.06;state.position=p;state.lastTime=now;},[]);
  const up=useCallback(()=>{const state=touch.current;if(!state.active)return;if(!state.moved&&performance.now()-state.startTime<260)state.tapPulse=0;state.active=false;},[]);
  useEffect(()=>{const canvas=canvasRef.current,renderer=new THREE.WebGLRenderer({canvas});if(!renderer.gl)return;renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(),v2=()=>({value:new THREE.Vector2()});const uniforms={uResolution:v2(),uTouch:v2(),uTouchVelocity:v2(),uTime:{value:0},uAudioLow:{value:0},uAudioMid:{value:0},uAudioHigh:{value:0},uAudioEnergy:{value:0},uTransient:{value:0},uTouchStrength:{value:0},uTouchActive:{value:0},uTouchDuration:{value:0},uTapPulse:{value:2},uFrom:{value:0},uTo:{value:0},uMorph:{value:1}};const material=new THREE.ShaderMaterial({uniforms,vertexShader:VERTEX,fragmentShader:FRAGMENT}),geometry=new THREE.PlaneGeometry(2,2);scene.add(new THREE.Mesh(geometry,material));runtime.current={uniforms,transitionStart:0};
    const resize=()=>{const rect=canvas.getBoundingClientRect();renderer.setSize(rect.width,rect.height);uniforms.uResolution.value.set(canvas.width,canvas.height);};resize();const observer=new ResizeObserver(resize);observer.observe(canvas);let frame,last=performance.now();
    const render=now=>{const dt=Math.min((now-last)/1000,.05);last=now;const a=getAudioData(),s=touch.current;s.duration=s.active?Math.min(4,s.duration+dt):Math.max(0,s.duration-dt*.7);s.strength=s.active?Math.min(1,s.strength+dt*(s.moved?1.2:.48)):Math.max(0,s.strength-dt*.72);s.velocity[0]*=Math.exp(-dt*5);s.velocity[1]*=Math.exp(-dt*5);s.tapPulse=Math.min(2,s.tapPulse+dt*.72);uniforms.uTime.value=now/1000;uniforms.uAudioLow.value=a.low;uniforms.uAudioMid.value=a.mid;uniforms.uAudioHigh.value=a.high;uniforms.uAudioEnergy.value=a.energy;uniforms.uTransient.value=a.transient;uniforms.uTouch.value.set(s.position[0]*canvas.width,s.position[1]*canvas.height);uniforms.uTouchVelocity.value.set(...s.velocity);uniforms.uTouchStrength.value=s.strength;uniforms.uTouchActive.value=s.active?1:0;uniforms.uTouchDuration.value=s.duration;uniforms.uTapPulse.value=s.tapPulse;uniforms.uMorph.value=runtime.current.transitionStart?Math.min(1,(now-runtime.current.transitionStart)/1600):1;renderer.render(scene,camera);frame=requestAnimationFrame(render);};frame=requestAnimationFrame(render);return()=>{cancelAnimationFrame(frame);observer.disconnect();geometry.dispose();material.dispose();renderer.dispose();};
  },[getAudioData]);
  return{canvasRef,canvasProps:{onPointerDown:down,onPointerMove:move,onPointerUp:up,onPointerCancel:up},setArchetype};
}
