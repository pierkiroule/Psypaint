import { BRUSHES } from "../data/palettes";
import { Icon } from "./Icon";
export function BrushRail({ value, onChange }) { return <aside className="brush-rail" aria-label="Choix du pinceau"><span className="rail-label">OUTILS</span>{BRUSHES.map(item=><button key={item.id} className={`brush-button ${value===item.id?"is-active":""}`} onClick={()=>onChange(item.id)} aria-pressed={value===item.id} aria-label={item.label}><Icon name={item.glyph}/><span>{item.label}</span></button>)}</aside>; }
