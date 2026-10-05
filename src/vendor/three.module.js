// Focused Three.js-compatible surface used by EchoPaint's single shader scene.
// Keeping this renderer local avoids shipping the much larger general-purpose engine on mobile.
export class Vector2 { constructor(x = 0, y = 0) { this.x = x; this.y = y; } set(x, y) { this.x = x; this.y = y; return this; } }
export class Scene { constructor() { this.children = []; } add(object) { this.children.push(object); } }
export class OrthographicCamera {}
export class PlaneGeometry { dispose() {} }
export class ShaderMaterial { constructor(options) { Object.assign(this, options); } dispose() {} }
export class Mesh { constructor(geometry, material) { this.geometry = geometry; this.material = material; } }

export class WebGLRenderer {
  constructor({ canvas }) {
    this.canvas = canvas; this.gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "high-performance" }); this.program = null;
  }
  setPixelRatio(value) { this.pixelRatio = value; }
  setSize(width, height) { const ratio = this.pixelRatio || 1; this.canvas.width = Math.round(width * ratio); this.canvas.height = Math.round(height * ratio); }
  compile(material) {
    const gl = this.gl, shader = (type, source) => { const result = gl.createShader(type); gl.shaderSource(result, source); gl.compileShader(result); if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(result)); return result; };
    const program = gl.createProgram(); gl.attachShader(program, shader(gl.VERTEX_SHADER, material.vertexShader)); gl.attachShader(program, shader(gl.FRAGMENT_SHADER, material.fragmentShader)); gl.linkProgram(program); if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    this.program = program; this.material = material; const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW); const position = gl.getAttribLocation(program, "position"); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  }
  render(scene) {
    const material = scene.children[0]?.material, gl = this.gl; if (!gl || !material) return; if (!this.program) this.compile(material); gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); gl.useProgram(this.program);
    for (const [name, entry] of Object.entries(material.uniforms)) { const location = gl.getUniformLocation(this.program, name), value = entry.value; if (value instanceof Vector2) gl.uniform2f(location, value.x, value.y); else if (value instanceof Float32Array) { if (value.length === 24) gl.uniform2fv(location, value); else if (value.length === 12) gl.uniform1fv(location, value); else gl.uniform4fv(location, value); } else gl.uniform1f(location, value); }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  dispose() { if (this.program) this.gl.deleteProgram(this.program); }
}
