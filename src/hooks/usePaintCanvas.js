import { useCallback, useEffect, useRef, useState } from "react";
import { PALETTES } from "../data/palettes";
import { renderPaintStroke } from "../utils/paintRenderer";

const hash = (n, seed) => { const x = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453; return x - Math.floor(x); };
export function usePaintCanvas({ brush, palette, color, size, opacity, audioReactive, getEnergy }) {
  const canvasRef=useRef(null), strokes=useRef([]), current=useRef(null), frame=useRef(0), state=useRef({brush,palette,color,size,opacity,audioReactive}); const [count,setCount]=useState(0);
  state.current={brush,palette,color,size,opacity,audioReactive};
  const render=useCallback((time=0)=>{const canvas=canvasRef.current;if(!canvas)return;const ctx=canvas.getContext("2d"),w=canvas.clientWidth,h=canvas.clientHeight,pal=PALETTES[state.current.palette];ctx.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over";const bg=ctx.createRadialGradient(w*.38,h*.3,0,w*.5,h*.5,w*.7);bg.addColorStop(0,pal.paper[0]);bg.addColorStop(1,pal.paper[1]);ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);const energy=getEnergy();strokes.current.forEach(s=>renderPaintStroke(ctx,s,s.points.map(p=>({x:p.x*w,y:p.y*h,p:p.p})),time/1800,energy));ctx.globalCompositeOperation="source-over";ctx.globalAlpha=.035;for(let i=0;i<120;i++){ctx.fillStyle=i%3?"#5e4b37":"#fff";ctx.fillRect(hash(i,2)*w,hash(i,7)*h,hash(i,9)*18+2,.5);}frame.current=requestAnimationFrame(render);},[getEnergy]);
  useEffect(()=>{const canvas=canvasRef.current;if(!canvas)return;const resize=()=>{const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);};resize();const ro=new ResizeObserver(resize);ro.observe(canvas);frame.current=requestAnimationFrame(render);return()=>{ro.disconnect();cancelAnimationFrame(frame.current);};},[render]);
  const point=e=>{const r=canvasRef.current.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height,p:e.pressure||.5};};
  const onPointerDown=e=>{if(e.button!==0&&e.pointerType==="mouse")return;canvasRef.current.setPointerCapture(e.pointerId);current.current={brush:state.current.brush,color:state.current.color,size:state.current.size,opacity:state.current.opacity,audioReactive:state.current.audioReactive,seed:Math.random()*100,points:[]};strokes.current.push(current.current);current.current.points.push(point(e));setCount(strokes.current.length);};
  const onPointerMove=e=>{if(!current.current)return;const p=point(e),last=current.current.points.at(-1);if(Math.hypot(p.x-last.x,p.y-last.y)<.003)return;current.current.points.push(p);};
  const stop=()=>{current.current=null;};
  const undo=useCallback(()=>{strokes.current.pop();setCount(strokes.current.length);},[]); const clear=useCallback(()=>{strokes.current=[];setCount(0);},[]);
  const download=useCallback(()=>{const a=document.createElement("a");a.download=`psypaint-${Date.now()}.png`;a.href=canvasRef.current.toDataURL("image/png");a.click();},[]);
  const getStrokes=useCallback(()=>strokes.current,[]);
  return { canvasRef, canvasProps:{onPointerDown,onPointerMove,onPointerUp:stop,onPointerCancel:stop,onPointerLeave:stop}, undo, clear, download, getStrokes, count };
}
