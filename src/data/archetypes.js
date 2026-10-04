export const ARCHETYPES = {
  wave: { emoji: "🌊", label: "Vague", palette: ["#18c8d8", "#247dc5", "#82f1e7"], fxType: "fluidWave", audio: { low: .8, mid: .7, high: .2, energy: .6, beat: .25 } },
  fire: { emoji: "🔥", label: "Feu", palette: ["#ffb02e", "#ef4934", "#ff6d20"], fxType: "embers", audio: { low: .35, mid: .7, high: .5, energy: 1, beat: .85 } },
  seed: { emoji: "🌱", label: "Pousse", palette: ["#93c83e", "#2f8d57", "#d5e76b"], fxType: "organicGrowth", audio: { low: .55, mid: .8, high: .25, energy: .45, beat: .2 } },
  rock: { emoji: "🪨", label: "Roche", palette: ["#8b8178", "#665c50", "#b4a58e"], fxType: "mineralMass", audio: { low: 1, mid: .25, high: .05, energy: .3, beat: .45 } },
  cloud: { emoji: "☁️", label: "Nuage", palette: ["#eef5f5", "#b9ccdb", "#dbe7ef"], fxType: "mist", audio: { low: .3, mid: .65, high: .35, energy: .35, beat: .1 } },
  moon: { emoji: "🌙", label: "Lune", palette: ["#b7c8f1", "#33437d", "#e5e7df"], fxType: "lunarHalo", audio: { low: .5, mid: .55, high: .2, energy: .35, beat: .1 } },
  sun: { emoji: "☀️", label: "Soleil", palette: ["#ffd84a", "#f4a62a", "#fff1a3"], fxType: "radiance", audio: { low: .4, mid: .65, high: .65, energy: .8, beat: .5 } },
  star: { emoji: "⭐", label: "Étoile", palette: ["#fff8d4", "#e9c85c", "#ffffff"], fxType: "sparkles", audio: { low: .1, mid: .35, high: 1, energy: .5, beat: .75 } },
  spiral: { emoji: "🌀", label: "Spirale", palette: ["#7049c8", "#304fd0", "#44ced3"], fxType: "vortex", audio: { low: .85, mid: .5, high: .4, energy: .8, beat: .35 } },
  bubble: { emoji: "🫧", label: "Bulle", palette: ["#b8e8f6", "#d7b9ef", "#8ee6dc"], fxType: "membrane", audio: { low: .2, mid: .55, high: .75, energy: .4, beat: .3 } },
  flower: { emoji: "🌸", label: "Fleur", palette: ["#ef8eb8", "#c53d80", "#ffd0d9"], fxType: "bloom", audio: { low: .3, mid: .75, high: .55, energy: .55, beat: .4 } },
  lightning: { emoji: "⚡", label: "Éclair", palette: ["#eefaff", "#5bbcff", "#8e67e8"], fxType: "electricArc", audio: { low: .15, mid: .55, high: 1, energy: .9, beat: 1 } },
};

export const ARCHETYPE_IDS = Object.keys(ARCHETYPES);

// Temporary adapter used by the current 360° renderer until each fxType gets its own 3D implementation.
export const ARCHETYPE_RENDER_SHAPES = {
  wave: "wave", fire: "shard", seed: "filament", rock: "cluster", cloud: "membrane", moon: "halo",
  sun: "halo", star: "shard", spiral: "organic", bubble: "halo", flower: "organic", lightning: "rift",
};
