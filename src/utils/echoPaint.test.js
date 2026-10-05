import test from "node:test";
import assert from "node:assert/strict";
import { brushes } from "../data/brushes.js";
import { createSquiggle } from "../hooks/useEchoCanvas.js";

test("the behavioral palette exposes eight distinct audio-aware brushes", () => {
  assert.deepEqual(Object.keys(brushes), ["wave", "fire", "seed", "vortex", "cloud", "sparkle", "moon", "bubble"]);
  for (const brush of Object.values(brushes)) {
    assert.equal(brush.colors.length, 3);
    assert.deepEqual(Object.keys(brush.audioResponse), ["low", "mid", "high"]);
  }
  assert.ok(brushes.wave.audioResponse.low > brushes.wave.audioResponse.high);
  assert.ok(brushes.sparkle.audioResponse.high > brushes.sparkle.audioResponse.low);
});

test("a squiggle stores expressive, persistent scene data without an emoji", () => {
  const squiggle = createSquiggle("wave", 42, 64, 1000);
  assert.equal(squiggle.brushType, "wave");
  assert.equal(squiggle.points[0].velocity, 0);
  assert.equal(squiggle.points[0].direction, 0);
  assert.ok(squiggle.depth >= 0 && squiggle.depth <= 1);
  assert.equal("emoji" in squiggle, false);
  assert.deepEqual(squiggle.resonances, []);
});
