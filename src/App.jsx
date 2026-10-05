import { useCallback, useEffect, useState } from "react";
import { brushEntries } from "./data/brushes";
import { useAudioEngine } from "./hooks/useAudioEngine";
import { useThreeVisualizer } from "./hooks/useThreeVisualizer";

export default function App() {
  const [archetype, setArchetype] = useState("wave"), [toast, setToast] = useState("");
  const notify = useCallback(message => setToast(message), []), audio = useAudioEngine(notify), visualizer = useThreeVisualizer(audio.getAudioData);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 2000); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => { const key = event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); visualizer.undo(); } }; addEventListener("keydown", key); return () => removeEventListener("keydown", key); }, [visualizer.undo]);
  const choose = (type, index) => { setArchetype(type); visualizer.setArchetype(index); navigator.vibrate?.(10); };
  return <main className="echo-app">
    <header className="echo-header"><div className="wordmark"><i/><span><strong>ECHO</strong><small>AUDIOVISUALIZER</small></span></div><p>CHOISISSEZ UN ARCHÉTYPE · TOUCHEZ L’ESPACE</p></header>
    <section className="visualizer-stage" aria-label="Scène audiovisuelle interactive">
      <canvas ref={visualizer.canvasRef} {...visualizer.canvasProps} aria-label="Touchez pour faire émerger un effet tridimensionnel"/>
      {!visualizer.count && <div className="stage-invitation"><b>TOUCHEZ POUR<br/>FAIRE ÉMERGER</b><span>une présence audiovisuelle</span></div>}
      <div className="stage-status"><i className={audio.playing ? "is-live" : ""}/>{audio.playing ? "RÉSONANCE ACTIVE" : "MOUVEMENT AUTONOME"}</div>
    </section>
    <nav className="archetype-dock" aria-label="Archétypes visuels">
      {brushEntries.map(([type, item], index) => <button key={type} className={archetype === type ? "is-active" : ""} onClick={() => choose(type, index)} aria-label={`Effet ${item.behavior}`} aria-pressed={archetype === type}><span>{item.emoji}</span><i/></button>)}
    </nav>
    <footer className="echo-controls">
      <button onClick={visualizer.undo} disabled={!visualizer.count} aria-label="Annuler">↶</button>
      <label className={audio.playing ? "is-active" : ""} aria-label="Charger une musique">♪<input type="file" accept="audio/*" onChange={event => { audio.loadFile(event.target.files?.[0]); event.target.value = ""; }}/></label>
      {audio.fileName && <button className={audio.playing ? "is-active" : ""} onClick={audio.toggle} aria-label={audio.playing ? "Pause" : "Lecture"}>{audio.playing ? "Ⅱ" : "▷"}</button>}
      <button onClick={visualizer.clear} disabled={!visualizer.count} aria-label="Effacer">⌫</button>
    </footer>
    <div className={`echo-toast ${toast ? "is-visible" : ""}`} role="status">{toast}</div>
  </main>;
}
