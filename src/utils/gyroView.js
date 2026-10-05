const wrapDegrees = value => ((value + 540) % 360) - 180;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

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
