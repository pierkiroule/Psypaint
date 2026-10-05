import { archetypes, GENOME_KEYS } from "../data/archetypes.js";

const hex = value => [1, 3, 5].map(index => parseInt(value.slice(index, index + 2), 16) / 255);
const clamp = value => Math.max(0, Math.min(1, value));

/** A soft-max blend preserves a symbol's dominant traits without hard edges. */
export function mixTrait(values) {
  const dominant = Math.max(...values);
  const support = values.reduce((sum, value) => sum + value * value, 0) / values.length;
  return clamp(dominant * .72 + Math.sqrt(support) * .28);
}

export function mixArchetypes(keys, seed = 0) {
  const sources = keys.map(key => archetypes[key]).filter(Boolean);
  if (!sources.length) return null;
  const mixed = { count: sources.length, seed };
  GENOME_KEYS.forEach(name => { mixed[name] = mixTrait(sources.map(item => item[name])); });
  mixed.audioResponse = Object.fromEntries(["low", "mid", "high"].map(band => [band, mixTrait(sources.map(item => item.audioResponse[band]))]));
  mixed.palette = Array.from({ length: 4 }, (_, index) => {
    const source = sources[(index + Math.floor(seed * sources.length)) % sources.length];
    return hex(source.palette[Math.min(3, Math.floor(index / sources.length) + index % sources.length)]);
  });
  mixed.signature = sources.reduce((sum, item, index) => sum + (item.orbitality * 1.7 + item.branching * 2.3 + item.fluidity) * (index + 1), seed * 3.1);
  return mixed;
}
