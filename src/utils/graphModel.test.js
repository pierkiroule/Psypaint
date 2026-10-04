import test from "node:test";
import assert from "node:assert/strict";
import { updateContact } from "./graphModel.js";

test("a prolonged contact toggles an edge only once", () => {
  const edges = [], locks = new Set();
  assert.deepEqual(updateContact(edges, locks, "node-a", "node-b", true, false), { toggled: true, created: true });
  assert.deepEqual(updateContact(edges, locks, "node-a", "node-b", true, false), { toggled: false, created: false });
  assert.equal(edges.length, 1);
});

test("separation rearms contact and the next contact removes the edge", () => {
  const edges = [], locks = new Set();
  updateContact(edges, locks, "node-a", "node-b", true, false);
  updateContact(edges, locks, "node-a", "node-b", false, true);
  const result = updateContact(edges, locks, "node-a", "node-b", true, false);
  assert.deepEqual(result, { toggled: true, created: false });
  assert.equal(edges.length, 0);
});

test("edge identity is independent of contact direction", () => {
  const edges = [], locks = new Set();
  updateContact(edges, locks, "node-a", "node-b", true, false);
  updateContact(edges, locks, "node-a", "node-b", false, true);
  updateContact(edges, locks, "node-b", "node-a", true, false);
  assert.equal(edges.length, 0);
});
