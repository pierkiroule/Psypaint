import { useCallback, useEffect, useRef, useState } from "react";

export function useAudioEngine(onMessage) {
  const engine = useRef(null);
  const objectUrl = useRef("");
  const analysis = useRef({ low: 0, mid: 0, high: 0, energy: 0, transient: 0, previousEnergy: 0, peaks: { low: .18, mid: .18, high: .18, energy: .18 }, updatedAt: performance.now() });
  const [playing, setPlaying] = useState(false);
  const [fileName, setFileName] = useState("");

  const loadFile = useCallback(async file => {
    if (!file) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) throw new Error("Audio indisponible");
      if (!engine.current) {
        const context = new AudioContext();
        const analyser = context.createAnalyser();
        const audio = new Audio();
        audio.loop = true;
        const source = context.createMediaElementSource(audio);
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = .82;
        source.connect(analyser).connect(context.destination);
        audio.addEventListener("ended", () => setPlaying(false));
        engine.current = { context, analyser, audio, data: new Uint8Array(analyser.frequencyBinCount) };
      }
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = URL.createObjectURL(file);
      engine.current.audio.src = objectUrl.current;
      await engine.current.context.resume();
      await engine.current.audio.play();
      setFileName(file.name);
      setPlaying(true);
      onMessage(`Musique chargée : ${file.name}`);
    } catch {
      onMessage("Impossible de lire ce fichier audio");
    }
  }, [onMessage]);

  const toggle = useCallback(async () => {
    const current = engine.current;
    if (!current?.audio.src) {
      onMessage("Importez d’abord un morceau MP3");
      return;
    }
    if (current.audio.paused) {
      await current.context.resume();
      await current.audio.play();
      setPlaying(true);
    } else {
      current.audio.pause();
      setPlaying(false);
    }
  }, [onMessage]);

  const getAudioData = useCallback(() => {
    const current = engine.current;
    const smooth = analysis.current, now = performance.now(), delta = Math.min((now - smooth.updatedAt) / 1000, .1); smooth.updatedAt = now;
    let low = 0, mid = 0, high = 0, energy = 0;
    if (current && !current.audio.paused) {
      current.analyser.getByteFrequencyData(current.data); const length = current.data.length;
      for (let index = 0; index < length; index++) { const value = current.data[index] / 255; energy += value; if (index < length * .16) low += value / (length * .16); else if (index < length * .55) mid += value / (length * .39); else high += value / (length * .45); }
      energy /= length;
    }
    const normalize = (name, value) => { smooth.peaks[name] = Math.max(value, smooth.peaks[name] * Math.exp(-delta * .32), .08); return Math.min(1, value / smooth.peaks[name]); };
    low = normalize("low", low); mid = normalize("mid", mid); high = normalize("high", high); energy = normalize("energy", energy);
    const follow = (current, target) => current + (target - current) * (1 - Math.exp(-delta * (target > current ? 10 : 3.2)));
    smooth.low = follow(smooth.low, low); smooth.mid = follow(smooth.mid, mid); smooth.high = follow(smooth.high, high); smooth.energy = follow(smooth.energy, energy);
    const transient = Math.max(0, energy - smooth.previousEnergy - .08); smooth.transient = Math.max(transient * 2.8, smooth.transient * Math.exp(-delta * 6)); smooth.previousEnergy = follow(smooth.previousEnergy, energy);
    return { low: smooth.low, mid: smooth.mid, high: smooth.high, energy: smooth.energy, transient: smooth.transient };
  }, []);

  const getEnergy = useCallback(() => getAudioData().energy, [getAudioData]);

  useEffect(() => () => {
    engine.current?.audio.pause();
    engine.current?.context.close();
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
  }, []);

  return { playing, fileName, loadFile, toggle, getEnergy, getAudioData };
}
