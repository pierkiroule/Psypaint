/**
 * Central symbolic genome. Symbols describe behaviour, never illustrations.
 * New genome traits can be added here and to GENOME_KEYS without changing UI.
 */
export const GENOME_KEYS = [
  "fluidity", "branching", "orbitality", "turbulence", "diffusion",
  "membrane", "sparkle", "verticality", "symmetry", "softness",
  "density", "luminosity", "depth"
];

const profile = (emoji, palette, traits, audioResponse) => ({
  emoji, palette, audioResponse, ...Object.fromEntries(GENOME_KEYS.map(key => [key, traits[key] ?? .12]))
});

export const archetypes = {
  wave: profile("🌊", ["#102d42", "#226b79", "#6db9ae", "#d5e6d2"], { fluidity: 1, turbulence: .36, softness: .82, depth: .74, diffusion: .42, membrane: .48 }, { low: .82, mid: .62, high: .2 }),
  growth: profile("🌱", ["#15332c", "#3d7153", "#91ad68", "#ddc77d"], { branching: 1, verticality: .5, softness: .56, density: .52, fluidity: .34, depth: .5 }, { low: .34, mid: .78, high: .25 }),
  fire: profile("🔥", ["#3c202b", "#934635", "#d47d4d", "#efd09a"], { turbulence: .92, verticality: 1, luminosity: .72, fluidity: .54, branching: .36, density: .48 }, { low: .42, mid: .82, high: .52 }),
  stone: profile("🪨", ["#222b30", "#536461", "#92977f", "#cdc5aa"], { density: .9, depth: .7, symmetry: .58, membrane: .6, softness: .22, turbulence: .16 }, { low: .75, mid: .28, high: .1 }),
  moon: profile("🌙", ["#151936", "#3c456d", "#858baa", "#d8d5c8"], { softness: .92, luminosity: .28, depth: .84, diffusion: .58, orbitality: .64, fluidity: .48 }, { low: .68, mid: .32, high: .16 }),
  sun: profile("☀️", ["#422b26", "#9b6544", "#d5ac66", "#f1e2aa"], { luminosity: 1, symmetry: .8, sparkle: .56, branching: .48, diffusion: .34, density: .52 }, { low: .5, mid: .5, high: .42 }),
  tree: profile("🌳", ["#15312b", "#3a624d", "#71885d", "#b9aa75"], { branching: .92, verticality: .72, density: .67, softness: .4, depth: .58, symmetry: .42 }, { low: .52, mid: .68, high: .2 }),
  bubble: profile("🫧", ["#1b3946", "#4b969a", "#ad91ae", "#ded3d0"], { membrane: 1, softness: 1, diffusion: .54, fluidity: .78, sparkle: .55, depth: .66 }, { low: .28, mid: .5, high: .65 }),
  vortex: profile("🌀", ["#1b2751", "#504b8a", "#408799", "#94c1b5"], { orbitality: 1, symmetry: .68, depth: .92, turbulence: .42, fluidity: .62, membrane: .4 }, { low: .5, mid: .8, high: .36 }),
  sparkle: profile("✨", ["#2f2c49", "#71657f", "#bba26c", "#ede2bd"], { sparkle: 1, luminosity: .84, density: .27, diffusion: .38, symmetry: .58, depth: .62 }, { low: .14, mid: .34, high: .92 }),
  feather: profile("🪶", ["#233740", "#637878", "#aa9486", "#ddd0ba"], { softness: .88, branching: .65, fluidity: .7, verticality: .42, diffusion: .46, density: .3 }, { low: .22, mid: .56, high: .36 }),
  drop: profile("💧", ["#123247", "#306a82", "#69a6ae", "#cfdfd5"], { fluidity: .96, membrane: .72, softness: .78, depth: .7, diffusion: .38, orbitality: .28 }, { low: .7, mid: .54, high: .22 })
};

export const symbolOrder = ["wave", "growth", "fire", "stone", "moon", "sun", "tree", "bubble", "vortex", "sparkle", "feather", "drop"];
