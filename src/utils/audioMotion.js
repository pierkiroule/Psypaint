const follow = (current, target, dt, attack, release) => current + (target - current) * (1 - Math.exp(-dt * (target > current ? attack : release)));

export const initialAudioMotion = () => ({ low: 0, mid: 0, high: 0, energy: 0, flow: 0, shimmer: 0, diffusion: 0, propagation: 0 });

export function advanceAudioMotion(previous, audio, dt) {
  const step = Math.min(Math.max(dt, 0), .05);
  const low = follow(previous.low, audio.low, step, 2.4, 1.25);
  const mid = follow(previous.mid, audio.mid, step, 3.1, 1.6);
  const high = follow(previous.high, audio.high, step, 4, 2.1);
  const energy = follow(previous.energy, audio.energy, step, 2.2, 1.1);
  return {
    low, mid, high, energy,
    flow: previous.flow + step * (.16 + low * .16 + mid * .24),
    shimmer: follow(previous.shimmer, high * high, step, 3.2, 1.4),
    diffusion: follow(previous.diffusion, low * .55 + mid * .45, step, 1.7, .8),
    propagation: follow(previous.propagation, audio.transient * .42, step, 5, 1.45)
  };
}
