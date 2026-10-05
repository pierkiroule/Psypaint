import { ARCHETYPES, ARCHETYPE_IDS } from "../data/archetypes";

export function ArchetypePalette({ value, onChange }) {
  return <div className="archetype-palette" aria-label="Choisir un archétype">
    {ARCHETYPE_IDS.map((id, index) => {
      const archetype = ARCHETYPES[id];
      return <button key={id} type="button" className={value === id ? "is-active" : ""} style={{ "--archetype-index": index, "--archetype-color": archetype.palette[0] }} onClick={() => onChange(id)} aria-label={archetype.label} aria-pressed={value === id}><span aria-hidden="true">{archetype.emoji}</span></button>;
    })}
  </div>;
}
