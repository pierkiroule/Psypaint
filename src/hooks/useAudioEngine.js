import { useCallback, useEffect, useRef, useState } from "react";

export function useAudioEngine(onMessage) {
  const engine = useRef(null);
  const objectUrl = useRef("");
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

  const getEnergy = useCallback(() => {
    const current = engine.current;
    if (!current || current.audio.paused) return 0;
    current.analyser.getByteFrequencyData(current.data);
    let sum = 0;
    for (let index = 0; index < current.data.length; index++) sum += current.data[index];
    return sum / current.data.length / 255;
  }, []);

  useEffect(() => () => {
    engine.current?.audio.pause();
    engine.current?.context.close();
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
  }, []);

  return { playing, fileName, loadFile, toggle, getEnergy };
}
