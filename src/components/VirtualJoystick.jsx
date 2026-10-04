import { useEffect, useRef, useState } from "react";

const DEAD_ZONE = .1;

export function VirtualJoystick({ onInput }) {
  const baseRef=useRef(null),knobRef=useRef(null),pointerRef=useRef(null);
  const [active,setActive]=useState(false);

  const emit=(x,y,magnitude)=>onInput({x,y,magnitude});
  const update=e=>{
    if(pointerRef.current!==e.pointerId)return;
    const rect=baseRef.current.getBoundingClientRect(),radius=(rect.width-knobRef.current.offsetWidth)/2;
    const dx=e.clientX-(rect.left+rect.width/2),dy=e.clientY-(rect.top+rect.height/2),distance=Math.hypot(dx,dy);
    const limited=Math.min(distance,radius),angle=Math.atan2(dy,dx),knobX=Math.cos(angle)*limited,knobY=Math.sin(angle)*limited;
    knobRef.current.style.transform=`translate3d(${knobX}px,${knobY}px,0)`;
    const raw=radius?Math.min(distance/radius,1):0,effective=raw<=DEAD_ZONE?0:(raw-DEAD_ZONE)/(1-DEAD_ZONE);
    emit(distance?dx/distance*effective:0,distance?dy/distance*effective:0,effective);
  };
  const start=e=>{
    if(pointerRef.current!==null)return;
    e.preventDefault();pointerRef.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);setActive(true);update(e);
  };
  const stop=e=>{
    if(pointerRef.current!==e.pointerId)return;
    pointerRef.current=null;setActive(false);knobRef.current.style.transform="translate3d(0,0,0)";emit(0,0,0);
  };
  const key=(e,pressed)=>{
    const directions={ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0],ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1]},direction=directions[e.key];
    if(!direction)return;e.preventDefault();const [x,y]=pressed?direction:[0,0];knobRef.current.style.transform=`translate3d(${x*28}px,${y*28}px,0)`;emit(x,y,pressed?1:0);
  };
  useEffect(()=>()=>onInput({x:0,y:0,magnitude:0}),[onInput]);

  return <div ref={baseRef} className={`travel-joystick ${active?"is-active":""}`} role="application" tabIndex="0" aria-label="Manche de navigation : haut pour avancer, gauche et droite pour virer" onPointerDown={start} onPointerMove={update} onPointerUp={stop} onPointerCancel={stop} onKeyDown={e=>key(e,true)} onKeyUp={e=>key(e,false)}><span ref={knobRef}/><small>NAVIGATION</small></div>;
}
