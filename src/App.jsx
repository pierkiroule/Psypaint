import { useCallback, useEffect, useState } from "react";
import { Brand } from "./components/Brand";
import { BrushRail } from "./components/BrushRail";
import { ControlDock } from "./components/ControlDock";
import { Icon } from "./components/Icon";
import { PalettePicker } from "./components/PalettePicker";
import { useAudioEngine } from "./hooks/useAudioEngine";
import { usePaintCanvas } from "./hooks/usePaintCanvas";

export default function App() {
  const [brush,setBrush]=useState("wash"), [palette,setPalette]=useState("jardin"), [toast,setToast]=useState(""), [immersive,setImmersive]=useState(false);
  const notify=useCallback(message=>setToast(message),[]); const audio=useAudioEngine(notify);
  const paint=usePaintCanvas({brush,palette,paintNote:audio.paintNote,endNote:audio.endNote,getEnergy:audio.getEnergy});
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(""),2200);return()=>clearTimeout(timer);},[toast]);
  useEffect(()=>{const key=e=>{if(e.key==="Escape")setImmersive(false);if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){e.preventDefault();paint.undo();}};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);},[paint.undo]);
  const undo=()=>{paint.undo();notify("Dernier geste annulé");}, clear=()=>{paint.clear();notify("La toile respire à nouveau");}, download=()=>{paint.download();notify("Votre œuvre a été téléchargée");};
  return <main className={immersive?"app is-immersive":"app"}>
    <div className="ambient ambient-one"/><div className="ambient ambient-two"/>
    <Brand/><p className="intro-copy"><span>UN ESPACE POUR</span><strong>peindre ce qui<br/>ne se dit pas.</strong></p>
    <BrushRail value={brush} onChange={setBrush}/>
    <section className="studio" aria-label="Toile de peinture interactive">
      <div className="canvas-shell"><div className="paper-edge"/><canvas ref={paint.canvasRef} {...paint.canvasProps} aria-label="Dessinez ici avec la souris ou le doigt"/><div className="canvas-glint"/><span className="paper-caption">GESTE · MATIÈRE · ÉCOUTE</span></div>
      <p className="canvas-hint"><span className="gesture-icon" aria-hidden="true">⌁</span><span><strong>Tracez librement</strong><small>Votre geste façonne le son et la matière</small></span></p>
    </section>
    <PalettePicker value={palette} onChange={setPalette}/>
    <ControlDock playing={audio.playing} onSound={audio.toggle} onUndo={undo} onClear={clear} onDownload={download} onImmersive={()=>setImmersive(true)} canUndo={paint.count>0}/>
    <p className="footer-note">Une expérience générative.<br/>Rien n’est enregistré sans vous.</p>
    {immersive&&<div className="immersive-ui"><p><span>MODE IMMERSIF</span>La toile devient paysage</p><button onClick={()=>setImmersive(false)} aria-label="Quitter le mode immersion"><Icon name="close"/></button></div>}
    <div className={`toast ${toast?"is-visible":""}`} role="status">{toast}</div>
  </main>;
}
