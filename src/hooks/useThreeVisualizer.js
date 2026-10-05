import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "../vendor/three.module.js";

const MAX_EFFECTS = 12;
const VERTEX = `attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}`;
const FRAGMENT = `precision highp float;
uniform vec2 resolution;uniform float time,low,mid,high,energy,transient,count;uniform vec2 origins[12];uniform float kinds[12],born[12];
#define PI 3.14159265
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
vec3 palette(float k,float v){return .52+.48*cos(6.283*(vec3(.02,.18,.32)*k+v+vec3(0.,.18,.35)));}
float line(float d,float w){return smoothstep(w,0.,abs(d));}
vec3 effect(vec2 p,float k,float age){float a=age*.35;float r=length(p),ang=atan(p.y,p.x);vec3 c=vec3(0.);float f=0.;
 if(k<.5){float wave=p.y+sin(p.x*10.-a*4.)*(.12+low*.16)+sin(p.x*23.+a)*.025;f=line(wave,.055)+line(wave+.12,.018);c=vec3(.06,.62,.9)*f;f+=smoothstep(.025,0.,abs(r-.38-sin(ang*5.+a)*.05))*.15;}
 else if(k<1.5){float plume=abs(p.x+sin(p.y*11.-a*6.)*(.05+.13*p.y));f=smoothstep(.18*(1.-p.y),0.,plume)*smoothstep(-.5,.45,p.y);f*=.45+.8*noise(p*16.+a);c=mix(vec3(1.,.12,.01),vec3(1.,.85,.18),smoothstep(.4,-.4,p.y))*f*(1.+transient);}
 else if(k<2.5){float stem=line(p.x+sin(p.y*8.+a)*.035,.025);float branches=line(abs(p.x)-(.08+.18*abs(sin(p.y*13.))),.018)*step(.0,p.y);f=(stem+branches)*smoothstep(.65,.0,r);c=vec3(.22,.85,.36)*f;}
 else if(k<3.5){float spiral=abs(r-(.055*ang+.11+a*.012));f=line(spiral,.028)+line(fract(ang/PI*3.+r*7.-a)-.5,.08)*smoothstep(.65,.1,r)*.3;c=vec3(.45,.25,1.)*f+vec3(0.,.8,1.)*f*high;}
 else if(k<4.5){f=noise(p*5.+a*.12)*smoothstep(.72,.08,r);f*=.28+.5*smoothstep(.62,.05,r);c=vec3(.65,.78,.9)*f;}
 else if(k<5.5){float stars=pow(hash(floor(p*28.+a*.15)),22.);f=stars*smoothstep(.72,.05,r)*(1.+high*3.);c=mix(vec3(.55,.7,1.),vec3(1.,.82,.35),hash(floor(p*28.)))*f;}
 else if(k<6.5){f=smoothstep(.5,.05,r)*.16+line(r-.32-sin(a)*.015,.035);c=vec3(.4,.48,1.)*f*(1.+low);}
 else{float cells=abs(fract((r*7.+sin(ang*5.+a)*.15))- .5);f=line(cells,.06)*smoothstep(.68,.05,r);c=palette(k,ang/6.28)*f*.75;}
 return c*exp(-age*.018);}
void main(){vec2 uv=(gl_FragCoord.xy-.5*resolution)/resolution.y;vec3 color=vec3(.012,.016,.028);float vignette=1.-.35*length(uv);color+=vec3(.015,.026,.05)*vignette;
 for(int i=0;i<12;i++){if(float(i)>=count)break;vec2 o=(origins[i]-.5*resolution)/resolution.y;float age=time-born[i];vec2 p=uv-o;p*=1./(1.+min(age,5.)*.025);color+=effect(p,kinds[i],age)*(1.+energy*.7);}
 color=1.-exp(-color*1.35);color+=noise(gl_FragCoord.xy)*.018;gl_FragColor=vec4(pow(color,vec3(.82)),1.);}`;

export function useThreeVisualizer(getAudioData) {
  const canvasRef = useRef(null), engine = useRef(null), effects = useRef([]), selected = useRef(0), [count, setCount] = useState(0);
  const setArchetype = useCallback(index => { selected.current = index; }, []);
  const clear = useCallback(() => { effects.current = []; setCount(0); }, []);
  const undo = useCallback(() => { effects.current.pop(); setCount(effects.current.length); }, []);
  const spawn = useCallback(event => { const canvas = canvasRef.current, rect = canvas.getBoundingClientRect(); effects.current.push({ x: (event.clientX - rect.left) / rect.width, y: 1 - (event.clientY - rect.top) / rect.height, kind: selected.current, born: performance.now() / 1000 }); if (effects.current.length > MAX_EFFECTS) effects.current.shift(); setCount(effects.current.length); navigator.vibrate?.(18); }, []);
  useEffect(() => {
    const canvas = canvasRef.current, renderer = new THREE.WebGLRenderer({ canvas }); if (!renderer.gl) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75)); const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera();
    const uniforms = { resolution: { value: new THREE.Vector2() }, time: { value: 0 }, low: { value: 0 }, mid: { value: 0 }, high: { value: 0 }, energy: { value: 0 }, transient: { value: 0 }, count: { value: 0 }, origins: { value: new Float32Array(24) }, kinds: { value: new Float32Array(12) }, born: { value: new Float32Array(12) } };
    const material = new THREE.ShaderMaterial({ uniforms, vertexShader: VERTEX, fragmentShader: FRAGMENT }), geometry = new THREE.PlaneGeometry(2, 2); scene.add(new THREE.Mesh(geometry, material)); engine.current = { renderer, scene, camera };
    const resize = () => { const rect = canvas.getBoundingClientRect(); renderer.setSize(rect.width, rect.height); uniforms.resolution.value.set(canvas.width, canvas.height); }; resize(); const observer = new ResizeObserver(resize); observer.observe(canvas); let frame;
    const render = now => { const audio = getAudioData(), list = effects.current; uniforms.time.value = now / 1000; uniforms.count.value = list.length; Object.assign(uniforms.low,{value:audio.low}); Object.assign(uniforms.mid,{value:audio.mid}); Object.assign(uniforms.high,{value:audio.high}); Object.assign(uniforms.energy,{value:audio.energy}); Object.assign(uniforms.transient,{value:audio.transient}); list.forEach((item,i) => { uniforms.origins.value[i*2]=item.x*canvas.width; uniforms.origins.value[i*2+1]=item.y*canvas.height; uniforms.kinds.value[i]=item.kind; uniforms.born.value[i]=item.born; }); renderer.render(scene,camera); frame=requestAnimationFrame(render); }; frame=requestAnimationFrame(render);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); geometry.dispose(); material.dispose(); renderer.dispose(); };
  }, [getAudioData]);
  return { canvasRef, canvasProps: { onPointerDown: spawn }, count, clear, undo, setArchetype };
}
