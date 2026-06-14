import { createCanvasObserver, resizeCanvas } from './utils';

interface WaveParams {
  freq: number;
  amp: number;
  waveType: 0 | 1 | 2;
  running: boolean;
  stopped: boolean;
  phase: number;
}

const WAVE_NAMES = ['Sine', 'Square', 'Sawtooth'];
const WAVE_LABELS = [
  'y(t) = A \u00b7 sin(2\u03c0ft)',
  'y(t) = A \u00b7 sgn(sin(2\u03c0ft))',
  'y(t) = A \u00b7 (2 \u00b7 fract(ft) \u2212 1)',
];

function signal(x: number, t: number, freq: number, type: 0 | 1 | 2): number {
  const f = (freq / 30) * 0.05;
  const angle = x * f + t;
  switch (type) {
    case 1: return Math.sin(angle) >= 0 ? 1 : -1;
    case 2: return (((angle / (Math.PI * 2)) % 1 + 1.5) % 1 * 2 - 1);
    default: return Math.sin(angle);
  }
}

export function init(): void {
  const c = document.getElementById('oscilloscope') as HTMLCanvasElement;
  if (!c) return;
  const ctx = c.getContext('2d')!;

  const wave: WaveParams = {
    freq: 10, amp: 40, waveType: 0, running: false, stopped: false, phase: 0,
  };

  let dpr = window.devicePixelRatio || 1;
  let slope = 0.025;

  const waveBtn = document.getElementById('scope-wave-btn')!;
  const freqSlider = document.getElementById('scope-freq') as HTMLInputElement;
  const ampSlider = document.getElementById('scope-amp') as HTMLInputElement;
  const freqVal = document.getElementById('scope-freq-val')!;
  const ampVal = document.getElementById('scope-amp-val')!;
  const runBtn = document.getElementById('scope-run')!;
  const infoText = document.getElementById('scope-info-text')!;

  function resize(): void {
    dpr = window.devicePixelRatio || 1;
    resizeCanvas(c);
  }
  window.addEventListener('resize', resize);
  resize();

  createCanvasObserver(c, () => { wave.running = true; draw(); }, () => { wave.running = false; });

  function drawGrid(w: number, h: number): void {
    const cols = 10, rows = 8;
    const cellW = w / cols, cellH = h / rows;

    ctx.strokeStyle = 'rgba(0, 200, 83, 0.15)';
    ctx.lineWidth = 1;
    for (let r = 1; r < rows; r++) {
      const y = Math.round(r * cellH) + 0.5;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    for (let col = 1; col < cols; col++) {
      const x = Math.round(col * cellW) + 0.5;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }

    const centerY = Math.round(h / 2) + 0.5;
    ctx.strokeStyle = 'rgba(0, 200, 83, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, centerY); ctx.lineTo(w, centerY); ctx.stroke();
  }

  function draw(): void {
    if (!wave.running) return;
    const rect = c.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (w <= 0 || h <= 0) { requestAnimationFrame(draw); return; }

    dpr = window.devicePixelRatio || 1;
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = '#0A1A0F';
    ctx.fillRect(0, 0, w, h);

    drawGrid(w, h);

    const ampScale = wave.amp / 100;

    if (!wave.stopped) {
      const step = Math.max(1, 1 / dpr);

      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      ctx.beginPath();
      for (let px = 0; px <= w; px += step) {
        const v = signal(px, wave.phase, wave.freq, wave.waveType);
        const y = h / 2 - v * ampScale * h * 0.35;
        if (px === 0) ctx.moveTo(px, y); else ctx.lineTo(px, y);
      }
      ctx.strokeStyle = '#00C853';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00C853';
      ctx.shadowBlur = 20;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      for (let px = 0; px <= w; px += step) {
        const v = signal(px, wave.phase, wave.freq, wave.waveType);
        const y = h / 2 - v * ampScale * h * 0.35;
        if (px === 0) ctx.moveTo(px, y); else ctx.lineTo(px, y);
      }
      ctx.strokeStyle = 'rgba(0, 200, 83, 0.4)';
      ctx.lineWidth = 6;
      ctx.stroke();

      wave.phase += slope;
    }

    ctx.fillStyle = 'rgba(5, 18, 10, 0.7)';
    ctx.fillRect(0, 0, 46, 56);

    ctx.fillStyle = '#00C853';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('CH1', 6, 6);

    const live = document.getElementById('scope-live-dot') as HTMLElement;
    if (live) {
      live.style.background = wave.stopped ? '#FF8F00' : '#00C853';
      live.style.boxShadow = wave.stopped ? '0 0 8px #FF8F00' : '0 0 8px #00C853';
    }

    ctx.fillStyle = 'rgba(5, 18, 10, 0.7)';
    ctx.fillRect(0, h - 44, w, 44);

    ctx.fillStyle = '#00C853';
    ctx.font = 'bold 9px monospace';
    ctx.textBaseline = 'bottom';
    ctx.fillText('f = ' + wave.freq + ' Hz', 10, h - 26);

    const vpp = (ampScale * 2).toFixed(1);
    ctx.fillText('Vpp = ' + vpp + ' V', 10, h - 12);

    ctx.fillStyle = 'rgba(5, 18, 10, 0.85)';
    ctx.fillRect(w - 155, h - 44, 155, 44);

    ctx.fillStyle = '#00C853';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(WAVE_LABELS[wave.waveType], w - 8, h - 26);

    ctx.fillStyle = '#81C784';
    ctx.font = '9px monospace';
    ctx.fillText(WAVE_NAMES[wave.waveType], w - 8, h - 12);

    requestAnimationFrame(draw);
  }

  waveBtn.addEventListener('click', () => {
    wave.waveType = ((wave.waveType + 1) % 3) as 0 | 1 | 2;
    waveBtn.textContent = WAVE_NAMES[wave.waveType].toUpperCase();
    infoText.textContent = 'Wave: ' + WAVE_LABELS[wave.waveType];
  });

  freqSlider.addEventListener('input', function () {
    wave.freq = parseFloat(this.value);
    freqVal.textContent = String(wave.freq);
  });

  ampSlider.addEventListener('input', function () {
    wave.amp = parseFloat(this.value);
    ampVal.textContent = String(wave.amp);
  });

  runBtn.addEventListener('click', () => {
    wave.stopped = !wave.stopped;
    runBtn.textContent = wave.stopped ? '\u25A0' : '\u25CF';
    runBtn.className = 'scope-btn scope-run-btn' + (wave.stopped ? ' stopped' : ' active');
  });

  wave.running = true;
  draw();
}