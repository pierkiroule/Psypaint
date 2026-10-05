import { ARCHETYPES } from "../data/archetypes.js";
import { hash, lerp } from "./fieldUtils.js";

function watercolorBlob(ctx, points, color, alpha, blur = 0) {
  const visible = points.filter(Boolean); if (visible.length < 4) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.filter = blur ? `blur(${blur}px)` : "none";
  ctx.beginPath(); ctx.moveTo(visible[0].x, visible[0].y);
  for (let index = 0; index < visible.length; index++) { const point = visible[index], next = visible[(index + 1) % visible.length]; ctx.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2); }
  ctx.closePath(); ctx.fill(); ctx.restore();
}

export class WatercolorSkydome {
  constructor(graph, centers) {
    this.graph = graph; this.centers = centers; this.time = 0;
    this.grain = Array.from({ length: Math.min(180, 48 + graph.nodes.length * 18) }, (_, index) => ({ node: graph.nodes[index % graph.nodes.length], phase: hash(index + 41), angle: hash(index + 170) * Math.PI * 2, radius: .12 + hash(index + 310) * .9 }));
  }
  update(delta, audio) { this.time += delta * (.12 + audio.mid * .18); this.audio = audio; }
  draw(ctx, project, width, height) {
    const audio = this.audio;
    const palettes = this.graph.nodes.map(node => ARCHETYPES[node.archetype].palette);
    // Broad translucent veils make the painted matter continuous across the full 180° canopy.
    ctx.save(); ctx.globalCompositeOperation = "screen";
    for (let veil = 0; veil < 6; veil++) {
      const palette = palettes[veil % palettes.length], centerX = width * (.08 + veil * .17 + Math.sin(this.time * (.18 + veil * .015) + veil) * .055), centerY = height * (.32 + Math.cos(this.time * .2 + veil * 1.7) * .17);
      const radius = Math.max(width, height) * (.34 + veil * .045) * (1 + audio.low * .08), gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, `${palette[0]}24`); gradient.addColorStop(.38, `${palette[1]}18`); gradient.addColorStop(.76, `${palette[2]}0c`); gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();
    // Moving ink strata cross the panorama like diluted calligraphy in water.
    for (let band = 0; band < 5; band++) {
      const palette = palettes[band % palettes.length], baseline = height * (.18 + band * .17), amplitude = height * (.055 + audio.low * .035), phase = this.time * (.3 + band * .025) + band * 1.4;
      ctx.save(); ctx.globalCompositeOperation = band % 2 ? "screen" : "source-over"; ctx.globalAlpha = .035 + audio.energy * .025; ctx.fillStyle = palette[band % 3]; ctx.filter = `blur(${8 + band * 3}px)`;
      ctx.beginPath(); ctx.moveTo(-width * .1, baseline);
      for (let step = 0; step <= 16; step++) { const x = width * (step / 16), y = baseline + Math.sin(step * .72 + phase) * amplitude + Math.cos(step * .31 - phase) * amplitude * .45; ctx.lineTo(x, y); }
      ctx.lineTo(width * 1.1, baseline + height * .2); ctx.lineTo(-width * .1, baseline + height * .18); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    this.graph.nodes.forEach((node, nodeIndex) => {
      const center = this.centers.get(node.id), palette = ARCHETYPES[node.archetype].palette, importance = node.size / 46, presence = node.opacity;
      for (let wash = 0; wash < 7; wash++) {
        const points = [], lobes = 18, phase = this.time * (.35 + wash * .025) + hash(nodeIndex * 23 + wash) * 8, extent = (.42 + importance * .48) * (1 + audio.low * .15);
        for (let index = 0; index < lobes; index++) {
          const angle = index / lobes * Math.PI * 2, vertical = Math.sin(angle), horizontal = Math.cos(angle), irregularity = 1 + Math.sin(vertical * (2 + wash % 4) + phase) * .16 + Math.cos(Math.abs(horizontal) * 5 - phase * .6) * .07;
          const x = center.x + horizontal * extent * irregularity, y = center.y + vertical * extent * (.56 + wash * .025) * irregularity, z = center.z + Math.sin(vertical * 2 + phase) * .12 + (wash - 3) * .018;
          points.push(project({ x, y, z }));
        }
        watercolorBlob(ctx, points, palette[wash % palette.length], (.026 + presence * .038) * (1 + audio.energy * .55), 2 + wash * .7);
      }
      // A pale negative-space bloom gives each stain its Rorschach-like bilateral breathing.
      const halo = project(center); if (halo) { const radius = Math.max(18, height * halo.scale * (.2 + importance * .13)); const gradient = ctx.createRadialGradient(halo.x, halo.y, 0, halo.x, halo.y, radius); gradient.addColorStop(0, `${palette[2]}22`); gradient.addColorStop(.65, `${palette[0]}0b`); gradient.addColorStop(1, "transparent"); ctx.fillStyle = gradient; ctx.fillRect(halo.x - radius, halo.y - radius, radius * 2, radius * 2); }
    });

    // Relations become shared pigment blooms, never connecting strokes.
    this.graph.edges.forEach((edge, edgeIndex) => {
      const source = this.centers.get(edge.source), target = this.centers.get(edge.target); if (!source || !target) return;
      const sourceNode = this.graph.nodes.find(node => node.id === edge.source), targetNode = this.graph.nodes.find(node => node.id === edge.target), colors = [ARCHETYPES[sourceNode.archetype].palette[0], ARCHETYPES[targetNode.archetype].palette[0]];
      for (let bloom = 0; bloom < 4; bloom++) { const center = { x: lerp(source.x, target.x, .38 + bloom * .08), y: lerp(source.y, target.y, .38 + bloom * .08), z: lerp(source.z, target.z, .38 + bloom * .08) }, points = []; for (let index = 0; index < 14; index++) { const angle = index / 14 * Math.PI * 2, radius = .24 + Math.sin(angle * 3 + this.time + edgeIndex) * .06; points.push(project({ x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius * .55, z: center.z + Math.sin(angle * 2) * .08 })); } watercolorBlob(ctx, points, colors[bloom % 2], .025 + audio.energy * .018, 4 + bloom); }
    });

    // Pigment granulation remains tied to each field and gently shimmers on high frequencies.
    this.grain.forEach((grain, index) => { const center = this.centers.get(grain.node.id), angle = grain.angle + this.time * (.2 + grain.phase * .15), point = project({ x: center.x + Math.cos(angle) * grain.radius, y: center.y + Math.sin(angle * .7) * grain.radius * .55, z: center.z + Math.sin(angle) * .18 }); if (!point) return; ctx.globalAlpha = .025 + audio.high * .05; ctx.fillStyle = ARCHETYPES[grain.node.archetype].palette[index % 3]; ctx.beginPath(); ctx.arc(point.x, point.y, .35 + point.scale * 1.1, 0, Math.PI * 2); ctx.fill(); });
    ctx.globalAlpha = 1; ctx.filter = "none";
  }
  dispose() { this.grain.length = 0; }
}
