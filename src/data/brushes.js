export const brushes = {
  wave: { emoji: "🌊", behavior: "fluid", colors: ["#167f9d", "#55c9cf", "#d9f5ed"], width: 30, audioResponse: { low: .8, mid: .6, high: .2 } },
  fire: { emoji: "🔥", behavior: "energetic", colors: ["#b94925", "#ed8b32", "#ffe095"], width: 22, audioResponse: { low: .35, mid: .85, high: .55 } },
  seed: { emoji: "🌱", behavior: "branching", colors: ["#3c744c", "#83a954", "#d3c76d"], width: 18, audioResponse: { low: .25, mid: .55, high: .18 } },
  vortex: { emoji: "🌀", behavior: "orbital", colors: ["#504d9e", "#747bc3", "#53b7bd"], width: 24, audioResponse: { low: .45, mid: .75, high: .4 } },
  cloud: { emoji: "☁️", behavior: "diffusion", colors: ["#91a4ad", "#c5d1d0", "#f3f1e8"], width: 42, audioResponse: { low: .35, mid: .3, high: .12 } },
  sparkle: { emoji: "✨", behavior: "particles", colors: ["#ad9561", "#ece1bd", "#f7f5e9"], width: 13, audioResponse: { low: .1, mid: .3, high: 1 } },
  moon: { emoji: "🌙", behavior: "halo", colors: ["#303968", "#777da3", "#d4d5dc"], width: 34, audioResponse: { low: .65, mid: .25, high: .12 } },
  bubble: { emoji: "🫧", behavior: "membrane", colors: ["#65afb1", "#c6a5ba", "#aaa8ce"], width: 25, audioResponse: { low: .3, mid: .45, high: .55 } }
};

export const brushEntries = Object.entries(brushes);
