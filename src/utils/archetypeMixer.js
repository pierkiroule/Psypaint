import { archetypes } from "../data/archetypes.js";

const hex = value => [1, 3, 5].map(index => parseInt(value.slice(index, index + 2), 16) / 255);
const PARAMS = ["fluidity", "branching", "orbitality", "symmetry", "turbulence", "particles"];

export function mixArchetypes(keys) {
  const sources = keys.map(key => archetypes[key]).filter(Boolean);
  if (!sources.length) return null;
  const mixed = { count: sources.length };
  PARAMS.forEach(name => { mixed[name] = sources.reduce((sum, item) => sum + item[name], 0) / sources.length; });
  mixed.audioResponse = ["low", "mid", "high"].reduce((result, band) => {
    result[band] = sources.reduce((sum, item) => sum + item.audioResponse[band], 0) / sources.length;
    return result;
  }, {});

  // Keep recognizable pigments from every source rather than averaging them
  // into grey. Their order is interleaved so a third symbol changes the visual
  // grammar and not merely the final accent.
  mixed.palette = Array.from({ length: 4 }, (_, index) => {
    const source = sources[index % sources.length];
    const colorIndex = Math.min(3, Math.floor(index / sources.length) + (index % sources.length));
    return hex(source.palette[colorIndex]);
  });
  mixed.signature = sources.reduce((sum, item, index) => sum + (item.orbitality * 1.7 + item.branching * 2.3 + item.fluidity) * (index + 1), 0);
  return mixed;
}
