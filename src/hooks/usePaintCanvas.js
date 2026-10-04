import { useCallback, useEffect, useRef, useState } from "react";
import { PALETTES } from "../data/palettes";
import { ARCHETYPES, ARCHETYPE_RENDER_SHAPES } from "../data/archetypes";
import { edgeKey, updateContact } from "../utils/graphModel";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const makeId = prefix => globalThis.crypto?.randomUUID?.() || `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function usePaintCanvas({ archetype, palette, size, opacity, audioReactive, getEnergy, onSelect }) {
  const canvasRef = useRef(null), nodes = useRef([]), edges = useRef([]), drag = useRef(null), frame = useRef(0), contactLocks = useRef(new Set()), history = useRef([]);
  const state = useRef({ archetype, palette, size, opacity, audioReactive });
  const [count, setCount] = useState(0), [edgeCount, setEdgeCount] = useState(0), [selectedId, setSelectedId] = useState(null);
  state.current = { archetype, palette, size, opacity, audioReactive };

  const snapshot = () => history.current.push({ nodes: structuredClone(nodes.current), edges: structuredClone(edges.current) });
  const syncCounts = () => { setCount(nodes.current.length); setEdgeCount(edges.current.length); };
  const drawEdge = (ctx, edge, width, height, time) => {
    const source = nodes.current.find(node => node.id === edge.source), target = nodes.current.find(node => node.id === edge.target);
    if (!source || !target) return;
    const x1 = source.x * width, y1 = source.y * height, x2 = target.x * width, y2 = target.y * height;
    const dx = x2 - x1, dy = y2 - y1, bend = Math.sin(edge.seed + time * .00035) * Math.min(12, Math.hypot(dx, dy) * .08);
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    gradient.addColorStop(0, ARCHETYPES[source.archetype].palette[0]); gradient.addColorStop(1, ARCHETYPES[target.archetype].palette[0]);
    ctx.save(); ctx.globalAlpha = .28; ctx.strokeStyle = gradient; ctx.lineWidth = 4; ctx.shadowBlur = 10; ctx.shadowColor = ARCHETYPES[source.archetype].palette[1];
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo((x1 + x2) / 2 - dy * .04 + bend, (y1 + y2) / 2 + dx * .04 + bend, x2, y2); ctx.stroke();
    ctx.globalAlpha = .65; ctx.lineWidth = .8; ctx.shadowBlur = 0; ctx.stroke(); ctx.restore();
  };
  const drawNode = (ctx, node, width, height, energy) => {
    const config = ARCHETYPES[node.archetype], pulse = node.audioReactive ? 1 + energy * .08 : 1, radius = node.size * .62 * pulse;
    ctx.save(); ctx.translate(node.x * width, node.y * height); ctx.globalAlpha = node.opacity;
    const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, radius); halo.addColorStop(0, `${config.palette[0]}66`); halo.addColorStop(1, "transparent");
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
    ctx.font = `${node.size * pulse}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(node.emoji, 0, 1);
    if (node.id === selectedId) { ctx.globalAlpha = .75; ctx.strokeStyle = "#fff"; ctx.lineWidth = 1; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.arc(0, 0, radius + 5, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
  };
  const render = useCallback((time = 0) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"), width = canvas.clientWidth, height = canvas.clientHeight, colors = PALETTES[state.current.palette];
    ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    const background = ctx.createRadialGradient(width * .36, height * .28, 0, width * .5, height * .5, width * .68); background.addColorStop(0, colors.paper[0]); background.addColorStop(1, colors.paper[1]); ctx.fillStyle = background; ctx.fillRect(0, 0, width, height);
    edges.current.forEach(edge => drawEdge(ctx, edge, width, height, time));
    const energy = getEnergy(); nodes.current.forEach(node => drawNode(ctx, node, width, height, energy));
    frame.current = requestAnimationFrame(render);
  }, [getEnergy, selectedId]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { const rect = canvas.getBoundingClientRect(), density = Math.min(devicePixelRatio || 1, 2); canvas.width = Math.round(rect.width * density); canvas.height = Math.round(rect.height * density); };
    resize(); const observer = new ResizeObserver(resize); observer.observe(canvas); frame.current = requestAnimationFrame(render);
    return () => { observer.disconnect(); cancelAnimationFrame(frame.current); };
  }, [render]);

  const point = (event, constrain = true) => {
    const rect = canvasRef.current.getBoundingClientRect(), rawX = clamp((event.clientX - rect.left) / rect.width, 0, 1), rawY = clamp((event.clientY - rect.top) / rect.height, 0, 1), dx = rawX - .5, dy = rawY - .5, distance = Math.hypot(dx, dy);
    if (distance > .5 && !constrain) return null;
    return distance <= .5 ? { x: rawX, y: rawY } : { x: .5 + dx / distance * .5, y: .5 + dy / distance * .5 };
  };
  const pixelDistance = (first, second) => Math.hypot((first.x - second.x) * canvasRef.current.clientWidth, (first.y - second.y) * canvasRef.current.clientHeight);
  const isTouching = (first, second, extra = 0) => pixelDistance(first, second) <= (first.size + second.size) * .32 + extra;
  const hitTest = position => [...nodes.current].reverse().find(node => pixelDistance(position, node) <= Math.max(22, node.size * .62));
  const select = node => { setSelectedId(node?.id || null); onSelect?.(node || null); };
  const updateContacts = moving => {
    nodes.current.forEach(other => {
      if (other.id === moving.id) return;
      const result = updateContact(edges.current, contactLocks.current, moving.id, other.id, isTouching(moving, other), !isTouching(moving, other, 14));
      if (result.toggled) setEdgeCount(edges.current.length);
    });
  };
  const onPointerDown = event => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    event.preventDefault(); const position = point(event, false); if (!position) return;
    canvasRef.current.setPointerCapture(event.pointerId); const hit = hitTest(position);
    if (hit) {
      select(hit);
      nodes.current.forEach(other => { if (other.id !== hit.id && isTouching(hit, other, 14)) contactLocks.current.add(edgeKey(hit.id, other.id)); });
      drag.current = { id: hit.id, pointerId: event.pointerId, recorded: false }; return;
    }
    snapshot(); const config = ARCHETYPES[state.current.archetype];
    const node = { id: makeId("node"), archetype: state.current.archetype, emoji: config.emoji, x: position.x, y: position.y, size: state.current.size, opacity: state.current.opacity, createdAt: Date.now(), audioReactive: state.current.audioReactive };
    nodes.current.push(node); syncCounts(); select(node);
    nodes.current.forEach(other => { if (other.id !== node.id && isTouching(node, other, 14)) contactLocks.current.add(edgeKey(node.id, other.id)); });
  };
  const onPointerMove = event => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    event.preventDefault(); const position = point(event), node = nodes.current.find(item => item.id === drag.current.id); if (!node) return;
    if (!drag.current.recorded) { snapshot(); drag.current.recorded = true; }
    node.x = position.x; node.y = position.y; updateContacts(node);
  };
  const stop = event => { if (!event || drag.current?.pointerId === event.pointerId) drag.current = null; };
  const updateSelected = useCallback(patch => { const node = nodes.current.find(item => item.id === selectedId); if (!node) return; Object.assign(node, patch); onSelect?.(node); }, [onSelect, selectedId]);
  const deleteSelected = useCallback(() => {
    if (!selectedId) return; snapshot(); nodes.current = nodes.current.filter(node => node.id !== selectedId); edges.current = edges.current.filter(edge => edge.source !== selectedId && edge.target !== selectedId); contactLocks.current = new Set([...contactLocks.current].filter(key => !key.includes(selectedId))); syncCounts(); setSelectedId(null); onSelect?.(null);
  }, [onSelect, selectedId]);
  const clearSelection = useCallback(() => { setSelectedId(null); onSelect?.(null); }, [onSelect]);
  const undo = useCallback(() => { const previous = history.current.pop(); if (!previous) return; nodes.current = previous.nodes; edges.current = previous.edges; contactLocks.current.clear(); syncCounts(); setSelectedId(null); onSelect?.(null); }, [onSelect]);
  const clear = useCallback(() => { if (!nodes.current.length) return; snapshot(); nodes.current = []; edges.current = []; contactLocks.current.clear(); syncCounts(); setSelectedId(null); onSelect?.(null); }, [onSelect]);
  const download = useCallback(() => { const anchor = document.createElement("a"); anchor.download = `psypaint-network-${Date.now()}.png`; anchor.href = canvasRef.current.toDataURL("image/png"); anchor.click(); }, []);
  const getNodes = useCallback(() => nodes.current.map(node => ({ ...node })), []);
  const getGraph = useCallback(() => ({ nodes: getNodes(), edges: edges.current.map(({ seed, ...edge }) => ({ ...edge })) }), [getNodes]);
  const getStrokes = useCallback(() => nodes.current.map(node => ({ ...node, type: ARCHETYPE_RENDER_SHAPES[node.archetype], brush: `projective-${ARCHETYPE_RENDER_SHAPES[node.archetype]}`, color: ARCHETYPES[node.archetype].palette[0], rotation: 0, seed: node.createdAt % 997, points: [{ x: node.x, y: node.y, p: .5 }] })), []);
  return { canvasRef, canvasProps: { onPointerDown, onPointerMove, onPointerUp: stop, onPointerCancel: stop }, undo, clear, download, deleteSelected, clearSelection, updateSelected, getNodes, getGraph, getStrokes, count, edgeCount, selectedId };
}
