export function BrushSettings({ color, size, opacity, audioReactive, onColor, onSize, onOpacity, onAudioReactive }) {
  return <aside className="brush-settings" aria-label="Réglages du pinceau">
    <label className="color-setting"><span>Couleur</span><input type="color" value={color} onChange={event=>onColor(event.target.value)} /></label>
    <label><span>Épaisseur <b>{size}</b></span><input type="range" min="2" max="72" value={size} onChange={event=>onSize(Number(event.target.value))} /></label>
    <label><span>Opacité <b>{Math.round(opacity*100)}%</b></span><input type="range" min="10" max="100" value={opacity*100} onChange={event=>onOpacity(Number(event.target.value)/100)} /></label>
    <label className="reactive-setting"><input type="checkbox" checked={audioReactive} onChange={event=>onAudioReactive(event.target.checked)} /><span>Audio-réactif</span></label>
  </aside>;
}
