// Focused Three.js-compatible surface used by PsyKaleido's single shader scene.
// Keeping this renderer local avoids shipping the much larger general-purpose engine on mobile.
export class Vector2 { constructor(x = 0, y = 0) { this.x = x; this.y = y; } set(x, y) { this.x = x; this.y = y; return this; } }
export class Scene { constructor() { this.children = []; } add(object) { this.children.push(object); } remove(object) { const index = this.children.indexOf(object); if (index >= 0) this.children.splice(index, 1); } }
export class OrthographicCamera {}
export class PlaneGeometry { constructor(width = 1, height = 1) { this.width = width; this.height = height; } dispose() {} }
export class ShaderMaterial { constructor(options) { Object.assign(this, options); } dispose() {} }
export class Mesh { constructor(geometry, material) { this.geometry = geometry; this.material = material; this.position = { x: 0, y: 0, z: 0 }; this.rotation = { x: 0, y: 0, z: 0 }; this.scale = { x: 1, y: 1, z: 1 }; } }

// WebGL requires array uniforms to be addressed through their first element on
// a number of implementations (notably mobile Safari). Keep the fallback here
// rather than leaking driver-specific naming into every material.
export const getUniformLocation = (gl, program, name, entry) => {
  const location = gl.getUniformLocation(program, name);
  return location ?? (entry.type?.endsWith("fv") ? gl.getUniformLocation(program, `${name}[0]`) : null);
};

export class WebGLRenderer {
  constructor({ canvas }) {
    this.canvas = canvas; this.gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "high-performance" }); this.program = null;
  }
  setPixelRatio(value) { this.pixelRatio = value; }
  setSize(width, height) { const ratio = this.pixelRatio || 1; this.canvas.width = Math.round(width * ratio); this.canvas.height = Math.round(height * ratio); }
  compile(material) {
    const gl = this.gl, shader = (type, source) => { const result = gl.createShader(type); gl.shaderSource(result, source); gl.compileShader(result); if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) { const message = gl.getShaderInfoLog(result) || "Unknown GLSL compilation error"; console.error("PsyKaleido shader compilation failed:", message); throw new Error(message); } return result; };
    const program = gl.createProgram(); gl.attachShader(program, shader(gl.VERTEX_SHADER, material.vertexShader)); gl.attachShader(program, shader(gl.FRAGMENT_SHADER, material.fragmentShader)); gl.linkProgram(program); if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    this.program = program; this.material = material; this.buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW); this.position = gl.getAttribLocation(program, "position");
  }
  render(scene, camera) {
    const material = scene.children[0]?.material, gl = this.gl; if (!gl || !material) return; if (!this.program) this.compile(material); gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); gl.clear(gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.useProgram(this.program); gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer); gl.enableVertexAttribArray(this.position); gl.vertexAttribPointer(this.position, 2, gl.FLOAT, false, 0, 0);
    for (const [name, entry] of Object.entries(material.uniforms)) {
      const location = getUniformLocation(gl, this.program, name, entry), value = entry.value;
      if (location === null) continue;
      if (value instanceof Vector2) gl.uniform2f(location, value.x, value.y);
      else if (value instanceof Float32Array) {
        if (entry.type === "1fv") gl.uniform1fv(location, value);
        else if (entry.type === "2fv") gl.uniform2fv(location, value);
        else if (entry.type === "3fv") gl.uniform3fv(location, value);
        else gl.uniform4fv(location, value);
      } else gl.uniform1f(location, value);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // Additional scene objects own focused materials but are rendered by the
    // same scene traversal, context and camera—not by an overlay pass.
    for (let index = 1; index < scene.children.length; index++) {
      const object = scene.children[index];
      object.material?.render?.(gl, object, camera);
    }
  }
  dispose() { if (this.buffer) this.gl.deleteBuffer(this.buffer); if (this.program) this.gl.deleteProgram(this.program); }
}
