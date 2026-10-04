import { ARCHETYPES } from "../data/archetypes.js";
import { glowPoint, hash, strokePath } from "./fieldUtils.js";

export class PigmentCloudFX {
  constructor(graph, centers) {
    this.graph = graph; this.centers = centers; this.time = 0;
    const density = Math.min(520, 180 + graph.nodes.length * 42);
    this.particles = Array.from({ length: density }, (_, index) => {
      const node = graph.nodes[index % graph.nodes.length];
      return { node, phase: hash(index + 11) * Math.PI * 2, orbit: .18 + hash(index + 71) * 1.55, lift: hash(index + 131) * 2 - 1, depth: hash(index + 211) * 2 - 1, drift: .08 + hash(index + 301) * .24, size: .35 + hash(index + 401) * 1.8 };
    });
  }
  update(delta, audio) { this.time += delta * (.15 + audio.mid * .28); this.audio = audio; }
  draw(ctx, project) {
    const audio = this.audio, trails = [];
    this.particles.forEach((particle, index) => {
      const center = this.centers.get(particle.node.id), angle = particle.phase + this.time * particle.drift, tide = Math.sin(this.time * .7 + particle.phase) * (.08 + audio.low * .18), spread = particle.orbit * (1 + audio.energy * .16);
      const world = { x: center.x + Math.cos(angle) * spread, y: center.y + particle.lift * .72 + Math.sin(angle * 1.7) * .22 + tide, z: center.z + particle.depth * 1.05 + Math.sin(angle * .63) * .24 };
      const point = project(world); if (!point) return;
      const palette = ARCHETYPES[particle.node.archetype].palette, color = palette[index % palette.length], shimmer = index % 9 === 0 ? audio.high * .22 : 0;
      const radius = particle.size * (1 + audio.beat * .7), alpha = .035 + particle.node.opacity * .1 + shimmer;
      if (index % 17 === 0) glowPoint(ctx, point, radius * 1.35, color, alpha);
      else { ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(point.x, point.y, Math.max(.35, radius * point.scale), 0, Math.PI * 2); ctx.fill(); }
      if (index % 31 === 0) trails.push(point);
    });
    strokePath(ctx, trails, "#d9fbf5", .045 + audio.high * .035, .65);
    ctx.globalAlpha = 1;
  }
  dispose() { this.particles.length = 0; }
}
