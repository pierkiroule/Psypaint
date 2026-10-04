export function StampControls({ color, size, opacity, onColor, onSize, onOpacity }) {
  return <div className="stamp-controls" aria-label="Réglages du tampon">
    <label className="hue-control"><span>COULEUR</span><input aria-label="Couleur" type="range" min="0" max="360" value={color} onChange={event => onColor(Number(event.target.value))}/></label>
    <label><span>TAILLE</span><input aria-label="Taille" type="range" min="18" max="82" value={size} onChange={event => onSize(Number(event.target.value))}/></label>
    <label><span>OPACITÉ</span><input aria-label="Opacité" type="range" min="15" max="100" value={Math.round(opacity * 100)} onChange={event => onOpacity(Number(event.target.value) / 100)}/></label>
  </div>;
}
