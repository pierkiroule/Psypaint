import { useCallback, useEffect, useState } from "react";
import { brushEntries } from "./data/brushes";
import { useAudioEngine } from "./hooks/useAudioEngine";
import { useEchoCanvas } from "./hooks/useEchoCanvas";

export default function App() {
  const [brushType, setBrushType] = useState("wave"), [toast, setToast] = useState("");
  const notify = useCallback(message => setToast(message), []);
  const audio = useAudioEngine(notify);
  const paint = useEchoCanvas({ brushType, getAudioData: audio.getAudioData });
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 2200); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => { const onKey = event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); paint.undo(); } }; addEventListener("keydown", onKey); return () => removeEventListener("keydown", onKey); }, [paint.undo]);
  const selectBrush = type => { setBrushType(type); navigator.vibrate?.(12); };
  return <main className="echo-app">
    <header className="echo-header">
      <div className="wordmark"><i aria-hidden="true"/><span><strong>ECHOPAINT</strong><small>AQUARELLE VIVANTE</small></span></div>
      <p>LE GESTE DONNE FORME. LE SON FAIT RÉSONNER.</p>
    </header>
    <nav className="brush-palette" aria-label="Palette de brosses comportementales">
      {brushEntries.map(([type, brush]) => <button key={type} type="button" className={type === brushType ? "is-active" : ""} onClick={() => selectBrush(type)} aria-label={`Brosse ${brush.behavior}`} aria-pressed={type === brushType}><span aria-hidden="true">{brush.emoji}</span></button>)}
    </nav>
    <section className="living-sheet" aria-label="Feuille liquide EchoPaint">
      <canvas ref={paint.canvasRef} {...paint.canvasProps} aria-label="Canvas de peinture vivante"/>
      {!paint.count && <div className="canvas-invitation" aria-hidden="true"><span>touchez &amp; tracez</span><i/></div>}
    </section>
    <footer className="echo-controls">
      <button type="button" onClick={() => { paint.undo(); notify("Dernier geste effacé"); }} disabled={!paint.count} aria-label="Annuler"><span aria-hidden="true">↶</span><small>ANNULER</small></button>
      <label className={audio.playing ? "is-active" : ""} aria-label="Importer une source audio"><span aria-hidden="true">♪</span><small>{audio.playing ? "ÉCOUTE" : "AUDIO"}</small><input type="file" accept="audio/*,.mp3" onChange={event => { audio.loadFile(event.target.files?.[0]); event.target.value = ""; }}/></label>
      {audio.fileName && <button type="button" className={audio.playing ? "is-active" : ""} onClick={audio.toggle} aria-label={audio.playing ? "Mettre en pause" : "Lire l’audio"}><span aria-hidden="true">{audio.playing ? "Ⅱ" : "▷"}</span><small>{audio.playing ? "PAUSE" : "LIRE"}</small></button>}
      <button type="button" onClick={() => { paint.clear(); notify("La feuille respire à nouveau"); }} disabled={!paint.count} aria-label="Effacer la composition"><span aria-hidden="true">⌫</span><small>EFFACER</small></button>
    </footer>
    <div className={`echo-toast ${toast ? "is-visible" : ""}`} role="status">{toast}</div>
  </main>;
}
