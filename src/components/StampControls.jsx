export function StampControls({ size, opacity, onSize, onOpacity }) {
  return <div className="stamp-controls" aria-label="Réglages de l’emoji">
    <label><span>TAILLE</span><input aria-label="Taille" type="range" min="24" max="72" value={size} onChange={event => onSize(Number(event.target.value))}/></label>
    <label><span>OPACITÉ</span><input aria-label="Opacité" type="range" min="20" max="100" value={Math.round(opacity * 100)} onChange={event => onOpacity(Number(event.target.value) / 100)}/></label>
  </div>;
}
