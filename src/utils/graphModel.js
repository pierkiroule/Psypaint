export const edgeKey = (first, second) => [first, second].sort().join("::");

export function toggleGraphEdge(edges, first, second, seed = Math.random() * Math.PI * 2) {
  const key = edgeKey(first, second), index = edges.findIndex(edge => edgeKey(edge.source, edge.target) === key);
  if (index >= 0) edges.splice(index, 1);
  else edges.push({ id: `edge-${key.replace("::", "-")}`, source: first, target: second, seed });
  return index < 0;
}

export function updateContact(edges, locks, first, second, touching, separated) {
  const key = edgeKey(first, second);
  if (touching && !locks.has(key)) {
    const created = toggleGraphEdge(edges, first, second);
    locks.add(key);
    return { toggled: true, created };
  }
  if (separated) locks.delete(key);
  return { toggled: false, created: false };
}
