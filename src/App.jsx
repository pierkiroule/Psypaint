import { useCallback, useEffect, useState } from "react";
import { brushes } from "./data/brushes";
import { useAudioEngine } from "./hooks/useAudioEngine";
import { useThreeVisualizer } from "./hooks/useThreeVisualizer";

export default function App() {
  const [archetype, setArchetype] = useState("wave"), [toast, setToast] = useState("");
  const notify = useCallback(message => setToast(message), []), audio = useAudioEngine(notify), visualizer = useThreeVisualizer(audio.getAudioData);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 2000); return () => clearTimeout(timer); }, [toast]);
  const choose = (type, index) => { setArchetype(type); visualizer.setArchetype(index); navigator.vibrate?.(10); };
  const archetypes = ["wave", "seed", "vortex", "fire", "cloud", "sparkle", "moon", "bubble"].map(type => [type, brushes[type]]);
  const shaderKind = { wave: 0, fire: 1, seed: 2, vortex: 3, cloud: 4, sparkle: 5, moon: 6, bubble: 7 };
  return <main className="echo-app">
    <header className="echo-header"><div className="wordmark"><i/><span><strong>ECHO</strong><small>PARTICLE PAINTER</small></span></div><p>CHOISISSEZ UNE MATIÈRE · PEIGNEZ SON FLUX</p></header>
    <section className="visualizer-stage" aria-label="Scène audiovisuelle interactive">
      <canvas ref={visualizer.canvasRef} {...visualizer.canvasProps} aria-label="Peignez un flux de particules audio-réactif"/>
      {!visualizer.count && <div className="stage-invitation"><b>TOUCHEZ · GLISSEZ · PEIGNEZ</b><span>chaque geste libère un flux vivant</span></div>}
      <div className="stage-status"><i className={audio.playing ? "is-live" : ""}/>{audio.playing ? "RÉSONANCE ACTIVE" : "MOUVEMENT AUTONOME"}</div>
    </section>
    <nav className="archetype-dock" aria-label="Archétypes visuels">
      {archetypes.map(([type, item]) => <button key={type} className={archetype === type ? "is-active" : ""} onClick={() => choose(type, shaderKind[type])} aria-label={`Brosse ${item.behavior}`} aria-pressed={archetype === type}><span>{item.emoji}</span><i/></button>)}
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
