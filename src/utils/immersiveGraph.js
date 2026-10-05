export function createImmersiveGraph(nodes, edges) {
  return {
    nodes: nodes.map(node => ({ id: node.id, archetype: node.archetype, x: node.x, y: node.y, size: node.size, opacity: node.opacity, createdAt: node.createdAt })),
    edges: edges.map(edge => ({ id: edge.id, source: edge.source, target: edge.target })),
  };
}
