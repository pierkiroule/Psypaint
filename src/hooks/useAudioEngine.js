import { useCallback, useEffect, useRef, useState } from "react";
const NOTES = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99];
export function useAudioEngine(onMessage) {
  const engine = useRef(null); const [playing, setPlaying] = useState(false);
  const initialise = useCallback(async () => {
    if (!engine.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) throw new Error("Audio indisponible");
      const context = new AudioContext(), analyser = context.createAnalyser(), master = context.createGain();
      const filter = context.createBiquadFilter(), drone = context.createOscillator(), leadOsc = context.createOscillator(), leadGain = context.createGain();
      analyser.fftSize = 256; analyser.smoothingTimeConstant = .84; master.gain.value = 0;
      filter.type = "lowpass"; filter.frequency.value = 650; drone.type = "sine"; drone.frequency.value = 110;
      leadOsc.type = "triangle"; leadGain.gain.value = 0; drone.connect(filter); leadOsc.connect(leadGain).connect(filter);
      filter.connect(master).connect(analyser).connect(context.destination); drone.start(); leadOsc.start();
      engine.current = { context, analyser, master, filter, drone, leadOsc, leadGain, data: new Uint8Array(analyser.frequencyBinCount) };
    }
    await engine.current.context.resume(); return engine.current;
  }, []);
  const toggle = useCallback(async () => {
    try { const audio = await initialise(), next = !playing; audio.master.gain.setTargetAtTime(next ? .14 : 0, audio.context.currentTime, .25); setPlaying(next); onMessage(next ? "Paysage sonore activé" : "Paysage sonore en pause"); }
    catch { onMessage("Le son n’est pas disponible sur cet appareil"); }
  }, [initialise, onMessage, playing]);
  const paintNote = useCallback(async (x, y) => {
    try { const audio = await initialise(); if (!playing) return; audio.leadOsc.frequency.setTargetAtTime(NOTES[Math.min(9, Math.floor(x * 10))], audio.context.currentTime, .04); audio.filter.frequency.setTargetAtTime(420 + (1-y)*1700, audio.context.currentTime, .08); audio.leadGain.gain.setTargetAtTime(.08, audio.context.currentTime, .03); } catch { /* drawing works without audio */ }
  }, [initialise, playing]);
  const endNote = useCallback(() => { const a = engine.current; if (a) a.leadGain.gain.setTargetAtTime(0, a.context.currentTime, .2); }, []);
  const getEnergy = useCallback(() => { const a = engine.current; if (!a || !playing) return 0; a.analyser.getByteFrequencyData(a.data); let sum=0; for(let i=0;i<30;i++) sum+=a.data[i]; return sum/30/255; }, [playing]);
  useEffect(() => () => { engine.current?.context.close(); engine.current = null; }, []);
  return { playing, toggle, paintNote, endNote, getEnergy };
}
