const hash = (n, seed) => {
  const value = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
  return value - Math.floor(value);
};

const path = (ctx, points) => {
  if (!points.length) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length - 1; index++) {
    const point = points[index], next = points[index + 1];
    ctx.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
  }
  const last = points.at(-1);
  ctx.lineTo(last.x, last.y);
};

const stampFlower = (ctx, point, radius, color, seed) => {
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.rotate(hash(point.index, seed) * Math.PI);
  for (let petal = 0; petal < 6; petal++) {
    ctx.rotate(Math.PI / 3);
    ctx.beginPath();
    ctx.ellipse(radius * .72, 0, radius * .72, radius * .34, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(0, 0, radius * .28, 0, Math.PI * 2);
  ctx.fillStyle = "#3a2d20";
  ctx.fill();
  ctx.restore();
};

const stampLeaf = (ctx, point, radius, color, seed) => {
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.rotate((hash(point.index, seed) - .5) * 2.8);
  ctx.beginPath();
  ctx.moveTo(-radius, 0);
  ctx.quadraticCurveTo(0, -radius * .72, radius, 0);
  ctx.quadraticCurveTo(0, radius * .72, -radius, 0);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha *= .65;
  ctx.strokeStyle = "#263226";
  ctx.lineWidth = Math.max(.6, radius * .08);
  ctx.beginPath();
  ctx.moveTo(-radius * .75, 0);
  ctx.lineTo(radius * .72, 0);
  ctx.stroke();
  ctx.restore();
};

export function renderPaintStroke(ctx, stroke, points, time = 0, energy = 0) {
  if (!points.length) return;
  const reactive = stroke.audioReactive ? 1 + energy * .9 : 1;
  const size = (stroke.size || 18) * reactive;
  const opacity = stroke.opacity ?? .65;
  const color = stroke.color || stroke.ink || "#273027";
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = opacity;

  if (stroke.brush === "wash") {
    ctx.globalCompositeOperation = "multiply";
    for (let layer = 0; layer < 7; layer++) {
      const spread = (layer - 3) * size * .055;
      const wetPoints = points.map((point, index) => ({
        ...point,
        x: point.x + Math.sin(index * .31 + stroke.seed + layer) * spread,
        y: point.y + Math.cos(index * .23 + time + layer) * spread,
      }));
      path(ctx, wetPoints);
      ctx.strokeStyle = color;
      ctx.lineWidth = size * (1.15 - layer * .08);
      ctx.globalAlpha = opacity * (.055 + layer * .012);
      ctx.stroke();
    }
    points.forEach((point, index) => {
      if (index % 5) return;
      ctx.beginPath();
      ctx.arc(point.x, point.y, size * (.2 + hash(index, stroke.seed) * .32), 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = opacity * .025;
      ctx.fill();
    });
  } else if (stroke.brush === "ink") {
    ctx.globalCompositeOperation = "multiply";
    for (let index = 1; index < points.length; index++) {
      const pressure = points[index].p || .5;
      ctx.beginPath();
      ctx.moveTo(points[index - 1].x, points[index - 1].y);
      ctx.lineTo(points[index].x, points[index].y);
      ctx.strokeStyle = color;
      ctx.globalAlpha = opacity;
      ctx.lineWidth = Math.max(.8, size * (.18 + pressure * .82));
      ctx.stroke();
    }
  } else if (stroke.brush === "pencil") {
    ctx.globalCompositeOperation = "multiply";
    for (let grain = 0; grain < 8; grain++) {
      const grainPoints = points.map((point, index) => ({
        ...point,
        x: point.x + (hash(index * 9 + grain, stroke.seed) - .5) * size * .42,
        y: point.y + (hash(index * 13 + grain, stroke.seed) - .5) * size * .42,
      }));
      path(ctx, grainPoints);
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(.45, size * .075);
      ctx.globalAlpha = opacity * .16;
      ctx.stroke();
    }
  } else {
    const interval = Math.max(1, Math.round(26 / Math.max(size, 4)));
    points.forEach((point, index) => {
      if (index % interval) return;
      const stampedPoint = { ...point, index };
      ctx.globalAlpha = opacity * (.75 + hash(index, stroke.seed) * .25);
      if (stroke.brush === "bloom") stampFlower(ctx, stampedPoint, size * .52, color, stroke.seed);
      if (stroke.brush === "leaf") stampLeaf(ctx, stampedPoint, size * .66, color, stroke.seed);
    });
  }
  ctx.restore();
}
