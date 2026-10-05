import test from "node:test";
import assert from "node:assert/strict";
import { brushes } from "../data/brushes.js";
import { advanceAudioMotion, initialAudioMotion } from "./audioMotion.js";

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

test("audio motion turns abrupt FFT changes into continuous evolution", () => {
  const silent = initialAudioMotion();
  const first = advanceAudioMotion(silent, { low: 1, mid: 1, high: 1, energy: 1, transient: 1 }, 1 / 60);
  assert.ok(first.low > 0 && first.low < .1);
  assert.ok(first.shimmer > 0 && first.shimmer < .1);
  assert.ok(first.flow > silent.flow);
  const release = advanceAudioMotion(first, { low: 0, mid: 0, high: 0, energy: 0, transient: 0 }, 1 / 60);
  assert.ok(release.low < first.low && release.low > 0);
  assert.ok(release.propagation < first.propagation);
});
