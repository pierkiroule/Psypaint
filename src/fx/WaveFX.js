import { glowPoint, hash, strokePath } from "./fieldUtils.js";

export class WaveFX {
  constructor(node) {
    this.node = node; this.time = hash(node.createdAt || 1) * 10;
    const importance = node.size / 46, presence = node.opacity;
    this.extent = .65 + importance * .7; this.particles = Array.from({ length: Math.round((42 + importance * 42) * presence) }, (_, index) => ({ phase: hash(index + 2) * Math.PI * 2, lane: hash(index + 91) * 2 - 1, depth: hash(index + 211) * 2 - 1, speed: .16 + hash(index + 17) * .22 }));
  }
  update(delta, audio) { this.time += delta * (.34 + audio.mid * .55); this.audio = audio; }
  draw(ctx, project, center) {
    const audio = this.audio, amplitude = this.extent * (.22 + audio.low * .32);
    for (let ribbon = 0; ribbon < 5; ribbon++) {
      const points = [];
      for (let step = 0; step <= 22; step++) { const u = step / 22 * 2 - 1, phase = this.time * (.7 + ribbon * .045) + u * 3.2 + ribbon * .9; points.push(project({ x: center.x + u * this.extent, y: center.y + Math.sin(phase) * amplitude + (ribbon - 2) * .12, z: center.z + Math.cos(phase * .72) * .34 + (ribbon - 2) * .08 })); }
      strokePath(ctx, points, ribbon % 2 ? "#31d8dc" : "#4b82df", .08 + this.node.opacity * .09, 10 - ribbon);
      strokePath(ctx, points, ribbon % 2 ? "#b9ffff" : "#45bccc", .16 + this.node.opacity * .12, .8 + ribbon * .15);
    }
    this.particles.forEach((particle, index) => { const flow = (particle.phase + this.time * particle.speed) % (Math.PI * 2), x = center.x + (flow / Math.PI - 1) * this.extent, wave = Math.sin(flow * 2.1 + particle.lane) * amplitude; glowPoint(ctx, project({ x, y: center.y + wave + particle.lane * .35, z: center.z + particle.depth * .65 + Math.cos(flow) * .24 }), .7 + (index % 4) * .28, index % 5 ? "#70e8e5" : "#efffff", .18 + this.node.opacity * (.2 + audio.high * .22)); });
  }
  dispose() { this.particles.length = 0; }
}
