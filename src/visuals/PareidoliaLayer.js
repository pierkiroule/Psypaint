const TAU = Math.PI * 2;
const TRIANGLE_CORNERS = [0, 1, 2, 0, 2, 3];
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

// Mulberry32 makes a symbolic composition repeatable without ever drawing its emoji.
const randomFrom = seed => {
  let state = (seed * 0xffffffff) >>> 0;
  return () => { state += 0x6d2b79f5; let value = state; value = Math.imul(value ^ value >>> 15, value | 1); value ^= value + Math.imul(value ^ value >>> 7, value | 61); return ((value ^ value >>> 14) >>> 0) / 4294967296; };
};

export function getPareidoliaQuality(width, dpr = 1, cores = 4) {
  const low = width < 700 || width * dpr < 760 || cores <= 4;
  return { name: low ? "LOW" : "HIGH", count: low ? 8 : 14, textureSize: 256 };
}

export function createFragmentPlan(composition, count) {
  if (!composition) return [];
  const random = randomFrom((composition.seed + composition.signature * .137) % 1);
  return Array.from({ length: count }, (_, index) => ({
    seed: random(), symmetry: clamp(composition.symmetry * .78 + random() * .22),
    lobes: 2 + Math.floor(random() * (3 + composition.branching * 5)),
    softness: clamp(composition.softness * .72 + random() * .28),
    voids: 1 + Math.floor(random() * (2 + (1 - composition.density) * 5)),
    x: (random() - .5) * 5.8, y: (random() - .5) * 3.5,
    z: -1.2 - random() * 7.2, size: .65 + random() * 1.35,
    rotation: (random() - .5) * .7, drift: .03 + random() * .055,
    alpha: .12 + random() * .15, paletteIndex: index % 4
  }));
}

function paintFragment(ctx, cell, item, composition, color) {
  const { x, y, size } = cell; const random = randomFrom(item.seed); const half = size / 2;
  ctx.clearRect(x, y, size, size); ctx.save(); ctx.translate(x + half, y + half);
  const rgb = color.map(value => Math.round(value * 255));
  ctx.filter = `blur(${Math.round(2 + item.softness * 5)}px)`;
  for (let wash = 0; wash < 22; wash++) {
    const side = random() > .5 ? 1 : -1, angle = random() * TAU;
    const radius = half * (.07 + random() * (.19 + composition.diffusion * .1));
    const px = side * half * (.06 + random() * .48), py = Math.sin(angle) * half * .58;
    const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius);
    const opacity = .035 + random() * .075;
    gradient.addColorStop(0, `rgba(${rgb},${opacity})`); gradient.addColorStop(.64, `rgba(${rgb},${opacity * .6})`); gradient.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = gradient; ctx.beginPath(); ctx.ellipse(px, py, radius * (1 + random()), radius * (.35 + random()), angle, 0, TAU); ctx.fill();
    // Imperfect bilateral echoes create open Rorschach-like fields, not icons.
    if (random() < item.symmetry) { ctx.save(); ctx.scale(-1, 1); ctx.globalAlpha = .72 + random() * .2; ctx.fill(); ctx.restore(); }
  }
  ctx.filter = "none"; ctx.globalCompositeOperation = "destination-out";
  for (let hole = 0; hole < item.voids; hole++) { const px = (random() - .5) * half, py = (random() - .5) * half * 1.15; ctx.fillStyle = `rgba(0,0,0,${.3 + random() * .45})`; ctx.beginPath(); ctx.ellipse(px, py, half * (.035 + random() * .12), half * (.08 + random() * .18), random() * TAU, 0, TAU); ctx.fill(); }
  ctx.restore();
}

// World-space membranes share the main scene's yaw/pitch instead of following
// the viewport. Their projected Z remains in front of the far-plane backdrop.
export const PAREIDOLIA_VERTEX = `attribute vec3 aPosition;attribute vec2 aUv;attribute float aAlpha;uniform vec2 uView;varying vec2 vUv;varying float vAlpha;mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}void main(){vec3 p=aPosition;p.xz=rot(uView.x)*p.xz;p.yz=rot(uView.y)*p.yz;float distance=max(.35,-p.z);float clipDepth=.12+.82*smoothstep(.35,9.,distance);gl_Position=vec4(p.x/3.1,p.y/1.75,(clipDepth*2.-1.)*distance,distance);vUv=aUv;vAlpha=aAlpha;}`;
const FRAGMENT = `precision mediump float;uniform sampler2D uAtlas;varying vec2 vUv;varying float vAlpha;void main(){vec4 ink=texture2D(uAtlas,vUv);gl_FragColor=vec4(ink.rgb,ink.a*vAlpha);}`;

export class PareidoliaLayer {
  constructor() { this.enabled = true; this.items = []; this.composition = null; this.elapsed = 0; }
  init(scene, renderer) { this.scene = scene; this.renderer = renderer; this.gl = renderer.gl; if (scene) scene.pareidoliaLayer = this; this.setupGl(); }
  setupGl() {
    const gl = this.gl; if (!gl) return;
    const compile = (type, source) => { const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader); return shader; };
    this.program = gl.createProgram(); gl.attachShader(this.program, compile(gl.VERTEX_SHADER, PAREIDOLIA_VERTEX)); gl.attachShader(this.program, compile(gl.FRAGMENT_SHADER, FRAGMENT)); gl.linkProgram(this.program);
    this.buffer = gl.createBuffer(); this.texture = gl.createTexture(); this.data = new Float32Array(14 * 6 * 6);
  }
  generateFromEmojis(composition, quality) {
    if (!composition || !this.gl) { this.items = []; return; }
    this.composition = composition; this.quality = quality;
    // Stable back-to-front order keeps translucent overlaps rich while the
    // depth test still anchors every plane against the scene backdrop.
    this.items = createFragmentPlan(composition, quality.count).sort((a, b) => a.z - b.z);
    const columns = 4, rows = Math.ceil(quality.count / columns), canvas = document.createElement("canvas"); canvas.width = columns * quality.textureSize; canvas.height = rows * quality.textureSize;
    const ctx = canvas.getContext("2d"); this.items.forEach((item, index) => paintFragment(ctx, { x: index % columns * quality.textureSize, y: Math.floor(index / columns) * quality.textureSize, size: quality.textureSize }, item, composition, composition.palette[item.paletteIndex]));
    const gl = this.gl; gl.bindTexture(gl.TEXTURE_2D, this.texture); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.columns = columns; this.rows = rows;
  }
  update(delta, audio = {}, interaction = {}, view = { x: 0, y: 0 }) {
    if (!this.enabled || !this.items.length) return; this.elapsed += delta; const energy = audio.energy || 0, low = audio.low || 0, mid = audio.mid || 0; let offset = 0;
    for (let index = 0; index < this.items.length; index++) { const item = this.items[index];
      const depth = clamp((-item.z - 1) / 7), dx = (interaction.x ?? .5) - .5, dy = (interaction.y ?? .5) - .5, influence = (interaction.strength || 0) * Math.exp(-Math.hypot(item.x / 3 - dx, item.y / 2 - dy) * 2.2);
      const breath = 1 + energy * .025 + Math.sin(this.elapsed * (.11 + item.drift) + item.seed * TAU) * .012;
      const size = item.size * breath, x = item.x + dx * influence * .22 + Math.sin(this.elapsed * item.drift + index) * .025, y = item.y + dy * influence * .18 + Math.cos(this.elapsed * item.drift + index) * .02;
      const z = item.z + low * .14 * (index % 2 ? 1 : -1) + influence * .22, rotation = item.rotation + mid * .018 + this.elapsed * item.drift * .025;
      const c = Math.cos(rotation) * size, s = Math.sin(rotation) * size;
      const col = index % this.columns, row = Math.floor(index / this.columns), u0 = col / this.columns, u1 = (col + 1) / this.columns, v0 = row / this.rows, v1 = (row + 1) / this.rows, alpha = item.alpha * (1 + energy * .12) * (.72 + depth * .28);
      for (let vertex = 0; vertex < 6; vertex++) { const corner = TRIANGLE_CORNERS[vertex], right = corner === 1 || corner === 2, top = corner >= 2; this.data[offset++]=x+(corner===0?-c+s:corner===1?c+s:corner===2?c-s:-c-s); this.data[offset++]=y+(corner===0?-s-c:corner===1?s-c:corner===2?s+c:-s+c); this.data[offset++]=z; this.data[offset++]=right?u1:u0; this.data[offset++]=top?v0:v1; this.data[offset++]=alpha; }
    }
    this.draw(offset, view);
  }
  draw(length, view) {
    const gl = this.gl; gl.useProgram(this.program); gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer); gl.bufferData(gl.ARRAY_BUFFER, this.data, gl.DYNAMIC_DRAW);
    const stride = 24, bind = (name, count, offset) => { const location = gl.getAttribLocation(this.program, name); gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location, count, gl.FLOAT, false, stride, offset); }; bind("aPosition",3,0); bind("aUv",2,12); bind("aAlpha",1,20);
    gl.uniform2f(gl.getUniformLocation(this.program,"uView"), view.x || 0, view.y || 0); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,this.texture); gl.uniform1i(gl.getUniformLocation(this.program,"uAtlas"),0); gl.enable(gl.DEPTH_TEST); gl.depthMask(false); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA); gl.drawArrays(gl.TRIANGLES,0,length/6); gl.disable(gl.BLEND); gl.depthMask(true);
  }
  resize(width, dpr) { this.viewport = { width, dpr }; }
  setEnabled(enabled) { this.enabled = Boolean(enabled); }
  dispose() { if (!this.gl) return; this.gl.deleteBuffer(this.buffer); this.gl.deleteTexture(this.texture); this.gl.deleteProgram(this.program); if (this.scene?.pareidoliaLayer === this) delete this.scene.pareidoliaLayer; this.items = []; }
}
