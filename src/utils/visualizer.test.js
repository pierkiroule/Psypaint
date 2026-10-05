import test from "node:test";
import assert from "node:assert/strict";
import { archetypes, symbolOrder } from "../data/archetypes.js";
import { mixArchetypes, mixTrait } from "./archetypeMixer.js";
import { advanceAudioMotion, initialAudioMotion } from "./audioMotion.js";
import { mapOrientationToView } from "./gyroView.js";
import { flattenPalette } from "../hooks/useThreeVisualizer.js";

test("the projective palette exposes twelve configurable symbols", () => {
  assert.equal(symbolOrder.length, 12);
  assert.deepEqual(symbolOrder.slice(0, 3).map(key => archetypes[key].emoji), ["🌊", "🌱", "🔥"]);
  assert.ok(symbolOrder.every(key => archetypes[key].palette.length === 4));
});

test("gyro view is relative, upright and wraps compass angles", () => {
  const baseline = { alpha: 350, beta: 90, gamma: 0 };
  const neutral = mapOrientationToView(baseline, baseline);
  assert.equal(Math.abs(neutral.x), 0);
  assert.equal(neutral.y, 0);
  assert.equal(neutral.baseline, baseline);
  const right = mapOrientationToView({ alpha: 10, beta: 90, gamma: 0 }, baseline);
  const up = mapOrientationToView({ alpha: 350, beta: 72, gamma: 0 }, baseline);
  assert.ok(right.x < 0 && Math.abs(right.x) < .2);
  assert.ok(up.y < 0 && Math.abs(up.y) < .2);
});

test("pilot archetypes keep distinct audio signatures", () => {
  assert.ok(archetypes.wave.audioResponse.low > archetypes.wave.audioResponse.high);
  assert.ok(archetypes.growth.audioResponse.mid > archetypes.growth.audioResponse.low);
  assert.ok(archetypes.vortex.audioResponse.mid > archetypes.vortex.audioResponse.low);
});

test("the mixer creates one distinct hybrid state without averaging pigments", () => {
  const waveGrowth = mixArchetypes(["wave", "growth"]);
  const waveVortex = mixArchetypes(["wave", "vortex"]);
  const all = mixArchetypes(["wave", "growth", "vortex"]);
  assert.equal(waveGrowth.count, 2);
  assert.equal(all.count, 3);
  assert.ok(waveGrowth.branching > waveVortex.branching);
  assert.ok(waveVortex.orbitality > waveGrowth.orbitality);
  assert.notDeepEqual(all.palette, waveGrowth.palette);
  assert.deepEqual(waveGrowth.palette[0], archetypes.wave.palette[0].match(/[a-f\d]{2}/gi).map(value => parseInt(value, 16) / 255));
});

test("dominant genome traits survive a three-symbol blend", () => {
  const mixed = mixArchetypes(["wave", "growth", "vortex"], .42);
  assert.ok(mixed.fluidity > .75);
  assert.ok(mixed.branching > .75);
  assert.ok(mixed.orbitality > .75);
  assert.equal(mixed.seed, .42);
  assert.ok(mixTrait([1, .1, .1]) > .75);
});

test("the GLSL palette is packed as a vec3 uniform buffer", () => {
  const palette = flattenPalette([[1, 0, 0], [0, 1, 0], [0, 0, 1], [.5, .5, .5]]);
  assert.ok(palette instanceof Float32Array);
  assert.equal(palette.length, 12);
  assert.deepEqual([...palette.slice(0, 6)], [1, 0, 0, 0, 1, 0]);
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
