import { glowPoint, hash, strokePath } from "./fieldUtils.js";

export class VortexFX {
  constructor(node) {
    this.node = node; this.time = 0; const importance = node.size / 46;
    this.radius = .65 + importance * .75; this.particles = Array.from({ length: Math.round((110 + importance * 100) * node.opacity) }, (_, index) => ({ angle: hash(index + 5) * Math.PI * 2, ring: .12 + hash(index + 81) * .88, depth: hash(index + 173) * 2 - 1, speed: .25 + hash(index + 29) * .75 }));
  }
  update(delta, audio) { this.time += delta * (.22 + audio.mid * .85); this.audio = audio; }
  draw(ctx, project, center) {
    const audio = this.audio, breathing = 1 + Math.sin(this.time * .7) * .08 + audio.low * .2;
    this.particles.forEach((particle, index) => { const angle = particle.angle + this.time * particle.speed + Math.sin(this.time + particle.depth * 4) * .12, radius = this.radius * particle.ring * breathing * (1 + Math.sin(angle * 3 + particle.depth) * .08); const point = project({ x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius * .58, z: center.z + particle.depth * this.radius + Math.sin(angle * 2) * .18 }); glowPoint(ctx, point, .45 + (index % 5) * .18, index % 7 ? "#776be8" : "#bffcff", .18 + this.node.opacity * (.23 + audio.high * .28)); });
    for (let filament = 0; filament < 4; filament++) { const points = []; for (let step = 0; step < 24; step++) { const u = step / 23, angle = this.time * (.55 + filament * .08) + u * Math.PI * 3 + filament * 1.5, radius = this.radius * (.15 + u * .8) * breathing; points.push(project({ x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius * .58, z: center.z + (u - .5) * this.radius })); } strokePath(ctx, points, filament % 2 ? "#46dce2" : "#7b55d5", .08 + this.node.opacity * .08, 1.1); }
  }
  dispose() { this.particles.length = 0; }
}
