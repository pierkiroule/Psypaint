/**
 * Symbols are deliberately described through visual behaviour only. Their
 * meaning is never exposed to (or inferred for) the person using PsyKaleido.
 */
export const archetypes = {
  wave: { emoji: "🌊", palette: ["#123b55", "#2a8495", "#8bd5c8", "#d7ead8"], fluidity: 1, branching: .12, orbitality: .28, symmetry: .48, turbulence: .36, particles: .58, audioResponse: { low: .85, mid: .55, high: .18 } },
  growth: { emoji: "🌱", palette: ["#173a32", "#48785a", "#a1b86b", "#e1c982"], fluidity: .42, branching: 1, orbitality: .18, symmetry: .55, turbulence: .28, particles: .5, audioResponse: { low: .35, mid: .72, high: .24 } },
  fire: { emoji: "🔥", palette: ["#4c2530", "#a44d38", "#dd8a55", "#f2c886"], fluidity: .62, branching: .35, orbitality: .24, symmetry: .4, turbulence: .72, particles: .65, audioResponse: { low: .45, mid: .8, high: .5 } },
  stone: { emoji: "🪨", palette: ["#252d32", "#566866", "#9b9c82", "#d0c7aa"], fluidity: .16, branching: .3, orbitality: .12, symmetry: .67, turbulence: .16, particles: .25, audioResponse: { low: .72, mid: .26, high: .1 } },
  moon: { emoji: "🌙", palette: ["#171b3b", "#414873", "#8e91b0", "#ddd8c6"], fluidity: .52, branching: .12, orbitality: .7, symmetry: .58, turbulence: .2, particles: .34, audioResponse: { low: .68, mid: .3, high: .16 } },
  sun: { emoji: "☀️", palette: ["#4a3028", "#a86d48", "#e0b96f", "#f4e5b0"], fluidity: .36, branching: .5, orbitality: .54, symmetry: .76, turbulence: .3, particles: .62, audioResponse: { low: .52, mid: .48, high: .4 } },
  tree: { emoji: "🌳", palette: ["#18342f", "#416853", "#758e62", "#bdad78"], fluidity: .3, branching: .9, orbitality: .12, symmetry: .46, turbulence: .24, particles: .45, audioResponse: { low: .5, mid: .6, high: .2 } },
  bubble: { emoji: "🫧", palette: ["#203d4a", "#56a2a3", "#b69ab5", "#dfd2cc"], fluidity: .82, branching: .08, orbitality: .48, symmetry: .64, turbulence: .2, particles: .78, audioResponse: { low: .3, mid: .48, high: .6 } },
  vortex: { emoji: "🌀", palette: ["#202b58", "#554f91", "#468fa2", "#9ac8bc"], fluidity: .58, branching: .14, orbitality: 1, symmetry: .82, turbulence: .54, particles: .5, audioResponse: { low: .52, mid: .76, high: .36 } },
  sparkle: { emoji: "✨", palette: ["#34304f", "#786b87", "#c3a86f", "#eee3bd"], fluidity: .28, branching: .25, orbitality: .45, symmetry: .7, turbulence: .18, particles: 1, audioResponse: { low: .15, mid: .35, high: .9 } },
  feather: { emoji: "🪶", palette: ["#273b45", "#697f80", "#b49c8c", "#e1d3bc"], fluidity: .72, branching: .64, orbitality: .18, symmetry: .38, turbulence: .14, particles: .42, audioResponse: { low: .22, mid: .52, high: .34 } },
  drop: { emoji: "💧", palette: ["#15364c", "#356f88", "#72aeb5", "#d2e0d5"], fluidity: .94, branching: .06, orbitality: .35, symmetry: .6, turbulence: .25, particles: .48, audioResponse: { low: .7, mid: .5, high: .2 } }
};

export const symbolOrder = ["wave", "growth", "fire", "stone", "moon", "sun", "tree", "bubble", "vortex", "sparkle", "feather", "drop"];
