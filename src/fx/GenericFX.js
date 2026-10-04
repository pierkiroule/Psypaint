import { glowPoint, hash, strokePath } from "./fieldUtils.js";

export class GenericFX {
  constructor(node, palette) { this.node = node; this.palette = palette; this.time = 0; this.particles = Array.from({ length: Math.round(32 * node.opacity + node.size * .35) }, (_, index) => ({ phase: hash(index + node.createdAt), radius: .2 + hash(index + 20) * .75, depth: hash(index + 90) * 2 - 1 })); }
  update(delta, audio) { this.time += delta * (.18 + audio.energy * .3); this.audio = audio; }
  draw(ctx, project, center) { const points = []; this.particles.forEach((particle, index) => { const angle = particle.phase * 6.28 + this.time * (.35 + particle.radius); const world = { x: center.x + Math.cos(angle) * particle.radius, y: center.y + Math.sin(angle * .7) * particle.radius, z: center.z + particle.depth * .7 }; const screen = project(world); points.push(index % 7 === 0 ? screen : null); glowPoint(ctx, screen, .5 + index % 3 * .3, this.palette[index % this.palette.length], .12 + this.node.opacity * .24); }); strokePath(ctx, points, this.palette[1], .1, .8); }
  dispose() { this.particles.length = 0; }
}
