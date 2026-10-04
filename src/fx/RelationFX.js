import { glowPoint, hash, lerp } from "./fieldUtils.js";

export class RelationFX {
  constructor(edge, source, target, palettes) { this.edge = edge; this.source = source; this.target = target; this.palettes = palettes; this.time = 0; this.waveVortex = new Set([source.archetype, target.archetype]).size === 2 && [source.archetype, target.archetype].every(type => type === "wave" || type === "spiral"); this.particles = Array.from({ length: this.waveVortex ? 72 : 30 }, (_, index) => ({ phase: hash(index + edge.id.length), offset: hash(index + 70) * 2 - 1, depth: hash(index + 170) * 2 - 1, speed: .08 + hash(index + 15) * .18 })); }
  update(delta, audio) { this.time += delta * (.4 + audio.mid * .5); this.audio = audio; }
  draw(ctx, project, from, to) { this.particles.forEach((particle, index) => { const u = (particle.phase + this.time * particle.speed) % 1, influence = this.waveVortex ? u * u : Math.sin(u * Math.PI), angle = this.time + u * 10 + particle.offset * 2; const curl = this.waveVortex ? influence * (.18 + u * .48) : .1 * Math.sin(u * Math.PI); const world = { x: lerp(from.x, to.x, u) + Math.cos(angle) * curl, y: lerp(from.y, to.y, u) + Math.sin(angle) * curl + particle.offset * .12, z: lerp(from.z, to.z, u) + particle.depth * .16 + Math.sin(angle * .7) * curl }; const color = index % 2 ? this.palettes[0][0] : this.palettes[1][0]; glowPoint(ctx, project(world), .45 + index % 4 * .18, color, (.1 + this.source.opacity * this.target.opacity * .22) * Math.sin(u * Math.PI)); }); }
  dispose() { this.particles.length = 0; }
}
