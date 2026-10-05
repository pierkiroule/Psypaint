import test from "node:test";
import assert from "node:assert/strict";
import { brushes } from "../data/brushes.js";

test("the particle palette exposes eight behavioral brushes", () => {
  const palette = ["wave", "seed", "vortex", "fire", "cloud", "sparkle", "moon", "bubble"].map(type => brushes[type]);
  assert.deepEqual(palette.map(item => item.emoji), ["🌊", "🌱", "🌀", "🔥", "☁️", "✨", "🌙", "🫧"]);
  assert.equal(new Set(palette.map(item => item.behavior)).size, 8);
});

test("pilot archetypes keep distinct audio signatures", () => {
  assert.ok(brushes.wave.audioResponse.low > brushes.wave.audioResponse.high);
  assert.ok(brushes.seed.audioResponse.mid > brushes.seed.audioResponse.low);
  assert.ok(brushes.vortex.audioResponse.mid > brushes.vortex.audioResponse.low);
});
