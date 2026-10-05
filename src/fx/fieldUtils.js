export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const lerp = (from, to, amount) => from + (to - from) * amount;
export const hash = value => { const x = Math.sin(value * 127.1) * 43758.5453; return x - Math.floor(x); };

export function nodeToWorld(node) {
  const longitude = (node.x - .5) * Math.PI * .92, latitude = (.5 - node.y) * Math.PI * .72, radius = 5;
  return { x: Math.sin(longitude) * Math.cos(latitude) * radius, y: Math.sin(latitude) * radius, z: -Math.cos(longitude) * Math.cos(latitude) * radius };
}

export function strokePath(ctx, points, color, alpha, width) {
  const visible = points.filter(Boolean); if (visible.length < 2) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(visible[0].x, visible[0].y);
  for (let index = 1; index < visible.length - 1; index++) { const point = visible[index], next = visible[index + 1]; ctx.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2); }
  ctx.lineTo(visible.at(-1).x, visible.at(-1).y); ctx.stroke(); ctx.restore();
}

export function glowPoint(ctx, point, radius, color, alpha) {
  if (!point) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = radius * 3; ctx.beginPath(); ctx.arc(point.x, point.y, Math.max(.45, radius * point.scale), 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
