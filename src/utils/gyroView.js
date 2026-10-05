const wrapDegrees = value => ((value + 540) % 360) - 180;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * Stateful orientation mapping. `alpha` is accumulated from wrapped deltas so
 * crossing 359° → 0° cannot produce a full-screen jump. The heading component
 * is periodic, therefore a physical 360° turn returns smoothly to its origin.
 */
export function advanceOrientationView(state, sample, screenAngle = 0) {
  const next = state || {
    previousAlpha: Number.isFinite(sample.alpha) ? sample.alpha : 0,
    heading: 0,
    beta: Number.isFinite(sample.beta) ? sample.beta : 0,
    gamma: Number.isFinite(sample.gamma) ? sample.gamma : 0
  };
  const alpha = Number.isFinite(sample.alpha) ? sample.alpha : next.previousAlpha;
  const heading = next.heading + wrapDegrees(alpha - next.previousAlpha);
  const tiltX = clamp(((sample.gamma ?? next.gamma) - next.gamma) / 90, -.55, .55);
  const tiltY = clamp(((sample.beta ?? next.beta) - next.beta) / 90, -.55, .55);
  const yaw = heading * Math.PI / 180;
  const angle = screenAngle * Math.PI / 180;
  const horizontal = tiltX;
  return {
    x: yaw + (horizontal * Math.cos(angle) - tiltY * Math.sin(angle)) * .22,
    y: clamp((horizontal * Math.sin(angle) + tiltY * Math.cos(angle)) * .65, -.55, .55),
    yaw, previousAlpha: alpha, heading, beta: next.beta, gamma: next.gamma
  };
}

export function mapOrientationToView(sample, baseline, screenAngle = 0) {
  const origin = baseline || sample;
  const alpha = wrapDegrees((sample.alpha || 0) - (origin.alpha || 0));
  const beta = (sample.beta || 0) - (origin.beta || 0);
  const gamma = (sample.gamma || 0) - (origin.gamma || 0);
  const angle = screenAngle * Math.PI / 180;
  const horizontal = -alpha / 180 - gamma / 300;
  const vertical = beta / 180;
  return {
    x: horizontal * Math.cos(angle) - vertical * Math.sin(angle),
    y: clamp(horizontal * Math.sin(angle) + vertical * Math.cos(angle), -.48, .48),
    baseline: origin
  };
}
