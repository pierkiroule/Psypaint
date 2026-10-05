import { ARCHETYPES } from "../data/archetypes.js";
import { FireFX } from "./FireFX.js";
import { GenericFX } from "./GenericFX.js";
import { VortexFX } from "./VortexFX.js";
import { WaveFX } from "./WaveFX.js";

export function createArchetypeFX(input) {
  // Deliberately whitelist the immersive properties: the 2D symbol never crosses this boundary.
  const node = { id: input.id, archetype: input.archetype, x: input.x, y: input.y, size: input.size, opacity: input.opacity, createdAt: input.createdAt };
  if (node.archetype === "wave") return new WaveFX(node);
  if (node.archetype === "fire") return new FireFX(node);
  if (node.archetype === "spiral") return new VortexFX(node);
  return new GenericFX(node, ARCHETYPES[node.archetype]?.palette || ["#d9ded9", "#718b86", "#ffffff"]);
}
