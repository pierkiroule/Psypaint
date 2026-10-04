import test from "node:test";
import assert from "node:assert/strict";
import { createImmersiveGraph } from "./immersiveGraph.js";
import { createArchetypeFX } from "../fx/createArchetypeFX.js";
import { WatercolorSkydome } from "../fx/WatercolorSkydome.js";
import { nodeToWorld } from "../fx/fieldUtils.js";

test("the immersive payload strips every 2D-only symbol property", () => {
  const graph = createImmersiveGraph([
    { id: "wave", archetype: "wave", emoji: "\u{1F30A}", x: .2, y: .3, size: 60, opacity: .8, createdAt: 1, audioReactive: true },
    { id: "vortex", archetype: "spiral", emoji: "\u{1F30A}", x: .7, y: .6, size: 50, opacity: .9, createdAt: 2 },
  ], [{ id: "edge-wave-vortex", source: "wave", target: "vortex", seed: 12 }]);
  assert.equal(JSON.stringify(graph).includes("\u{1F30A}"), false);
  assert.deepEqual(Object.keys(graph.nodes[0]).sort(), ["archetype", "createdAt", "id", "opacity", "size", "x", "y"]);
  assert.deepEqual(Object.keys(graph.edges[0]).sort(), ["id", "source", "target"]);
});

test("the watercolor skydome accepts only the sanitized graph", () => {
  const graph = createImmersiveGraph([{ id: "wave", archetype: "wave", emoji: "\u{1F30A}", x: .5, y: .5, size: 52, opacity: .9, createdAt: 1 }], []);
  const dome = new WatercolorSkydome(graph, new Map([["wave", nodeToWorld(graph.nodes[0])]]));
  assert.equal(JSON.stringify(dome).includes("\u{1F30A}"), false);
  assert.equal(typeof dome.update, "function"); assert.equal(typeof dome.draw, "function"); assert.equal(typeof dome.dispose, "function"); dome.dispose();
});

test("pilot archetypes create fields with a common lifecycle", () => {
  for (const archetype of ["wave", "fire", "spiral", "moon"]) {
    const fx = createArchetypeFX({ id: archetype, archetype, x: .5, y: .5, size: 46, opacity: .8, createdAt: 1, emoji: "\u{1F30A}" });
    assert.equal(typeof fx.update, "function"); assert.equal(typeof fx.draw, "function"); assert.equal(typeof fx.dispose, "function");
    assert.equal(JSON.stringify(fx).includes("\u{1F30A}"), false); fx.dispose();
  }
});
