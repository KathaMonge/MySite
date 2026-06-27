import { createCanvasObserver, lerp, lerpHex } from './utils';

export function init(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.getElementById('equalizer') as HTMLCanvasElement;
  const audio = document.querySelector<HTMLAudioElement>('.neon-audio');
  if (!c || !audio) return;
  const ctx = c.getContext('2d')!;

  const BAR_COUNT = 28;
  const HALF = BAR_COUNT / 2;
  const heights: number[] = [];
  const targets: number[] = [];
  let running = false;
  let audioCtx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let dataArray: Uint8Array<ArrayBuffer> | null = null;
  let connected = false;

  for (let i = 0; i < BAR_COUNT; i++) {
    heights[i] = 0.02 + Math.sin(i * 0.8) * 0.02;
    targets[i] = 0.05;
  }

  createCanvasObserver(c, () => { running = true; draw(); }, () => { running = false; });

  function connect(): void {
    if (connected || !audio) return;
    try {
      audioCtx = new AudioContext();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.3;

      const source = audioCtx.createMediaElementSource(audio!);
      source.connect(analyser);
      analyser.connect(audioCtx.destination);

      const bufLen = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufLen);

      audio!.volume = 0.25;

      if (audio!.paused) {
        audio!.play().catch(() => {});
      }

      connected = true;
    } catch {
      // Web Audio not available
    }
  }

  function tryConnectQuiet(): void {
    if (connected || !audio) return;
    if (audio.readyState >= 2) {
      connect();
    } else {
      audio.addEventListener('canplay', connect, { once: true });
      audio.load();
    }
  }

  document.addEventListener('click', tryConnectQuiet, { once: true });
  document.addEventListener('scroll', tryConnectQuiet, { once: true });
  audio.addEventListener('play', () => {
    if (!connected && audioCtx === null) {
      tryConnectQuiet();
    }
  });

  audio.addEventListener('loadedmetadata', () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  });

  setTimeout(tryConnectQuiet, 300);

  function draw(): void {
    if (!running) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (w <= 0 || h <= 0) { requestAnimationFrame(draw); return; }
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (!connected) {
      ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('\u25B6 Click play to start', w / 2, h / 2 + 4);
      requestAnimationFrame(draw);
      return;
    }

    if (connected && audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    let hasSignal = false;
    if (analyser && dataArray) {
      analyser.getByteFrequencyData(dataArray);
      for (let i = 0; i < dataArray.length; i++) {
        if (dataArray[i] > 5) { hasSignal = true; break; }
      }
    }

    const freqLen = dataArray ? dataArray.length : 0;

    if (hasSignal && freqLen > 0 && dataArray) {
      const binsPerBar = freqLen / HALF;
      const rawVals: number[] = [];

      for (let i = 0; i < HALF; i++) {
        const startBin = Math.floor(i * binsPerBar);
        const endBin = Math.floor((i + 1) * binsPerBar);
        let sum = 0, count = 0;
        for (let f = startBin; f < endBin && f < freqLen; f++) {
          sum += dataArray[f]; count++;
        }
        const raw = count > 0 ? (sum / count) / 255 : 0;
        rawVals[i] = Math.min(Math.pow(raw, 0.8) * 1.1, 1);
      }

      for (let i = 0; i < HALF; i++) {
        targets[i] = Math.max(rawVals[HALF - 1 - i], 0.02);
        targets[BAR_COUNT - 1 - i] = targets[i];
      }

      for (let i = 0; i < BAR_COUNT; i++) {
        const diff = targets[i] - heights[i];
        const rate = diff > 0 ? 0.3 : 0.12;
        heights[i] = lerp(heights[i], targets[i], rate);
      }
    } else {
      for (let i = 0; i < BAR_COUNT; i++) {
        const t = Date.now() * 0.001;
        const center = (BAR_COUNT - 1) / 2;
        const centerFalloff = Math.exp(-Math.pow((i - center) / (BAR_COUNT / 3.5), 2));
        const idle = 0.02 + 0.18 * centerFalloff * (0.5 + 0.5 * Math.sin(t * 2.5 + i * 0.7));
        targets[i] = idle;
      }
      for (let i = 0; i < BAR_COUNT; i++) {
        heights[i] = lerp(heights[i], targets[i], 0.08);
      }
      requestAnimationFrame(draw);
      return;
    }

    const gap = 2;
    const barW = Math.max(3, Math.floor((w - gap * (BAR_COUNT - 1)) / BAR_COUNT));
    const totalBarWidth = BAR_COUNT * barW + (BAR_COUNT - 1) * gap;
    const offsetX = Math.max(0, Math.floor((w - totalBarWidth) / 2));

    for (let i = 0; i < BAR_COUNT; i++) {
      const x = offsetX + i * (barW + gap);
      const barH = Math.max(2, heights[i] * h * 0.92);
      const y = h - barH;
      const t = i / (BAR_COUNT - 1);

      ctx.fillStyle = heights[i] > 0.75 ? '#FFFFFF' : lerpHex('#00C853', '#44AAFF', t);
      ctx.shadowColor = heights[i] > 0.6 ? '#44AAFF' : '#00C853';
      ctx.shadowBlur = heights[i] > 0.6 ? 12 : 6;
      ctx.fillRect(x, y, barW, barH);
    }
    ctx.shadowBlur = 0;

    requestAnimationFrame(draw);
  }

  running = true;
  draw();
}
