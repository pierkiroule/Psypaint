import { useCallback, useEffect, useRef } from "react";
import * as THREE from "../vendor/three.module.js";
import { advanceAudioMotion, initialAudioMotion } from "../utils/audioMotion.js";
import { GENOME_KEYS } from "../data/archetypes.js";
import { advanceOrientationView } from "../utils/gyroView.js";
import { getPareidoliaQuality, PareidoliaLayer } from "../visuals/PareidoliaLayer.js";

// The ray-marched world is the scene backdrop; geometry layers occupy the
// depth range in front of it and are tested against the same depth buffer.
const VERTEX = `attribute vec2 position;void main(){gl_Position=vec4(position,.999,1.);}`;
export const FRAGMENT = `precision highp float;
uniform vec2 uResolution,uTouch,uTouchVelocity,uView;uniform float uTime,uEmergence,uSeed,uTouchStrength,uHold,uFlow,uShimmer,uDiffusion,uPropagation,uPulse,uProjection,uLow,uMid,uHigh,uEnergy;
uniform float uFluidity,uBranching,uOrbitality,uTurbulence,uDiffusionGenome,uMembrane,uSparkle,uVerticality,uSymmetry,uSoftness,uDensity,uLuminosity,uDepth;uniform vec3 uPalette[4];
#define PI 3.14159265359
float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float v=0.,a=.54;for(int i=0;i<4;i++){v+=a*noise(p);p=mat3(1.43,1.15,.31,-1.07,1.31,.52,.44,-.37,1.63)*p+1.7;a*=.48;}return v;}
vec3 palette(float x){x=clamp(x,0.,.999)*3.;if(x<1.)return mix(uPalette[0],uPalette[1],smoothstep(0.,1.,x));if(x<2.)return mix(uPalette[1],uPalette[2],smoothstep(0.,1.,x-1.));return mix(uPalette[2],uPalette[3],smoothstep(0.,1.,x-2.));}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float boxSdf(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
float projectiveForm(vec3 p,float macro){
 // A skewed, repeating family of parallelepipeds: bass controls scale and
 // depth, mids shear the planes, and attacks project them toward the camera.
 float beat=uProjection+uPulse*.85;float spacing=mix(1.45,.9,beat);
 p.z+=uPulse*.42*exp(-length(p.xy)*.7);p.xy=rot(macro*.07+uOrbitality*.22)*p.xy;
 p.x+=p.y*(.18+.42*uMid);p.z+=p.x*(.08+.22*uHigh);
 vec3 cell=mod(p+spacing*.5,spacing)-spacing*.5;
 vec3 size=vec3(.18+.16*uLow,.11+.13*uMid,.24+.24*uEnergy);
 float shell=abs(boxSdf(cell,size))-(.018+.018*uHigh);
 float planes=abs(max(max(abs(cell.x)/size.x,abs(cell.y)/size.y),abs(cell.z)/size.z)-1.);
 return exp(-shell*(34.-uProjection*10.))*mix(.55,1.,smoothstep(.18,0.,planes));
}
float organicField(vec3 p,float macro){
 p.xz=rot(.2*sin(macro*.31)+uOrbitality*p.y*.16)*p.xz;
 vec3 drift=vec3(macro*.17,-macro*.11,macro*.08);float broad=fbm(p*(.55+uDensity*.2)+drift);
 p+=vec3(broad-.5,fbm(p*.73-drift)-.5,broad-.5)*(.45+.6*uTurbulence);
 float fine=fbm(p*(1.25+uBranching*.65)-drift*.7);
 float folds=abs(sin((p.x+p.z)*mix(1.4,4.2,uSymmetry)+fine*4.));
 return mix(broad,fine,.48)+pow(1.-folds,4.)*uBranching*.18;
}
void main(){
 vec2 uv=(gl_FragCoord.xy-.5*uResolution)/uResolution.y;float macro=uTime*.055+uSeed*9.;
 vec3 rd=normalize(vec3(uv,1.15));rd.yz=rot(-uView.y)*rd.yz;rd.xz=rot(-uView.x)*rd.xz;
 vec3 ro=vec3(sin(macro*.11+uSeed)*.22,cos(macro*.09)*.12,-1.4+sin(macro*.07)*.16);ro.xz=rot(-uView.x*.14)*ro.xz;
 vec2 touch=(uTouch-.5)*vec2(uResolution.x/uResolution.y,1.);float touchRay=exp(-dot(uv-touch,uv-touch)*12.)*uTouchStrength;
 vec3 color=vec3(0.);float transmittance=1.,nearestGlow=0.;
 for(int i=0;i<24;i++){
  float fi=float(i),travel=.10+fi*.17;vec3 pos=ro+rd*travel;pos+=vec3(uTouchVelocity,-uHold*.04)*touchRay*exp(-travel*.28);
  float field=organicField(pos,macro+uMid*.18);float breath=.5+.5*sin(uTime*.17+field*3.+sin(uTime*.071));
  float veil=smoothstep(.56-.09*uDensity-.025*uLow,.82+.08*uSoftness,field+.035*breath);
  float filaments=pow(max(0.,1.-abs(sin((field+pos.y*.16)*19.+macro*.3))),7.)*uBranching;
  float membrane=pow(max(0.,1.-abs(field-(.63+.035*sin(macro*.23)))),2.)*uMembrane*5.;
  float sparkleSeed=hash(floor(pos*9.)+vec3(uSeed));
  float sparkle=step(.996-sparkleSeed*.012,hash(floor(pos*25.+uSeed)))*uSparkle*(.25+.75*uHigh);
  float solid=projectiveForm(pos+vec3(0.,macro*.025,macro*.04),macro)*(.012+.042*uProjection+.038*uPulse);
  float density=(veil*(.035+.045*uDensity)+filaments*.028+membrane*.018+sparkle*.12+solid)*smoothstep(0.,1.,uEmergence);
  density*=.72+.28*noise(pos*2.+macro*.1);float shade=fract(field*.72+travel*.07+pos.y*.11+uSeed*.23);
  vec3 pigment=mix(palette(shade),palette(fract(shade+.32+uHigh*.16)),smoothstep(.015,.08,solid));float depthLight=mix(.55,1.15,exp(-travel*.2))*mix(.8,1.15,uLuminosity);
  color+=transmittance*pigment*density*depthLight;nearestGlow=max(nearestGlow,touchRay*exp(-travel*.55));transmittance*=1.-clamp(density,0.,.22);
 }
 color+=uPalette[3]*(nearestGlow*.045+uPropagation*.025+uShimmer*.018);color*=.92+.08*uEnergy;
 float vignette=smoothstep(1.1,.22,length(uv));color=1.-exp(-color*1.75);gl_FragColor=vec4(pow(color*vignette,vec3(.88)),1.);
}`

const cap = (value, min, max) => Math.max(min, Math.min(max, value));
export const flattenPalette = palette => new Float32Array(palette.flat());
export function useThreeVisualizer(getAudioData) {
  const canvasRef=useRef(null), composition=useRef(null), pointer=useRef({id:null,x:.5,y:.5,vx:0,vy:0,tx:.5,ty:.5,strength:0,downAt:0}), orientation=useRef({state:null,x:0,y:0,tx:0,ty:0}), audioMotion=useRef(initialAudioMotion()), born=useRef(performance.now());
  const setComposition=useCallback(value=>{composition.current=value;},[]);
  const point=event=>{const rect=canvasRef.current.getBoundingClientRect();return[(event.clientX-rect.left)/rect.width,1-(event.clientY-rect.top)/rect.height];};
  const down=useCallback(event=>{event.preventDefault();canvasRef.current.setPointerCapture(event.pointerId);const [x,y]=point(event);pointer.current={...pointer.current,id:event.pointerId,tx:x,ty:y,downAt:performance.now(),strength:.35};if(typeof DeviceOrientationEvent!=="undefined"&&typeof DeviceOrientationEvent.requestPermission==="function")DeviceOrientationEvent.requestPermission().catch(()=>{});navigator.vibrate?.(8);},[]);
  const move=useCallback(event=>{const p=pointer.current;if(p.id!==event.pointerId)return;event.preventDefault();const[x,y]=point(event);p.vx+=(x-p.tx)*.34;p.vy+=(y-p.ty)*.34;p.tx=x;p.ty=y;p.strength=cap(p.strength+.08,0,1);},[]);
  const up=useCallback(event=>{const p=pointer.current;if(p.id!==event.pointerId)return;p.id=null;p.strength=Math.max(p.strength,.55);},[]);
  const beginEmergence=useCallback(()=>{born.current=performance.now();},[]);
  useEffect(()=>{const canvas=canvasRef.current,renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:"high-performance"});if(!renderer.gl)return;
    let pixelRatio=Math.min(devicePixelRatio||1,1.5),slowFrames=0;renderer.setPixelRatio(pixelRatio);const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera();
    const uniforms={uResolution:{value:new THREE.Vector2()},uTouch:{value:new THREE.Vector2(.5,.5)},uTouchVelocity:{value:new THREE.Vector2()},uView:{value:new THREE.Vector2()},uTime:{value:0},uEmergence:{value:0},uSeed:{value:.4},uTouchStrength:{value:0},uHold:{value:0},uFlow:{value:0},uShimmer:{value:0},uDiffusion:{value:0},uPropagation:{value:0},uPulse:{value:0},uProjection:{value:0},uLow:{value:0},uMid:{value:0},uHigh:{value:0},uEnergy:{value:0},uPalette:{value:flattenPalette([[.05,.12,.16],[.12,.35,.38],[.4,.58,.5],[.8,.75,.6]]),type:"3fv"}};
    // Shader names mirror genome traits; diffusion needs a suffix to avoid the audio uniform.
    GENOME_KEYS.forEach(key=>{const name=key==="diffusion"?"uDiffusionGenome":`u${key[0].toUpperCase()}${key.slice(1)}`;uniforms[name]??={value:.4};});
    const material=new THREE.ShaderMaterial({uniforms,vertexShader:VERTEX,fragmentShader:FRAGMENT}),geometry=new THREE.PlaneGeometry(2,2);scene.add(new THREE.Mesh(geometry,material));const pareidolia=new PareidoliaLayer();pareidolia.init(scene,renderer);let generatedComposition=null,quality;
    const resize=()=>{const rect=canvas.getBoundingClientRect();renderer.setSize(rect.width,rect.height);uniforms.uResolution.value.set(canvas.width,canvas.height);quality=getPareidoliaQuality(rect.width,pixelRatio,navigator.hardwareConcurrency||4);pareidolia.resize(rect.width,pixelRatio);generatedComposition=null;};const orient=event=>{const o=orientation.current,result=advanceOrientationView(o.state,event,screen.orientation?.angle||window.orientation||0);o.state=result;o.tx=result.x;o.ty=result.y;};resize();const observer=new ResizeObserver(resize);observer.observe(canvas);window.addEventListener("deviceorientation",orient,{passive:true});let frame,last=performance.now();
    const render=now=>{const dt=Math.min(.05,(now-last)/1000);last=now;const c=composition.current,raw=getAudioData(),response=c?.audioResponse||{low:.5,mid:.5,high:.3};const audio={...raw,low:raw.low*response.low,mid:raw.mid*response.mid,high:raw.high*response.high};const motion=audioMotion.current=advanceAudioMotion(audioMotion.current,audio,dt);
      uniforms.uLow.value=motion.low;uniforms.uMid.value=motion.mid;uniforms.uHigh.value=motion.high;uniforms.uEnergy.value=motion.energy;uniforms.uFlow.value=motion.flow;uniforms.uShimmer.value=motion.shimmer;uniforms.uDiffusion.value=motion.diffusion;uniforms.uPropagation.value=motion.propagation;uniforms.uPulse.value=motion.pulse;uniforms.uProjection.value=motion.projection;uniforms.uTime.value=now/1000;uniforms.uEmergence.value=cap((now-born.current)/3200,0,1);
      if(c){GENOME_KEYS.forEach(key=>{const name=key==="diffusion"?"uDiffusionGenome":`u${key[0].toUpperCase()}${key.slice(1)}`;uniforms[name].value+=(c[key]-uniforms[name].value)*(1-Math.exp(-dt*.5));});uniforms.uSeed.value+=(c.seed-uniforms.uSeed.value)*(1-Math.exp(-dt*.35));uniforms.uPalette.value.set(c.palette.flat());if(generatedComposition!==c){pareidolia.generateFromEmojis(c,quality);generatedComposition=c;}}
      const p=pointer.current;p.vx+=(p.tx-p.x)*dt*8;p.vy+=(p.ty-p.y)*dt*8;p.vx*=Math.exp(-dt*5);p.vy*=Math.exp(-dt*5);p.x+=p.vx;p.y+=p.vy;p.strength*=Math.exp(-dt*(p.id===null?.72:.08));const held=p.id===null?0:cap((now-p.downAt)/1600,0,1);uniforms.uTouch.value.set(p.x,p.y);uniforms.uTouchVelocity.value.set(p.vx,p.vy);uniforms.uTouchStrength.value=p.strength;uniforms.uHold.value+=(held-uniforms.uHold.value)*(1-Math.exp(-dt*2));const o=orientation.current;o.x+=(o.tx-o.x)*(1-Math.exp(-dt*3));o.y+=(o.ty-o.y)*(1-Math.exp(-dt*3));uniforms.uView.value.set(o.x,o.y);
      if(dt>.027)slowFrames++;else slowFrames=Math.max(0,slowFrames-1);if(slowFrames>90&&pixelRatio>1){pixelRatio=Math.max(1,pixelRatio-.25);renderer.setPixelRatio(pixelRatio);resize();slowFrames=0;}renderer.render(scene,camera);pareidolia.update(dt,motion,p,o);frame=requestAnimationFrame(render);};frame=requestAnimationFrame(render);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener("deviceorientation",orient);pareidolia.dispose();geometry.dispose();material.dispose();renderer.dispose();};},[getAudioData]);
  return{canvasRef,canvasProps:{onPointerDown:down,onPointerMove:move,onPointerUp:up,onPointerCancel:up},setComposition,beginEmergence};
}
