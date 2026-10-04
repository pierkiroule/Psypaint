import { useCallback, useEffect, useRef, useState } from "react";
import { PALETTES } from "../data/palettes";
import { renderPaintStroke } from "../utils/paintRenderer";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const makeId = () => globalThis.crypto?.randomUUID?.() || `stamp-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function usePaintCanvas({ brush, palette, color, size, opacity, audioReactive, getEnergy, onSelect }) {
  const canvasRef = useRef(null), stamps = useRef([]), drag = useRef(null), frame = useRef(0);
  const state = useRef({ brush, palette, color, size, opacity, audioReactive });
  const [count, setCount] = useState(0), [selectedId, setSelectedId] = useState(null);
  state.current = { brush, palette, color, size, opacity, audioReactive };

  const render = useCallback((time = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d"), w = canvas.clientWidth, h = canvas.clientHeight, pal = PALETTES[state.current.palette];
    ctx.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    const bg = ctx.createRadialGradient(w * .36, h * .28, 0, w * .5, h * .5, w * .68);
    bg.addColorStop(0, pal.paper[0]); bg.addColorStop(1, pal.paper[1]);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    const energy = getEnergy();
    stamps.current.forEach(stamp => renderPaintStroke(ctx, stamp, [{ x: stamp.x * w, y: stamp.y * h, p: .5 }], time / 1800, energy));
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = .035;
    for (let i = 0; i < 100; i++) { ctx.fillStyle = i % 3 ? "#5e4b37" : "#fff"; ctx.fillRect((i * 73 % 101) / 101 * w, (i * 47 % 103) / 103 * h, i % 17 + 2, .5); }
    const selected = stamps.current.find(stamp => stamp.id === selectedId);
    if (selected) {
      ctx.globalAlpha = .7; ctx.strokeStyle = "#fff"; ctx.lineWidth = 1; ctx.setLineDash([3, 5]);
      ctx.beginPath(); ctx.arc(selected.x * w, selected.y * h, selected.size * .66 + 8, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    }
    frame.current = requestAnimationFrame(render);
  }, [getEnergy, selectedId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => { const r = canvas.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); canvas.width = Math.round(r.width * d); canvas.height = Math.round(r.height * d); };
    resize(); const observer = new ResizeObserver(resize); observer.observe(canvas); frame.current = requestAnimationFrame(render);
    return () => { observer.disconnect(); cancelAnimationFrame(frame.current); };
  }, [render]);

  const point = (event, constrain = true) => {
    const rect = canvasRef.current.getBoundingClientRect(), rawX = clamp((event.clientX - rect.left) / rect.width, 0, 1), rawY = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    const dx = rawX - .5, dy = rawY - .5, distance = Math.hypot(dx, dy);
    if (distance > .5 && !constrain) return null;
    return distance <= .5 ? { x: rawX, y: rawY } : { x: .5 + dx / distance * .5, y: .5 + dy / distance * .5 };
  };
  const hitTest = ({ x, y }) => [...stamps.current].reverse().find(stamp => Math.hypot((x - stamp.x) * canvasRef.current.clientWidth, (y - stamp.y) * canvasRef.current.clientHeight) <= Math.max(22, stamp.size * .72));
  const select = stamp => { setSelectedId(stamp?.id || null); onSelect?.(stamp || null); };
  const onPointerDown = event => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    event.preventDefault(); canvasRef.current.setPointerCapture(event.pointerId);
    const position = point(event, false); if (!position) return; const hit = hitTest(position);
    if (hit) { select(hit); drag.current = { id: hit.id, pointerId: event.pointerId, moved: false }; return; }
    const stamp = { id: makeId(), type: state.current.brush, x: position.x, y: position.y, color: state.current.color, size: state.current.size, opacity: state.current.opacity, rotation: Math.random() * Math.PI * 2, createdAt: Date.now(), audioReactive: state.current.audioReactive, seed: Math.random() * 100, brush: `projective-${state.current.brush}`, points: [position] };
    stamps.current.push(stamp); setCount(stamps.current.length); select(stamp);
  };
  const onPointerMove = event => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    event.preventDefault(); const position = point(event), stamp = stamps.current.find(item => item.id === drag.current.id);
    if (!stamp) return; stamp.x = position.x; stamp.y = position.y; stamp.points = [position]; drag.current.moved = true;
  };
  const stop = event => { if (!event || drag.current?.pointerId === event.pointerId) drag.current = null; };
  const updateSelected = useCallback(patch => {
    const stamp = stamps.current.find(item => item.id === selectedId); if (!stamp) return;
    Object.assign(stamp, patch); onSelect?.(stamp);
  }, [onSelect, selectedId]);
  const deleteSelected = useCallback(() => {
    if (!selectedId) return; stamps.current = stamps.current.filter(stamp => stamp.id !== selectedId); setCount(stamps.current.length); setSelectedId(null); onSelect?.(null);
  }, [onSelect, selectedId]);
  const clearSelection = useCallback(() => { setSelectedId(null); onSelect?.(null); }, [onSelect]);
  const undo = useCallback(() => { const removed = stamps.current.pop(); setCount(stamps.current.length); if (removed?.id === selectedId) { setSelectedId(null); onSelect?.(null); } }, [onSelect, selectedId]);
  const clear = useCallback(() => { stamps.current = []; setCount(0); setSelectedId(null); onSelect?.(null); }, [onSelect]);
  const download = useCallback(() => { const anchor = document.createElement("a"); anchor.download = `psypaint-${Date.now()}.png`; anchor.href = canvasRef.current.toDataURL("image/png"); anchor.click(); }, []);
  const getStrokes = useCallback(() => stamps.current, []);
  const getStamps = useCallback(() => stamps.current.map(({ points, brush: legacyBrush, seed, audioReactive: reactive, ...stamp }) => ({ ...stamp })), []);
  return { canvasRef, canvasProps: { onPointerDown, onPointerMove, onPointerUp: stop, onPointerCancel: stop }, undo, clear, download, deleteSelected, clearSelection, updateSelected, getStrokes, getStamps, count, selectedId };
}
