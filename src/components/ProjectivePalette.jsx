const SHAPES = ["organic", "halo", "filament", "membrane", "shard", "wave", "cluster", "rift"];

export function StampGlyph({ type }) {
  const paths = {
    organic: <path d="M8 30C-1 20 6 5 20 7c9-8 25 2 22 14 8 12-5 24-17 19C14 47 2 40 8 30Z" />,
    halo: <><circle cx="24" cy="24" r="15" fill="none" stroke="currentColor" strokeWidth="6" opacity=".3"/><circle cx="24" cy="24" r="10" fill="none" stroke="currentColor" strokeWidth="2"/></>,
    filament: <path d="M5 34C13 3 18 44 27 15S39 9 43 30" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>,
    membrane: <path d="M7 26C9 8 30 3 41 17 48 31 31 42 14 39 5 37 4 31 7 26Z" fillOpacity=".32" stroke="currentColor" strokeWidth="2"/>,
    shard: <path d="m25 3 5 16 14 5-14 6-6 15-5-14L4 25l15-6 6-16Z"/>,
    wave: <path d="M3 17c8-10 14 10 22 0s13 10 20 0M3 30c8-10 14 10 22 0s13 10 20 0" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>,
    cluster: <><circle cx="17" cy="17" r="10"/><circle cx="31" cy="18" r="9" opacity=".7"/><circle cx="25" cy="31" r="11" opacity=".45"/></>,
    rift: <path d="M28 3 14 20l8 3-7 22 19-24-9-3 3-15Z"/>,
  };
  return <svg viewBox="0 0 48 48" aria-hidden="true">{paths[type]}</svg>;
}

export function ProjectivePalette({ value, color, onChange }) {
  return <div className="projective-palette" aria-label="Choisir une forme projective">
    {SHAPES.map((type, index) => <button key={type} type="button" className={value === type ? "is-active" : ""} style={{ "--stamp-index": index, "--stamp-color": color }} onClick={() => onChange(type)} aria-label={`Forme ${index + 1}`} aria-pressed={value === type}><StampGlyph type={type}/></button>)}
  </div>;
}

export { SHAPES };
