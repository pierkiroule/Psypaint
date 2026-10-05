import { useCallback, useEffect, useMemo, useState } from "react";
import { archetypes, symbolOrder } from "./data/archetypes";
import { mixArchetypes } from "./utils/archetypeMixer";
import { useAudioEngine } from "./hooks/useAudioEngine";
import { useThreeVisualizer } from "./hooks/useThreeVisualizer";

export default function App() {
  const [selection, setSelection] = useState([]);
  const [phase, setPhase] = useState("choose");
  const [toast, setToast] = useState("");
  const [controlsVisible, setControlsVisible] = useState(true);
  const notify = useCallback(message => setToast(message), []);
  const audio = useAudioEngine(notify);
  const visualizer = useThreeVisualizer(audio.getAudioData);
  const composition = useMemo(() => mixArchetypes(selection), [selection]);

  useEffect(() => visualizer.setComposition(composition), [composition, visualizer.setComposition]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 2200); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => {
    if (phase !== "experience") return;
    const timer = setTimeout(() => setControlsVisible(false), 4200);
    return () => clearTimeout(timer);
  }, [phase, controlsVisible]);

  const choose = key => {
    navigator.vibrate?.(8);
    setSelection(current => current.includes(key) ? current.filter(item => item !== key) : current.length < 3 ? [...current, key] : current);
  };
  const resonate = () => {
    if (!selection.length) return;
    setPhase("dissolve");
    setTimeout(() => setPhase("experience"), 1500);
  };
  const returnToChoice = () => { setControlsVisible(true); setPhase("return"); };
  const restart = () => { setSelection([]); setPhase("choose"); };
  const wakeControls = () => { if (phase === "experience") setControlsVisible(true); };

  return <main className={`psy-app phase-${phase}`} onPointerDown={wakeControls}>
    <section className="kaleido-stage" aria-label="Matière audiovisuelle interactive">
      <canvas ref={visualizer.canvasRef} {...visualizer.canvasProps} aria-label="Touchez pour perturber doucement la matière" />
      <div className="atmosphere" />
    </section>

    {(phase === "choose" || phase === "dissolve") && <section className="selection-screen" aria-labelledby="main-question">
      <header className="brand"><i aria-hidden="true"/><span>PSYKALEIDO</span></header>
      <div className="selection-copy">
        <p className="eyebrow">CHOISIR · RÉSONNER · CONTEMPLER</p>
        <h1 id="main-question">De quoi aurais-tu besoin,<br/><em>là, maintenant&nbsp;?</em></h1>
        <p>Choisis jusqu’à 3 symboles qui font écho à ton besoin.</p>
      </div>
      <div className="symbol-grid" aria-label="Symboles projectifs">
        {symbolOrder.map(key => <button key={key} onClick={() => choose(key)} className={selection.includes(key) ? "is-selected" : ""} aria-pressed={selection.includes(key)} aria-label={`Symbole ${archetypes[key].emoji}`}><span>{archetypes[key].emoji}</span></button>)}
      </div>
      <button className="resonate" disabled={!selection.length} onClick={resonate}><span>RÉSONNER</span><i>→</i></button>
      <p className="selection-count">{selection.length ? `${selection.length} / 3` : " "}</p>
    </section>}

    {phase === "experience" && <div className={`experience-ui ${controlsVisible ? "is-visible" : ""}`}>
      <button className="round-control back" onClick={returnToChoice} aria-label="Retour">←</button>
      <div className="experience-mark"><i/><span>PSYKALEIDO</span></div>
      <div className="audio-controls">
        <label className="round-control" aria-label="Choisir une musique">♪<input type="file" accept="audio/*" onChange={event => { audio.loadFile(event.target.files?.[0]); event.target.value = ""; }}/></label>
        {audio.fileName && <button className={`round-control ${audio.playing ? "is-active" : ""}`} onClick={audio.toggle} aria-label={audio.playing ? "Pause" : "Lecture"}>{audio.playing ? "Ⅱ" : "▷"}</button>}
      </div>
      <p className="gesture-hint">TOUCHE · GLISSE · MAINTIENS</p>
    </div>}

    {phase === "return" && <section className="return-screen">
      <header className="brand"><i aria-hidden="true"/><span>PSYKALEIDO</span></header>
      <div className="return-content">
        <p>SYMBOLES CHOISIS</p>
        <div className="chosen-symbols">{selection.map(key => <span key={key}>{archetypes[key].emoji}</span>)}</div>
        <h2>Qu’est-ce qui résonne encore&nbsp;?</h2>
        <button className="resonate" onClick={restart}><span>RECOMMENCER</span><i>↗</i></button>
        <button className="resume" onClick={() => setPhase("experience")}>REVENIR À L’EXPÉRIENCE</button>
      </div>
    </section>}
    <div className={`psy-toast ${toast ? "is-visible" : ""}`} role="status">{toast}</div>
  </main>;
}
