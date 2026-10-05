import { useCallback, useEffect, useState } from "react";
import { brushes } from "./data/brushes";
import { useAudioEngine } from "./hooks/useAudioEngine";
import { useThreeVisualizer } from "./hooks/useThreeVisualizer";

export default function App() {
  const [archetype, setArchetype] = useState("wave"), [toast, setToast] = useState("");
  const notify = useCallback(message => setToast(message), []), audio = useAudioEngine(notify), visualizer = useThreeVisualizer(audio.getAudioData);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 2000); return () => clearTimeout(timer); }, [toast]);
  const choose = (type, index) => { setArchetype(type); visualizer.setArchetype(index); navigator.vibrate?.(10); };
  const archetypes = [["wave", brushes.wave], ["seed", brushes.seed], ["vortex", brushes.vortex]];
  return <main className="echo-app">
    <header className="echo-header"><div className="wordmark"><i/><span><strong>ECHO</strong><small>AUDIOVISUALIZER</small></span></div><p>CHOISISSEZ UN ARCHÉTYPE · TOUCHEZ L’ESPACE</p></header>
    <section className="visualizer-stage" aria-label="Scène audiovisuelle interactive">
      <canvas ref={visualizer.canvasRef} {...visualizer.canvasProps} aria-label="Touchez pour faire émerger un effet tridimensionnel"/>
      <div className="stage-invitation"><b>TOUCHEZ · GLISSEZ · MAINTENEZ</b><span>la matière répond à votre présence</span></div>
      <div className="stage-status"><i className={audio.playing ? "is-live" : ""}/>{audio.playing ? "RÉSONANCE ACTIVE" : "MOUVEMENT AUTONOME"}</div>
    </section>
    <nav className="archetype-dock" aria-label="Archétypes visuels">
      {archetypes.map(([type, item], index) => <button key={type} className={archetype === type ? "is-active" : ""} onClick={() => choose(type, index)} aria-label={`Effet ${item.behavior}`} aria-pressed={archetype === type}><span>{item.emoji}</span><i/></button>)}
    </nav>
    <footer className="echo-controls">
      <label className={audio.playing ? "is-active" : ""} aria-label="Charger une musique">♪<input type="file" accept="audio/*" onChange={event => { audio.loadFile(event.target.files?.[0]); event.target.value = ""; }}/></label>
      {audio.fileName && <button className={audio.playing ? "is-active" : ""} onClick={audio.toggle} aria-label={audio.playing ? "Pause" : "Lecture"}>{audio.playing ? "Ⅱ" : "▷"}</button>}
    </footer>
    <div className={`echo-toast ${toast ? "is-visible" : ""}`} role="status">{toast}</div>
  </main>;
}
