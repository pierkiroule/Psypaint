import { useCallback, useEffect, useRef } from "react";
import * as THREE from "../vendor/three.module.js";
import { advanceAudioMotion, initialAudioMotion } from "../utils/audioMotion.js";

const MAX_TOUCHES = 10;
const VERTEX = `attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}`;
const FRAGMENT = `precision highp float;
uniform vec2 uResolution,uPointer;uniform float uTime,uFlow,uShimmer,uDiffusion,uPropagation,uFluidity,uBranching,uOrbitality,uSymmetry,uTurbulence,uParticles,uSignature,uTouch,uHold,uTouchCount;uniform vec3 uPalette[4];uniform vec4 uTouches[10];
#define PI 3.14159265359
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
float fbm(vec2 p){float v=0.;for(int i=0;i<4;i++){v+=noise(p)*.5;p=mat2(1.62,-1.18,1.18,1.62)*p;};return v;}
vec3 palette(float x){x=clamp(x,0.,.999);float k=x*3.;if(k<1.)return mix(uPalette[0],uPalette[1],smoothstep(0.,1.,k));if(k<2.)return mix(uPalette[1],uPalette[2],smoothstep(0.,1.,k-1.));return mix(uPalette[2],uPalette[3],smoothstep(0.,1.,k-2.));}
void main(){
 vec2 uv=(gl_FragCoord.xy-.5*uResolution)/uResolution.y;float t=uTime*.075;vec2 centre=vec2(sin(t*.71+uSignature)*.055,cos(t*.53)*.04);vec2 p=uv-centre;
 float touchWarp=0.;for(int i=0;i<10;i++){if(float(i)>=uTouchCount)break;vec4 m=uTouches[i];vec2 tp=(m.xy-.5)*vec2(uResolution.x/uResolution.y,1.);vec2 d=p-tp;float age=uTime-m.z;float influence=exp(-dot(d,d)*18.)*exp(-age*.48)*m.w;float ring=sin(length(d)*36.-age*3.2)*exp(-length(d)*5.)*exp(-age*.65);p+=normalize(d+vec2(.001))*ring*.016*m.w;p+=vec2(-d.y,d.x)*influence*.09*uOrbitality;touchWarp+=influence;}
 vec2 livePointer=(uPointer-.5)*vec2(uResolution.x/uResolution.y,1.);vec2 pd=p-livePointer;float held=exp(-dot(pd,pd)*13.)*uHold;p-=pd*held*.08;
 float r=length(p),a=atan(p.y,p.x);float folds=mix(2.,7.,uSymmetry);float imperfect=sin(a*3.+t*2.1)*(.16+.17*uTurbulence)+fbm(p*2.3+t)*.32;
 float kaleido=abs(mod(a+PI/folds,2.*PI/folds)-PI/folds);vec2 k=vec2(cos(kaleido),sin(kaleido))*r;k+=vec2(imperfect*.045,-imperfect*.025);
 float spiral=a*uOrbitality*1.15-r*(2.+uOrbitality*5.)+t*(1.+uOrbitality*2.)+uFlow*.16;
 vec2 flow=k*(2.5+uFluidity*1.7);flow+=vec2(sin(spiral),cos(spiral))*(.16*uOrbitality+.035);flow+=vec2(fbm(flow+t),fbm(flow-t+.7))*(.25*uTurbulence);
 float matter=fbm(flow+vec2(t,-t*.7));float membrane=sin((matter+r*.8)*15.-t*3.+sin(spiral)*1.8)*.5+.5;
 float branches=abs(sin(kaleido*(3.+uBranching*7.)+fbm(k*5.-t)*2.4-r*11.));branches=pow(1.-branches,2.2)*uBranching;
 float breathing=.82+.12*sin(t*3.+uFlow*.1)+uTouch*.08;float body=smoothstep(.78,.05,r/breathing+matter*.22-.12);
 float grain=pow(hash(floor((k+t*.08)*uResolution.y*.18)),18.)*uParticles*(.25+uShimmer*.38);
 float filaments=smoothstep(.66,.9,membrane)*(.28+.56*uFluidity)+branches*.58;float core=exp(-r*r*(5.+2.*sin(t*2.)))*(.1+.16*uOrbitality);
 float value=body*(.10+filaments)+grain*body+core+touchWarp*.08+held*.1;float pigment=fract(matter*.72+r*.9+spiral*.055+uSignature*.13);
 vec3 color=palette(pigment)*value;color+=uPalette[3]*(grain*.25+uPropagation*.025*body);color*=1.+uDiffusion*.06;
 float vignette=smoothstep(1.05,.18,length(uv));color=1.-exp(-color*1.28);color=pow(color,vec3(.86));gl_FragColor=vec4(color*vignette,1.);
}`;

export function useThreeVisualizer(getAudioData) {
  const canvasRef = useRef(null), runtime = useRef(null), composition = useRef(null), touches = useRef([]), pointer = useRef({ id: null, x: .5, y: .5, downAt: 0 }), audioMotion = useRef(initialAudioMotion());
  const setComposition = useCallback(value => { composition.current = value; }, []);
  const point = event => { const rect = canvasRef.current.getBoundingClientRect(); return [(event.clientX - rect.left) / rect.width, 1 - (event.clientY - rect.top) / rect.height]; };
  const addTouch = useCallback((event, intensity = 1) => { const [x, y] = point(event); touches.current.push({ x, y, born: performance.now() / 1000, intensity }); if (touches.current.length > MAX_TOUCHES) touches.current.shift(); }, []);
  const down = useCallback(event => { event.preventDefault(); canvasRef.current.setPointerCapture(event.pointerId); const [x, y] = point(event); pointer.current = { id: event.pointerId, x, y, downAt: performance.now() }; addTouch(event, .7); navigator.vibrate?.(8); }, [addTouch]);
  const move = useCallback(event => { if (pointer.current.id !== event.pointerId) return; event.preventDefault(); const [x, y] = point(event); const distance = Math.hypot(x - pointer.current.x, y - pointer.current.y); pointer.current.x = x; pointer.current.y = y; if (distance > .012) addTouch(event, Math.min(1.35, .6 + distance * 8)); }, [addTouch]);
  const up = useCallback(event => { if (pointer.current.id === event.pointerId) { addTouch(event, .5); pointer.current.id = null; } }, [addTouch]);

  useEffect(() => {
    const canvas = canvasRef.current, renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
    if (!renderer.gl) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera();
    const uniforms = {
      uResolution: { value: new THREE.Vector2() }, uPointer: { value: new THREE.Vector2(.5, .5) }, uTime: { value: 0 }, uFlow: { value: 0 }, uShimmer: { value: 0 }, uDiffusion: { value: 0 }, uPropagation: { value: 0 },
      uFluidity: { value: .6 }, uBranching: { value: .4 }, uOrbitality: { value: .5 }, uSymmetry: { value: .6 }, uTurbulence: { value: .3 }, uParticles: { value: .5 }, uSignature: { value: 1 }, uTouch: { value: 0 }, uHold: { value: 0 }, uTouchCount: { value: 0 },
      uPalette: { value: [[.05,.12,.16],[.12,.35,.38],[.4,.58,.5],[.8,.75,.6]], type: "3fv" }, uTouches: { value: new Float32Array(MAX_TOUCHES * 4), type: "4fv" }
    };
    const material = new THREE.ShaderMaterial({ uniforms, vertexShader: VERTEX, fragmentShader: FRAGMENT }), geometry = new THREE.PlaneGeometry(2, 2); scene.add(new THREE.Mesh(geometry, material)); runtime.current = { uniforms };
    const resize = () => { const rect = canvas.getBoundingClientRect(); renderer.setSize(rect.width, rect.height); uniforms.uResolution.value.set(canvas.width, canvas.height); };
    resize(); const observer = new ResizeObserver(resize); observer.observe(canvas); let frame;
    const render = now => {
      const dt = Math.min(.05, (now - (render.last || now)) / 1000); render.last = now;
      const c = composition.current, rawAudio = getAudioData(), response = c?.audioResponse || { low: .5, mid: .5, high: .3 };
      const audio = { ...rawAudio, low: rawAudio.low * response.low, mid: rawAudio.mid * response.mid, high: rawAudio.high * response.high };
      const motion = audioMotion.current = advanceAudioMotion(audioMotion.current, audio, dt);
      uniforms.uTime.value = now / 1000; uniforms.uFlow.value = motion.flow; uniforms.uShimmer.value = motion.shimmer; uniforms.uDiffusion.value = motion.diffusion; uniforms.uPropagation.value = motion.propagation;
      if (c) { uniforms.uFluidity.value += (c.fluidity - uniforms.uFluidity.value) * .025; uniforms.uBranching.value += (c.branching - uniforms.uBranching.value) * .025; uniforms.uOrbitality.value += (c.orbitality - uniforms.uOrbitality.value) * .025; uniforms.uSymmetry.value += (c.symmetry - uniforms.uSymmetry.value) * .025; uniforms.uTurbulence.value += (c.turbulence - uniforms.uTurbulence.value) * .025; uniforms.uParticles.value += (c.particles - uniforms.uParticles.value) * .025; uniforms.uSignature.value = c.signature; uniforms.uPalette.value = c.palette; }
      const p = pointer.current, held = p.id === null ? 0 : Math.min(1, (now - p.downAt) / 1300); uniforms.uPointer.value.set(p.x, p.y); uniforms.uHold.value += (held - uniforms.uHold.value) * .06;
      const activeTouches = touches.current.filter(item => now / 1000 - item.born < 6); touches.current = activeTouches; uniforms.uTouchCount.value = activeTouches.length; uniforms.uTouch.value = Math.max(held, activeTouches.length ? .5 : 0);
      activeTouches.forEach((item, index) => { const offset = index * 4; uniforms.uTouches.value[offset] = item.x; uniforms.uTouches.value[offset + 1] = item.y; uniforms.uTouches.value[offset + 2] = item.born; uniforms.uTouches.value[offset + 3] = item.intensity; });
      renderer.render(scene, camera); frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render); return () => { cancelAnimationFrame(frame); observer.disconnect(); geometry.dispose(); material.dispose(); renderer.dispose(); };
  }, [getAudioData]);
  return { canvasRef, canvasProps: { onPointerDown: down, onPointerMove: move, onPointerUp: up, onPointerCancel: up }, setComposition };
}
