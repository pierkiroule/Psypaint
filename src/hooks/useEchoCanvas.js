import { useCallback, useEffect, useRef, useState } from "react";
import { brushes } from "../data/brushes.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const rand = seed => { const x = Math.sin(seed * 12.9898) * 43758.5453; return x - Math.floor(x); };
const pointAt = (points, index) => points[Math.max(0, Math.min(points.length - 1, index))];

export function createSquiggle(brushType, x, y, time = performance.now()) {
  return { id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, brushType, points: [{ x, y, time, velocity: 0, direction: 0, curvature: 0 }], createdAt: time, age: 0, depth: rand(time) * .65 + .18, energy: .2, seed: Math.floor(rand(time + x * 991) * 100000), length: 0, duration: 0, complete: false, resonances: [] };
}

function path(ctx, points, wobble, seed, scale = 1) {
  if (points.length < 2) return false;
  ctx.beginPath();
  const first = points[0]; ctx.moveTo(first.x, first.y);
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i], n = points[i + 1], phase = Math.sin(i * 1.71 + seed + wobble) * scale;
    ctx.quadraticCurveTo(p.x + phase, p.y - phase * .55, (p.x + n.x) / 2, (p.y + n.y) / 2);
  }
  const last = points.at(-1); ctx.lineTo(last.x, last.y); return true;
}

function drawParticles(ctx, s, config, time, audio, density = 1) {
  const count = Math.min(90, Math.floor(s.length / 14 * density));
  for (let i = 0; i < count; i++) {
    const p = s.points[Math.floor(rand(s.seed + i) * s.points.length)]; if (!p) continue;
    const a = rand(s.seed + i * 7), phase = time * .00035 * (i % 3 + 1) + a * 8;
    const spread = (8 + a * 24) * (1 + s.energy * .35), rising = s.brushType === "fire" ? -(s.age * 7 + i % 9) : 0;
    const x = p.x + Math.cos(phase) * spread, y = p.y + Math.sin(phase * .8) * spread + rising;
    const radius = .55 + rand(s.seed + i * 19) * (s.brushType === "sparkle" ? 2.2 : 1.5) + audio.high * config.audioResponse.high * 1.7;
    ctx.globalAlpha = (.08 + a * .28) * (.7 + audio.high * config.audioResponse.high);
    ctx.fillStyle = config.colors[i % config.colors.length]; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  }
}

function renderSquiggle(ctx, s, time, audio) {
  const config = brushes[s.brushType], response = config.audioResponse;
  const resonance = audio.low * response.low + audio.mid * response.mid + audio.high * response.high;
  const breath = Math.sin(time * .0007 + s.seed) * (1.2 + resonance * 3);
  const depthAlpha = .72 + s.depth * .25, base = config.width * (.72 + s.energy * .25);
  ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
  if (["cloud", "moon"].includes(s.brushType)) ctx.filter = `blur(${3 + s.depth * 3}px)`;
  const passes = s.brushType === "sparkle" ? 1 : 4;
  for (let pass = passes - 1; pass >= 0; pass--) {
    const spread = pass * (s.brushType === "cloud" ? 10 : 4.5), wobble = time * .00025 + pass * 2.3;
    ctx.globalAlpha = (pass ? .055 : .19) * depthAlpha;
    ctx.strokeStyle = config.colors[pass % config.colors.length];
    ctx.lineWidth = Math.max(1, base + spread + breath * (pass ? .4 : 1));
    if (path(ctx, s.points, wobble, s.seed + pass, 1.5 + pass * .65)) ctx.stroke();
  }
  ctx.filter = "none";
  if (s.brushType === "seed") {
    const growth = Math.min(1, s.age / 4);
    for (let i = 3; i < s.points.length; i += 4) {
      const p = s.points[i], before = pointAt(s.points, i - 2), side = rand(s.seed + i) > .5 ? 1 : -1;
      const angle = Math.atan2(p.y - before.y, p.x - before.x) + side * (1.05 + rand(i + s.seed) * .45);
      const length = (7 + rand(s.seed * i) * 17) * growth * (1 + s.resonances.length * .12);
      ctx.globalAlpha = .18; ctx.strokeStyle = config.colors[i % 2]; ctx.lineWidth = .8 + rand(i) * 1.2;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.quadraticCurveTo(p.x + Math.cos(angle) * length * .5 + breath, p.y + Math.sin(angle) * length * .5, p.x + Math.cos(angle) * length, p.y + Math.sin(angle) * length); ctx.stroke();
    }
  }
  if (s.brushType === "bubble") {
    for (let i = 2; i < s.points.length; i += 5) { const p = s.points[i], r = 5 + rand(s.seed + i) * 12 + breath; ctx.globalAlpha = .11; ctx.strokeStyle = config.colors[i % 3]; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(p.x, p.y, r * 1.15, r * .82, rand(i) * 2, 0, Math.PI * 2); ctx.stroke(); }
  }
  if (["wave", "sparkle", "fire", "vortex"].includes(s.brushType)) drawParticles(ctx, s, config, time, audio, s.brushType === "sparkle" ? 2.6 : .65);
  for (const r of s.resonances) {
    const pulse = 13 + Math.sin(time * .0015 + r.phase) * 3 + audio.low * 8;
    const gradient = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, pulse * 2.5);
    gradient.addColorStop(0, "rgba(153,188,135,.16)"); gradient.addColorStop(1, "rgba(70,160,170,0)");
    ctx.globalAlpha = .8; ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(r.x, r.y, pulse * 2.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function useEchoCanvas({ brushType, getAudioData }) {
  const canvasRef = useRef(null), squiggles = useRef([]), active = useRef(new Map()), raf = useRef(0), history = useRef([]);
  const currentBrush = useRef(brushType), [count, setCount] = useState(0); currentBrush.current = brushType;
  const snapshot = () => history.current.push(structuredClone(squiggles.current));
  const position = event => { const rect = canvasRef.current.getBoundingClientRect(); return { x: clamp(event.clientX - rect.left, 0, rect.width), y: clamp(event.clientY - rect.top, 0, rect.height) }; };
  const addPoint = (s, next, time) => {
    const previous = s.points.at(-1), dx = next.x - previous.x, dy = next.y - previous.y, distance = Math.hypot(dx, dy), dt = Math.max(8, time - previous.time);
    if (distance < 2.5) return;
    const direction = Math.atan2(dy, dx), turn = Math.atan2(Math.sin(direction - previous.direction), Math.cos(direction - previous.direction));
    s.points.push({ ...next, time, velocity: distance / dt, direction, curvature: Math.abs(turn) });
    s.length += distance; s.duration = time - s.createdAt; s.energy = clamp(s.energy * .8 + Math.min(1, distance / dt) * .35 + Math.abs(turn) * .08, .12, 1);
    if (s.points.length > 280) s.points.splice(1, 1);
  };
  const detectResonance = s => {
    if (s.brushType !== "seed" && s.brushType !== "wave") return;
    const otherType = s.brushType === "seed" ? "wave" : "seed";
    for (const other of squiggles.current) if (other !== s && other.brushType === otherType) {
      for (let i = 0; i < s.points.length; i += 3) for (let j = 0; j < other.points.length; j += 4) {
        const a = s.points[i], b = other.points[j]; if (Math.hypot(a.x - b.x, a.y - b.y) < 25) {
          const resonance = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, phase: rand(s.seed + other.seed) * 9 };
          if (!s.resonances.length) s.resonances.push(resonance); if (!other.resonances.length) other.resonances.push(resonance); return;
        }
      }
    }
  };
  const onPointerDown = event => { if (event.pointerType === "mouse" && event.button !== 0) return; event.preventDefault(); snapshot(); canvasRef.current.setPointerCapture(event.pointerId); const p = position(event), s = createSquiggle(currentBrush.current, p.x, p.y, performance.now()); squiggles.current.push(s); active.current.set(event.pointerId, s); setCount(squiggles.current.length); };
  const onPointerMove = event => { const s = active.current.get(event.pointerId); if (!s) return; event.preventDefault(); for (const sample of event.getCoalescedEvents?.() || [event]) addPoint(s, position(sample), sample.timeStamp || performance.now()); };
  const finish = event => { const s = active.current.get(event.pointerId); if (!s) return; s.complete = true; detectResonance(s); active.current.delete(event.pointerId); };
  const undo = useCallback(() => { const prior = history.current.pop(); if (!prior) return; squiggles.current = prior; setCount(prior.length); }, []);
  const clear = useCallback(() => { if (!squiggles.current.length) return; snapshot(); squiggles.current = []; active.current.clear(); setCount(0); }, []);
  useEffect(() => {
    const canvas = canvasRef.current, ctx = canvas.getContext("2d", { alpha: false }); let observer;
    const resize = () => { const rect = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2); canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const render = time => { const width = canvas.clientWidth, height = canvas.clientHeight, dpr = canvas.width / width; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); const bg = ctx.createRadialGradient(width * .28, height * .18, 0, width * .5, height * .5, Math.max(width, height)); bg.addColorStop(0, "#f4f0e5"); bg.addColorStop(.58, "#e8e2d5"); bg.addColorStop(1, "#d8d1c4"); ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height); const audio = getAudioData(); for (const s of squiggles.current) { s.age = (time - s.createdAt) / 1000; renderSquiggle(ctx, s, time, audio); } raf.current = requestAnimationFrame(render); };
    resize(); observer = new ResizeObserver(resize); observer.observe(canvas); raf.current = requestAnimationFrame(render);
    return () => { observer.disconnect(); cancelAnimationFrame(raf.current); };
  }, [getAudioData]);
  return { canvasRef, canvasProps: { onPointerDown, onPointerMove, onPointerUp: finish, onPointerCancel: finish }, undo, clear, count };
}
