import { useCallback, useEffect, useRef } from "react";
import * as THREE from "../vendor/three.module.js";
import { advanceAudioMotion, initialAudioMotion } from "../utils/audioMotion.js";
import { GENOME_KEYS } from "../data/archetypes.js";

const VERTEX = `attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}`;
const FRAGMENT = `precision highp float;
uniform vec2 uResolution,uTouch,uTouchVelocity;uniform float uTime,uEmergence,uSeed,uTouchStrength,uHold,uFlow,uShimmer,uDiffusion,uPropagation,uLow,uMid,uHigh,uEnergy;
uniform float uFluidity,uBranching,uOrbitality,uTurbulence,uDiffusionGenome,uMembrane,uSparkle,uVerticality,uSymmetry,uSoftness,uDensity,uLuminosity,uDepth;uniform vec3 uPalette[4];
#define PI 3.14159265359
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.52;for(int i=0;i<5;i++){v+=a*noise(p);p=mat2(1.58,-1.12,1.12,1.58)*p+2.17;a*=.48;}return v;}
vec2 organicField(vec2 p,float macro,float meso){float n=fbm(p*(1.3+uTurbulence)+vec2(macro,-macro*.71));float a=6.283*(n-.5)+atan(p.y,p.x)*uOrbitality;vec2 flow=vec2(cos(a),sin(a));flow+=vec2(-p.y,p.x)*uOrbitality/(.3+dot(p,p));flow.y+=uVerticality*.18;return flow*(.025+.055*uFluidity)+vec2(n-.5)*uTurbulence*.05+meso*uTouchVelocity*.08;}
vec3 palette(float x){x=clamp(x,0.,.999)*3.;if(x<1.)return mix(uPalette[0],uPalette[1],smoothstep(0.,1.,x));if(x<2.)return mix(uPalette[1],uPalette[2],smoothstep(0.,1.,x-1.));return mix(uPalette[2],uPalette[3],smoothstep(0.,1.,x-2.));}
void main(){
 vec2 uv=(gl_FragCoord.xy-.5*uResolution)/uResolution.y;float macro=uTime*.018+uSeed*4.7,breath=.55*sin(uTime*.21+uSeed)+.3*sin(uTime*.137+1.7)+.15*sin(uTime*.071+4.);breath*=.7+.3*noise(vec2(uTime*.025,uSeed));
 vec2 p=uv+vec2(sin(macro*.7),cos(macro*.53))*.045;vec2 tp=(uTouch-.5)*vec2(uResolution.x/uResolution.y,1.);vec2 td=p-tp;float local=exp(-dot(td,td)*(8.+6.*uSoftness))*uTouchStrength;
 p-=uTouchVelocity*local*.12;p+=normalize(td+vec2(.001))*sin(length(td)*24.-uTime*2.2)*uPropagation*.018;p+=vec2(-td.y,td.x)*local*uOrbitality*.055;
 float r=length(p),ang=atan(p.y,p.x),folds=mix(1.5,6.5,uSymmetry);float mirrored=abs(mod(ang+PI/folds,2.*PI/folds)-PI/folds);float imperfection=(fbm(p*2.+macro)-.5)*(.5-.3*uSymmetry+uTurbulence*.4)+local*.45;
 vec2 q=vec2(cos(mirrored+imperfection),sin(mirrored+imperfection))*r;q+=organicField(q,macro,uMid)*(.8+uFlow*.025);q+=organicField(q*1.7+1.3,-macro*.63,uMid)*.55;
 float warp=fbm(q*(2.2+uDensity)+vec2(macro,-macro*.8));vec2 warped=q+organicField(q+warp,macro*.7,uMid)*(2.+uFluidity*2.5);float fine=fbm(warped*4.2-vec2(macro*.9,macro*.3));
 float radius=.31+.12*uDensity+.035*breath+.025*uLow;float body=smoothstep(radius+.24*uSoftness,r+warp*.16-.09-local*.035-uHold*.025);
 float membrane=1.-smoothstep(.025+.07*uSoftness, .11+.12*uSoftness,abs(r+warp*.13-radius));membrane*=.3+.7*uMembrane;
 float fiberPhase=sin((mirrored*(3.+7.*uBranching)-r*(9.+7.*uOrbitality)+warp*4.)+macro*3.);float fibers=pow(max(0.,1.-abs(fiberPhase)),3.)*uBranching*body;
 float cell=smoothstep(.7,.98,sin((warp+fine*.45)*18.+uTime*.11)*.5+.5)*uMembrane*body;
 float dust=pow(hash(floor((warped+macro*.012)*uResolution.y*.16)),22.)*(.1+.9*uSparkle)*body*(.4+.6*fine);
 float emergence=smoothstep(0.,.3,uEmergence);float value=(body*(.08+.5*warp)+membrane*.48+fibers*.48*emergence+cell*.2+dust*(.45+uShimmer*.3))*emergence;value*=.7+.28*uLuminosity+.07*uEnergy;
 float pigment=fract(warp*.58+fine*.25+r*.6+uSeed*.31+uDepth*q.y*.12);vec3 col=palette(pigment)*value;col+=uPalette[3]*(dust*.22+local*.055+uHold*local*.05);col*=1.+uDiffusion*.045;
 float depthFog=mix(.62,1.,smoothstep(-.5,.45,q.y+fine*.15)*(.4+.6*uDepth));float vignette=smoothstep(1.02,.17,length(uv));col=1.-exp(-col*1.22);gl_FragColor=vec4(pow(col*depthFog*vignette,vec3(.9)),1.);
}`;

const cap = (value, min, max) => Math.max(min, Math.min(max, value));
export function useThreeVisualizer(getAudioData) {
  const canvasRef=useRef(null), composition=useRef(null), pointer=useRef({id:null,x:.5,y:.5,vx:0,vy:0,tx:.5,ty:.5,strength:0,downAt:0}), audioMotion=useRef(initialAudioMotion()), born=useRef(performance.now());
  const setComposition=useCallback(value=>{composition.current=value;},[]);
  const point=event=>{const rect=canvasRef.current.getBoundingClientRect();return[(event.clientX-rect.left)/rect.width,1-(event.clientY-rect.top)/rect.height];};
  const down=useCallback(event=>{event.preventDefault();canvasRef.current.setPointerCapture(event.pointerId);const [x,y]=point(event);pointer.current={...pointer.current,id:event.pointerId,tx:x,ty:y,downAt:performance.now(),strength:.35};navigator.vibrate?.(8);},[]);
  const move=useCallback(event=>{const p=pointer.current;if(p.id!==event.pointerId)return;event.preventDefault();const[x,y]=point(event);p.vx+=(x-p.tx)*.34;p.vy+=(y-p.ty)*.34;p.tx=x;p.ty=y;p.strength=cap(p.strength+.08,0,1);},[]);
  const up=useCallback(event=>{const p=pointer.current;if(p.id!==event.pointerId)return;p.id=null;p.strength=Math.max(p.strength,.55);},[]);
  const beginEmergence=useCallback(()=>{born.current=performance.now();},[]);
  useEffect(()=>{const canvas=canvasRef.current,renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:"high-performance"});if(!renderer.gl)return;
    let pixelRatio=Math.min(devicePixelRatio||1,1.5),slowFrames=0;renderer.setPixelRatio(pixelRatio);const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera();
    const uniforms={uResolution:{value:new THREE.Vector2()},uTouch:{value:new THREE.Vector2(.5,.5)},uTouchVelocity:{value:new THREE.Vector2()},uTime:{value:0},uEmergence:{value:0},uSeed:{value:.4},uTouchStrength:{value:0},uHold:{value:0},uFlow:{value:0},uShimmer:{value:0},uDiffusion:{value:0},uPropagation:{value:0},uLow:{value:0},uMid:{value:0},uHigh:{value:0},uEnergy:{value:0},uPalette:{value:[[.05,.12,.16],[.12,.35,.38],[.4,.58,.5],[.8,.75,.6]],type:"3fv"}};
    // Shader names mirror genome traits; diffusion needs a suffix to avoid the audio uniform.
    GENOME_KEYS.forEach(key=>{const name=key==="diffusion"?"uDiffusionGenome":`u${key[0].toUpperCase()}${key.slice(1)}`;uniforms[name]??={value:.4};});
    const material=new THREE.ShaderMaterial({uniforms,vertexShader:VERTEX,fragmentShader:FRAGMENT}),geometry=new THREE.PlaneGeometry(2,2);scene.add(new THREE.Mesh(geometry,material));
    const resize=()=>{const rect=canvas.getBoundingClientRect();renderer.setSize(rect.width,rect.height);uniforms.uResolution.value.set(canvas.width,canvas.height);};resize();const observer=new ResizeObserver(resize);observer.observe(canvas);let frame,last=performance.now();
    const render=now=>{const dt=Math.min(.05,(now-last)/1000);last=now;const c=composition.current,raw=getAudioData(),response=c?.audioResponse||{low:.5,mid:.5,high:.3};const audio={...raw,low:raw.low*response.low,mid:raw.mid*response.mid,high:raw.high*response.high};const motion=audioMotion.current=advanceAudioMotion(audioMotion.current,audio,dt);
      uniforms.uLow.value=motion.low;uniforms.uMid.value=motion.mid;uniforms.uHigh.value=motion.high;uniforms.uEnergy.value=motion.energy;uniforms.uFlow.value=motion.flow;uniforms.uShimmer.value=motion.shimmer;uniforms.uDiffusion.value=motion.diffusion;uniforms.uPropagation.value=motion.propagation;uniforms.uTime.value=now/1000;uniforms.uEmergence.value=cap((now-born.current)/3200,0,1);
      if(c){GENOME_KEYS.forEach(key=>{const name=key==="diffusion"?"uDiffusionGenome":`u${key[0].toUpperCase()}${key.slice(1)}`;uniforms[name].value+=(c[key]-uniforms[name].value)*(1-Math.exp(-dt*.5));});uniforms.uSeed.value+=(c.seed-uniforms.uSeed.value)*(1-Math.exp(-dt*.35));uniforms.uPalette.value=c.palette;}
      const p=pointer.current;p.vx+=(p.tx-p.x)*dt*8;p.vy+=(p.ty-p.y)*dt*8;p.vx*=Math.exp(-dt*5);p.vy*=Math.exp(-dt*5);p.x+=p.vx;p.y+=p.vy;p.strength*=Math.exp(-dt*(p.id===null?.72:.08));const held=p.id===null?0:cap((now-p.downAt)/1600,0,1);uniforms.uTouch.value.set(p.x,p.y);uniforms.uTouchVelocity.value.set(p.vx,p.vy);uniforms.uTouchStrength.value=p.strength;uniforms.uHold.value+=(held-uniforms.uHold.value)*(1-Math.exp(-dt*2));
      if(dt>.027)slowFrames++;else slowFrames=Math.max(0,slowFrames-1);if(slowFrames>90&&pixelRatio>1){pixelRatio=Math.max(1,pixelRatio-.25);renderer.setPixelRatio(pixelRatio);resize();slowFrames=0;}renderer.render(scene,camera);frame=requestAnimationFrame(render);};frame=requestAnimationFrame(render);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();geometry.dispose();material.dispose();renderer.dispose();};},[getAudioData]);
  return{canvasRef,canvasProps:{onPointerDown:down,onPointerMove:move,onPointerUp:up,onPointerCancel:up},setComposition,beginEmergence};
}
