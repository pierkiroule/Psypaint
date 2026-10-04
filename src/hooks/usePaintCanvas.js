import { useCallback, useEffect, useRef, useState } from "react";
import { PALETTES } from "../data/palettes";

const hash = (n, seed) => { const x = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453; return x - Math.floor(x); };
function pathStroke(ctx, points) { if (!points.length) return; ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y); for (let i=1;i<points.length-1;i++) { const p=points[i], n=points[i+1]; ctx.quadraticCurveTo(p.x,p.y,(p.x+n.x)/2,(p.y+n.y)/2); } const p=points.at(-1); ctx.lineTo(p.x,p.y); ctx.stroke(); }
function organicBlob(ctx,x,y,r,color,alpha,seed) { ctx.beginPath(); for(let i=0;i<=18;i++){const a=i/18*Math.PI*2, rr=r*(.84+.14*Math.sin(a*3+seed)+.08*Math.sin(a*7+seed*2)), px=x+Math.cos(a)*rr, py=y+Math.sin(a)*rr; i?ctx.lineTo(px,py):ctx.moveTo(px,py);} ctx.fillStyle=color;ctx.globalAlpha=alpha;ctx.fill(); }
function drawStroke(ctx,s,w,h,time,energy) {
  const pts=s.points.map(p=>({x:p.x*w,y:p.y*h,p:p.p})); if(!pts.length)return; const [a,b]=s.colors;
  ctx.lineCap="round";ctx.lineJoin="round";
  if(pts.length===1){organicBlob(ctx,pts[0].x,pts[0].y,10+energy*12,a,.32,s.seed);return;}
  if(s.brush==="wash") { for(let layer=3;layer>=0;layer--){ctx.strokeStyle=layer%2?a:b;ctx.lineWidth=(15+layer*8)*(1+energy*.5);ctx.globalAlpha=.045+layer*.018; const wave=pts.map((p,i)=>({x:p.x+Math.sin(i*.23+time+layer)*layer*2.2,y:p.y+Math.cos(i*.19+time+layer)*layer*2.2}));pathStroke(ctx,wave);} ctx.strokeStyle=a;ctx.lineWidth=7;ctx.globalAlpha=.14;pathStroke(ctx,pts); }
  if(s.brush==="ink") { ctx.strokeStyle=s.ink;ctx.globalAlpha=.82; for(let i=1;i<pts.length;i++){ctx.lineWidth=.8+pts[i].p*3.2;ctx.beginPath();ctx.moveTo(pts[i-1].x,pts[i-1].y);ctx.lineTo(pts[i].x,pts[i].y);ctx.stroke();} }
  if(s.brush==="pencil") { ctx.setLineDash([5,1.5,2,1]); for(let l=0;l<3;l++){ctx.strokeStyle=l===1?b:a;ctx.lineWidth=.8+l*.35;ctx.globalAlpha=.5;pathStroke(ctx,pts.map((p,i)=>({x:p.x+(hash(i+l*90,s.seed)-.5)*2,y:p.y+(hash(i*3+l*70,s.seed)-.5)*2})));}ctx.setLineDash([]); }
  if(s.brush==="bloom") {ctx.strokeStyle=s.ink;ctx.lineWidth=1;ctx.globalAlpha=.35;pathStroke(ctx,pts);for(let i=4;i<pts.length;i+=7){const p=pts[i],r=5+hash(i,s.seed)*8;for(let k=0;k<5;k++){const an=k/5*Math.PI*2+i;organicBlob(ctx,p.x+Math.cos(an)*r,p.y+Math.sin(an)*r,r*.55,k%2?a:b,.18,s.seed+k);}}}
  if(s.brush==="leaf") {ctx.strokeStyle=s.ink;ctx.lineWidth=1.2;ctx.globalAlpha=.45;pathStroke(ctx,pts);for(let i=3;i<pts.length;i+=4){const p=pts[i],q=pts[i-1],side=i%8<4?1:-1,an=Math.atan2(p.y-q.y,p.x-q.x)+side*.95,len=11+hash(i,s.seed)*14;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(an);ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(len*.55,-len*.35,len,0);ctx.quadraticCurveTo(len*.55,len*.35,0,0);ctx.fillStyle=side>0?a:b;ctx.globalAlpha=.38;ctx.fill();ctx.restore();}}
}
export function usePaintCanvas({ brush, palette, paintNote, endNote, getEnergy }) {
  const canvasRef=useRef(null), strokes=useRef([]), current=useRef(null), frame=useRef(0), state=useRef({brush,palette}); const [count,setCount]=useState(0);
  state.current={brush,palette};
  const render=useCallback((time=0)=>{const canvas=canvasRef.current;if(!canvas)return;const ctx=canvas.getContext("2d"),w=canvas.clientWidth,h=canvas.clientHeight,pal=PALETTES[state.current.palette];ctx.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over";const bg=ctx.createRadialGradient(w*.38,h*.3,0,w*.5,h*.5,w*.7);bg.addColorStop(0,pal.paper[0]);bg.addColorStop(1,pal.paper[1]);ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);ctx.globalCompositeOperation="multiply";const energy=getEnergy();strokes.current.forEach(s=>drawStroke(ctx,s,w,h,time/1800,energy));ctx.globalCompositeOperation="source-over";ctx.globalAlpha=.035;for(let i=0;i<120;i++){ctx.fillStyle=i%3?"#5e4b37":"#fff";ctx.fillRect(hash(i,2)*w,hash(i,7)*h,hash(i,9)*18+2,.5);}frame.current=requestAnimationFrame(render);},[getEnergy]);
  useEffect(()=>{const canvas=canvasRef.current;if(!canvas)return;const resize=()=>{const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);};resize();const ro=new ResizeObserver(resize);ro.observe(canvas);frame.current=requestAnimationFrame(render);return()=>{ro.disconnect();cancelAnimationFrame(frame.current);};},[render]);
  const point=e=>{const r=canvasRef.current.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height,p:e.pressure||.5};};
  const onPointerDown=e=>{if(e.button!==0&&e.pointerType==="mouse")return;canvasRef.current.setPointerCapture(e.pointerId);const pal=PALETTES[state.current.palette],i=Math.floor(Math.random()*3);current.current={brush:state.current.brush,colors:[pal.colors[i],pal.colors[(i+1)%3]],ink:pal.ink,seed:Math.random()*100,points:[]};strokes.current.push(current.current);current.current.points.push(point(e));setCount(strokes.current.length);paintNote(point(e).x,point(e).y);};
  const onPointerMove=e=>{if(!current.current)return;const p=point(e),last=current.current.points.at(-1);if(Math.hypot(p.x-last.x,p.y-last.y)<.003)return;current.current.points.push(p);paintNote(p.x,p.y);};
  const stop=()=>{current.current=null;endNote();};
  const undo=useCallback(()=>{strokes.current.pop();setCount(strokes.current.length);},[]); const clear=useCallback(()=>{strokes.current=[];setCount(0);},[]);
  const download=useCallback(()=>{const a=document.createElement("a");a.download=`psypaint-${Date.now()}.png`;a.href=canvasRef.current.toDataURL("image/png");a.click();},[]);
  return { canvasRef, canvasProps:{onPointerDown,onPointerMove,onPointerUp:stop,onPointerCancel:stop,onPointerLeave:stop}, undo, clear, download, count };
}
