import { useCallback, useEffect, useRef } from "react";
import { VirtualJoystick } from "./VirtualJoystick";
import { createArchetypeFX } from "../fx/createArchetypeFX";
import { RelationFX } from "../fx/RelationFX";
import { clamp, nodeToWorld } from "../fx/fieldUtils";
import { ARCHETYPES } from "../data/archetypes";

function projectWorld(point, width, height, view) {
  let x = point.x - view.px, y = point.y - view.py, z = point.z - view.pz;
  const cy = Math.cos(view.yaw), sy = Math.sin(view.yaw); [x, z] = [x * cy - z * sy, x * sy + z * cy];
  const cp = Math.cos(view.pitch), sp = Math.sin(view.pitch); [y, z] = [y * cp - z * sp, y * sp + z * cp];
  const depth = -z; if (depth < .08) return null;
  const scale = (height * .5) / Math.tan(view.fov * .5) / depth;
  return { x: width * .5 + x * scale, y: height * .5 - y * scale, scale: clamp(scale / height, .2, 3), depth };
}

export function Immersive360({ active, getGraph, getAudioData, canvasRef, onExit }) {
  const localRef = useRef(null), navigation = useRef({ input: { x: 0, y: 0, magnitude: 0 }, velocity: 0, yawVelocity: 0 }), view = useRef({ yaw: 0, pitch: 0, fov: Math.PI / 2, x: 0, y: 0, pinch: 0, px: 0, py: 0, pz: 0 });
  const setNavigationInput = useCallback(input => { navigation.current.input = input; }, []);
  useEffect(() => { canvasRef.current = localRef.current; return () => { canvasRef.current = null; }; }, [canvasRef, active]);
  useEffect(() => {
    if (!active) return;
    const canvas = localRef.current, ctx = canvas.getContext("2d"), graph = getGraph();
    // Build every immersive object from a strict archetype payload, never from the 2D glyph.
    const fields = graph.nodes.map(node => ({ node, center: nodeToWorld(node), fx: createArchetypeFX(node) }));
    const fieldById = new Map(fields.map(field => [field.node.id, field]));
    const relations = graph.edges.map(edge => { const source = fieldById.get(edge.source), target = fieldById.get(edge.target); return source && target ? { source, target, fx: new RelationFX(edge, source.node, target.node, [ARCHETYPES[source.node.archetype].palette, ARCHETYPES[target.node.archetype].palette]) } : null; }).filter(Boolean);
    let frame, lastTime = 0, enteredAt = performance.now(); const points = new Map();
    const resize = () => { const density = Math.min(devicePixelRatio || 1, 2); canvas.width = Math.round(innerWidth * density); canvas.height = Math.round(innerHeight * density); canvas.style.width = `${innerWidth}px`; canvas.style.height = `${innerHeight}px`; ctx.setTransform(density, 0, 0, density, 0, 0); };
    const render = milliseconds => {
      const width = innerWidth, height = innerHeight, time = milliseconds / 1000, delta = Math.min((milliseconds - lastTime) / 1000, .04) || 0; lastTime = milliseconds;
      const ship = navigation.current, input = ship.input, camera = view.current, throttle = -input.y;
      ship.velocity += throttle * 2.1 * delta; ship.velocity *= Math.exp(-(Math.abs(throttle) < .01 ? 1.15 : .22) * delta); ship.velocity = clamp(ship.velocity, -.72, 2.25);
      const targetYawVelocity = -input.x * .78, turnBlend = 1 - Math.exp(-3.2 * delta); ship.yawVelocity += (targetYawVelocity - ship.yawVelocity) * turnBlend; camera.yaw += ship.yawVelocity * delta;
      const forwardX = -Math.sin(camera.yaw), forwardZ = -Math.cos(camera.yaw), distance = Math.hypot(camera.px, camera.pz), outward = distance ? (camera.px * forwardX + camera.pz * forwardZ) / distance : 0;
      if (distance > 3.15 && ship.velocity * outward > 0) ship.velocity *= Math.exp(-4.5 * delta);
      camera.px += forwardX * ship.velocity * delta; camera.pz += forwardZ * ship.velocity * delta;
      const safeDistance = Math.hypot(camera.px, camera.pz); if (safeDistance > 3.7) { camera.px = camera.px / safeDistance * 3.7; camera.pz = camera.pz / safeDistance * 3.7; ship.velocity *= .75; }

      const audio = getAudioData(), reveal = clamp((milliseconds - enteredAt) / 1100, 0, 1), background = ctx.createRadialGradient(width * (.42 + Math.sin(time * .04) * .08), height * .42, 0, width * .5, height * .5, Math.max(width, height));
      background.addColorStop(0, `rgba(${20 + audio.low * 18},${31 + audio.mid * 20},45,1)`); background.addColorStop(.52, "#101721"); background.addColorStop(1, "#05070d"); ctx.globalAlpha = 1; ctx.fillStyle = background; ctx.fillRect(0, 0, width, height);
      ctx.save(); ctx.globalAlpha = reveal * reveal;
      const project = point => projectWorld(point, width, height, camera);
      fields.forEach(field => { field.fx.update(delta, audio); field.fx.draw(ctx, project, field.center); });
      relations.forEach(relation => { relation.fx.update(delta, audio); relation.fx.draw(ctx, project, relation.source.center, relation.target.center); });
      ctx.restore();
      if (reveal < 1) { ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = (1 - reveal) * .32; ctx.strokeStyle = "#c8fff0"; ctx.lineWidth = Math.max(2, 18 * (1 - reveal)); ctx.beginPath(); ctx.arc(width / 2, height / 2, reveal * Math.hypot(width, height) * .7, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
      frame = requestAnimationFrame(render);
    };
    const down = event => { canvas.setPointerCapture(event.pointerId); points.set(event.pointerId, { x: event.clientX, y: event.clientY }); view.current.x = event.clientX; view.current.y = event.clientY; if (points.size === 2) { const [a, b] = [...points.values()]; view.current.pinch = Math.hypot(a.x - b.x, a.y - b.y); } };
    const move = event => { if (!points.has(event.pointerId)) return; points.set(event.pointerId, { x: event.clientX, y: event.clientY }); if (points.size === 2) { const [a, b] = [...points.values()], distance = Math.hypot(a.x - b.x, a.y - b.y); view.current.fov = clamp(view.current.fov - (distance - view.current.pinch) * .003, .7, 2.25); view.current.pinch = distance; return; } view.current.yaw -= (event.clientX - view.current.x) * .004; view.current.pitch = clamp(view.current.pitch + (event.clientY - view.current.y) * .0035, -1.15, 1.15); view.current.x = event.clientX; view.current.y = event.clientY; };
    const up = event => points.delete(event.pointerId), wheel = event => { view.current.fov = clamp(view.current.fov + event.deltaY * .001, .7, 2.25); };
    resize(); addEventListener("resize", resize); canvas.addEventListener("pointerdown", down); canvas.addEventListener("pointermove", move); canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up); canvas.addEventListener("wheel", wheel, { passive: true }); frame = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(frame); fields.forEach(field => field.fx.dispose()); relations.forEach(relation => relation.fx.dispose()); removeEventListener("resize", resize); canvas.removeEventListener("pointerdown", down); canvas.removeEventListener("pointermove", move); canvas.removeEventListener("pointerup", up); canvas.removeEventListener("pointercancel", up); canvas.removeEventListener("wheel", wheel); };
  }, [active, getGraph, getAudioData]);
  if (!active) return null;
  return <div className="immersive-360"><canvas ref={localRef} onDoubleClick={onExit} aria-label="Monde abstrait à 360 degrés"/><VirtualJoystick onInput={setNavigationInput}/><p>Propulsez et virez avec le manche · Glissez pour regarder</p></div>;
}
