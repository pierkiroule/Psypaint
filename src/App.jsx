import { useCallback, useEffect, useRef, useState } from "react";
import { Brand } from "./components/Brand";
import { Icon } from "./components/Icon";
import { Immersive360 } from "./components/Immersive360";
import { ProjectivePalette } from "./components/ProjectivePalette";
import { StampControls } from "./components/StampControls";
import { TooltipButton } from "./components/TooltipButton";
import { useAudioEngine } from "./hooks/useAudioEngine";
import { usePaintCanvas } from "./hooks/usePaintCanvas";

const hueToHex = hue => { const [r, g, b] = [0, 8, 4].map(offset => Math.round((1 + Math.cos((hue + offset * 30) * Math.PI / 180)) * 127.5)); return `#${[r, g, b].map(value => value.toString(16).padStart(2, "0")).join("")}`; };
const hexToHue = hex => { const [r, g, b] = hex.match(/\w\w/g).map(value => parseInt(value, 16) / 255), max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min; if (!delta) return 0; const sector = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4; return Math.round((sector * 60 + 360) % 360); };

export default function App() {
  const immersiveCanvas = useRef(null), structuredStamps = useRef([]);
  const [brush, setBrush] = useState("organic"), [hue, setHue] = useState(108), [size, setSize] = useState(46), [opacity, setOpacity] = useState(.68), [toast, setToast] = useState(""), [immersive, setImmersive] = useState(false), [selected, setSelected] = useState(null);
  const color = hueToHex(hue), notify = useCallback(message => setToast(message), []), audio = useAudioEngine(notify);
  const handleSelect = useCallback(stamp => { setSelected(stamp ? { ...stamp } : null); if (stamp) { setBrush(stamp.type); setHue(hexToHue(stamp.color)); setSize(stamp.size); setOpacity(stamp.opacity); } }, []);
  const paint = usePaintCanvas({ brush, palette: "jardin", color, size, opacity, audioReactive: true, getEnergy: audio.getEnergy, onSelect: handleSelect });
  structuredStamps.current = paint.getStamps();
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 2200); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => { const key = event => { if (event.key === "Escape") setImmersive(false); if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); paint.undo(); } if ((event.key === "Delete" || event.key === "Backspace") && selected && !immersive) paint.deleteSelected(); }; addEventListener("keydown", key); return () => removeEventListener("keydown", key); }, [immersive, paint.deleteSelected, paint.undo, selected]);
  const changeHue = value => { setHue(value); const next = hueToHex(value); if (selected) { paint.updateSelected({ color: next }); setSelected(current => ({ ...current, color: next })); } };
  const changeSize = value => { setSize(value); if (selected) { paint.updateSelected({ size: value }); setSelected(current => ({ ...current, size: value })); } };
  const changeOpacity = value => { setOpacity(value); if (selected) { paint.updateSelected({ opacity: value }); setSelected(current => ({ ...current, opacity: value })); } };
  const chooseBrush = value => { setBrush(value); paint.clearSelection(); };
  return <main className={immersive ? "app is-immersive" : "app"}>
    <div className="ambient ambient-one"/><div className="ambient ambient-two"/><Brand/>
    <section className="composition" aria-label="Composition projective">
      <div className="composition-orbit">
        <ProjectivePalette value={brush} color={selected?.color || color} onChange={chooseBrush}/>
        <div className="circle-shell"><canvas ref={paint.canvasRef} {...paint.canvasProps} aria-label="Zone circulaire de composition par tampons"/></div>
      </div>
      <StampControls color={hue} size={size} opacity={opacity} onColor={changeHue} onSize={changeSize} onOpacity={changeOpacity}/>
      <div className="composition-actions">
        <TooltipButton icon="undo" label="Annuler le dernier tampon" onClick={() => { paint.undo(); notify("Dernier tampon annulé"); }} disabled={!paint.count}/>
        <TooltipButton icon="close" label="Supprimer le tampon sélectionné" onClick={() => { paint.deleteSelected(); notify("Tampon supprimé"); }} disabled={!selected}/>
        <TooltipButton icon="trash" label="Effacer la composition" onClick={() => { paint.clear(); notify("Composition effacée"); }} disabled={!paint.count}/>
        <TooltipButton icon="camera" label="Télécharger la composition" onClick={() => { paint.download(); notify("Composition téléchargée"); }}/>
        <label className="audio-action" title="Importer une musique"><Icon name="music"/><input type="file" accept="audio/*,.mp3" onChange={event => { audio.loadFile(event.target.files?.[0]); event.target.value = ""; }}/></label>
        {audio.fileName && <TooltipButton icon={audio.playing ? "pause" : "play"} label={audio.playing ? "Pause" : "Lecture"} active={audio.playing} onClick={audio.toggle}/>}
        <button className="enter-button" onClick={() => { structuredStamps.current = paint.getStamps(); setImmersive(true); }} disabled={!paint.count}><span>ENTRER</span><Icon name="expand"/></button>
      </div>
    </section>
    <Immersive360 active={immersive} palette="jardin" getStrokes={paint.getStrokes} getEnergy={audio.getEnergy} canvasRef={immersiveCanvas} onExit={() => setImmersive(false)}/>
    {immersive && <div className="immersive-ui"><p><span>MONDE 360°</span>La composition devient paysage</p><button onClick={() => setImmersive(false)} aria-label="Quitter le monde 360°"><Icon name="close"/></button></div>}
    <div className={`toast ${toast ? "is-visible" : ""}`} role="status">{toast}</div>
  </main>;
}
