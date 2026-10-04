import { useCallback, useEffect, useRef, useState } from "react";
import { Brand } from "./components/Brand";
import { BrushRail } from "./components/BrushRail";
import { BrushSettings } from "./components/BrushSettings";
import { ControlDock } from "./components/ControlDock";
import { Icon } from "./components/Icon";
import { Immersive360 } from "./components/Immersive360";
import { PalettePicker } from "./components/PalettePicker";
import { useAudioEngine } from "./hooks/useAudioEngine";
import { usePaintCanvas } from "./hooks/usePaintCanvas";
import { PALETTES } from "./data/palettes";

export default function App() {
  const immersiveCanvas=useRef(null);
  const [brush,setBrush]=useState("wash"), [palette,setPalette]=useState("jardin"), [color,setColor]=useState("#557A50"), [size,setSize]=useState(24), [opacity,setOpacity]=useState(.65), [audioReactive,setAudioReactive]=useState(true), [toast,setToast]=useState(""), [immersive,setImmersive]=useState(false);
  const notify=useCallback(message=>setToast(message),[]); const audio=useAudioEngine(notify);
  const paint=usePaintCanvas({brush,palette,color,size,opacity,audioReactive,getEnergy:audio.getEnergy});
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(""),2200);return()=>clearTimeout(timer);},[toast]);
  useEffect(()=>{const key=e=>{if(e.key==="Escape")setImmersive(false);if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){e.preventDefault();paint.undo();}};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);},[paint.undo]);
  const undo=()=>{paint.undo();notify("Dernier geste annulé");}, clear=()=>{paint.clear();notify("La toile respire à nouveau");}, download=()=>{if(immersive&&immersiveCanvas.current){const a=document.createElement("a");a.download=`psypaint360-${Date.now()}.png`;a.href=immersiveCanvas.current.toDataURL("image/png");a.click();}else paint.download();notify("Votre œuvre a été téléchargée");};
  return <main className={immersive?"app is-immersive":"app"}>
    <div className="ambient ambient-one"/><div className="ambient ambient-two"/>
    <Brand/><p className="intro-copy"><span>UN ESPACE POUR</span><strong>peindre ce qui<br/>ne se dit pas.</strong></p>
    <BrushRail value={brush} onChange={setBrush}/>
    <BrushSettings color={color} size={size} opacity={opacity} audioReactive={audioReactive} onColor={setColor} onSize={setSize} onOpacity={setOpacity} onAudioReactive={setAudioReactive}/>
    <section className="studio" aria-label="Toile de peinture interactive">
      <div className="canvas-shell"><div className="paper-edge"/><canvas ref={paint.canvasRef} {...paint.canvasProps} aria-label="Dessinez ici avec la souris ou le doigt"/><div className="canvas-glint"/><span className="paper-caption">GESTE · MATIÈRE · ÉCOUTE</span></div>
      <p className="canvas-hint"><span className="gesture-icon" aria-hidden="true">⌁</span><span><strong>Tracez librement</strong><small>La musique anime la matière</small></span></p>
    </section>
    <PalettePicker value={palette} onChange={value=>{setPalette(value);setColor(PALETTES[value].colors[0]);}}/>
    <ControlDock playing={audio.playing} fileName={audio.fileName} onSound={audio.toggle} onAudioFile={audio.loadFile} onUndo={undo} onClear={clear} onDownload={download} onImmersive={()=>setImmersive(true)} canUndo={paint.count>0}/>
    <Immersive360 active={immersive} palette={palette} getStrokes={paint.getStrokes} getEnergy={audio.getEnergy} canvasRef={immersiveCanvas} onExit={()=>setImmersive(false)}/>
    <p className="footer-note">Une expérience audio-réactive.<br/>Rien n’est enregistré sans vous.</p>
    {immersive&&<div className="immersive-ui"><p><span>MODE IMMERSIF</span>La toile devient paysage</p><button onClick={()=>setImmersive(false)} aria-label="Quitter le mode immersion"><Icon name="close"/></button></div>}
    <div className={`toast ${toast?"is-visible":""}`} role="status">{toast}</div>
  </main>;
}
