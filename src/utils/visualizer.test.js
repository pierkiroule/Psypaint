import test from "node:test";
import assert from "node:assert/strict";
import { brushes } from "../data/brushes.js";

test("the first milestone exposes only the three projective archetypes", () => {
  const milestone = [brushes.wave, brushes.seed, brushes.vortex];
  assert.deepEqual(milestone.map(item => item.emoji), ["🌊", "🌱", "🌀"]);
  assert.deepEqual(milestone.map(item => item.behavior), ["fluid", "branching", "orbital"]);
});

test("pilot archetypes keep distinct audio signatures", () => {
  assert.ok(brushes.wave.audioResponse.low > brushes.wave.audioResponse.high);
  assert.ok(brushes.seed.audioResponse.mid > brushes.seed.audioResponse.low);
  assert.ok(brushes.vortex.audioResponse.mid > brushes.vortex.audioResponse.low);
});
