import { glowPoint, hash, strokePath } from "./fieldUtils.js";

export class FireFX {
  constructor(node) {
    this.node = node; this.time = 0; const importance = node.size / 46;
    this.extent = .45 + importance * .55; this.embers = Array.from({ length: Math.round((38 + importance * 38) * node.opacity) }, (_, index) => ({ phase: hash(index + 33), drift: hash(index + 77) * 2 - 1, depth: hash(index + 141) * 2 - 1, speed: .25 + hash(index + 9) * .55 }));
  }
  update(delta, audio) { this.time += delta * (.45 + audio.mid * .8); this.audio = audio; }
  draw(ctx, project, center) {
    const audio = this.audio, height = this.extent * (1.35 + audio.low * .65);
    for (let filament = 0; filament < 7; filament++) { const points = []; for (let step = 0; step <= 15; step++) { const u = step / 15, flicker = Math.sin(this.time * (1.2 + filament * .06) + u * 5 + filament) * (.12 + u * .22) * (1 + audio.mid); points.push(project({ x: center.x + flicker + (filament - 3) * .07 * (1 - u), y: center.y + u * height - height * .45, z: center.z + Math.cos(this.time + u * 4 + filament) * .14 })); } strokePath(ctx, points, filament % 2 ? "#ff6a27" : "#ffc34d", .08 + this.node.opacity * .1, 7 - filament * .45); strokePath(ctx, points, "#ffe5a1", .13, .65); }
    this.embers.forEach((ember, index) => { const life = (ember.phase + this.time * ember.speed) % 1, spiral = this.time * 1.4 + life * 5 + ember.drift; const point = project({ x: center.x + Math.sin(spiral) * this.extent * life * .45, y: center.y - height * .38 + life * height * 1.35, z: center.z + ember.depth * .36 + Math.cos(spiral) * .16 }); glowPoint(ctx, point, .7 + index % 3 * .35, index % 4 ? "#ff8b31" : "#fff1b0", (1 - life) * (.25 + this.node.opacity * .35 + audio.high * .18)); });
  }
  dispose() { this.embers.length = 0; }
}
