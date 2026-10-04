import { useCallback, useEffect, useRef, useState } from "react";
import { Brand } from "./components/Brand";
import { Icon } from "./components/Icon";
import { Immersive360 } from "./components/Immersive360";
import { ArchetypePalette } from "./components/ArchetypePalette";
import { StampControls } from "./components/StampControls";
import { TooltipButton } from "./components/TooltipButton";
import { useAudioEngine } from "./hooks/useAudioEngine";
import { usePaintCanvas } from "./hooks/usePaintCanvas";

export default function App() {
  const immersiveCanvas = useRef(null), graph = useRef({ nodes: [], edges: [] });
  const [archetype, setArchetype] = useState("wave"), [size, setSize] = useState(46), [opacity, setOpacity] = useState(.82), [toast, setToast] = useState(""), [immersive, setImmersive] = useState(false), [selected, setSelected] = useState(null);
  const notify = useCallback(message => setToast(message), []), audio = useAudioEngine(notify);
  const handleSelect = useCallback(node => { setSelected(node ? { ...node } : null); if (node) { setArchetype(node.archetype); setSize(node.size); setOpacity(node.opacity); } }, []);
  const paint = usePaintCanvas({ archetype, palette: "jardin", size, opacity, audioReactive: true, getEnergy: audio.getEnergy, onSelect: handleSelect });
  graph.current = paint.getGraph();
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 2200); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => { const key = event => { if (event.key === "Escape") setImmersive(false); if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); paint.undo(); } if ((event.key === "Delete" || event.key === "Backspace") && selected && !immersive) paint.deleteSelected(); }; addEventListener("keydown", key); return () => removeEventListener("keydown", key); }, [immersive, paint.deleteSelected, paint.undo, selected]);
  const changeSize = value => { setSize(value); if (selected) { paint.updateSelected({ size: value }); setSelected(current => ({ ...current, size: value })); } };
  const changeOpacity = value => { setOpacity(value); if (selected) { paint.updateSelected({ opacity: value }); setSelected(current => ({ ...current, opacity: value })); } };
  const chooseArchetype = value => { setArchetype(value); paint.clearSelection(); };
  return <main className={immersive ? "app is-immersive" : "app"}>
    <div className="ambient ambient-one"/><div className="ambient ambient-two"/><Brand/>
    <section className="composition" aria-label="Composition projective">
      <div className="composition-orbit">
        <ArchetypePalette value={archetype} onChange={chooseArchetype}/>
        <div className="circle-shell"><canvas ref={paint.canvasRef} {...paint.canvasProps} aria-label="Carte relationnelle d’emojis"/></div>
      </div>
      <StampControls size={size} opacity={opacity} onSize={changeSize} onOpacity={changeOpacity}/>
      <div className="composition-actions">
        <TooltipButton icon="undo" label="Annuler le dernier tampon" onClick={() => { paint.undo(); notify("Dernier tampon annulé"); }} disabled={!paint.count}/>
        <TooltipButton icon="close" label="Supprimer le tampon sélectionné" onClick={() => { paint.deleteSelected(); notify("Tampon supprimé"); }} disabled={!selected}/>
        <TooltipButton icon="trash" label="Effacer la composition" onClick={() => { paint.clear(); notify("Composition effacée"); }} disabled={!paint.count}/>
        <TooltipButton icon="camera" label="Télécharger la composition" onClick={() => { paint.download(); notify("Composition téléchargée"); }}/>
        <label className="audio-action" title="Importer une musique"><Icon name="music"/><input type="file" accept="audio/*,.mp3" onChange={event => { audio.loadFile(event.target.files?.[0]); event.target.value = ""; }}/></label>
        {audio.fileName && <TooltipButton icon={audio.playing ? "pause" : "play"} label={audio.playing ? "Pause" : "Lecture"} active={audio.playing} onClick={audio.toggle}/>}
        <button className="enter-button" onClick={() => { graph.current = paint.getGraph(); setImmersive(true); }} disabled={!paint.count}><span>ENTRER</span><Icon name="expand"/></button>
      </div>
    </section>
    <Immersive360 active={immersive} palette="jardin" getStrokes={paint.getStrokes} getGraph={paint.getGraph} getEnergy={audio.getEnergy} canvasRef={immersiveCanvas} onExit={() => setImmersive(false)}/>
    {immersive && <div className="immersive-ui"><p><span>MONDE 360°</span>La composition devient paysage</p><button onClick={() => setImmersive(false)} aria-label="Quitter le monde 360°"><Icon name="close"/></button></div>}
    <div className={`toast ${toast ? "is-visible" : ""}`} role="status">{toast}</div>
  </main>;
}
