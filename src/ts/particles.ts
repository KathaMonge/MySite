interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  alpha: number;
  life: number;
  isLeaf: boolean;
  leafEmoji: string;
  rotation: number;
  rotationSpeed: number;
}

const LEAF_EMOJIS = ['🌿', '🍃', '🍂', '🍁', '🌱'];

const COLORS = [
  '#0288D1',
  '#1565C0',
  '#00C853',
  '#2E7D32',
  '#E65100',
  '#FF8F00',
  '#4FC3F7',
  '#43A047',
  '#FFAB40',
  '#00E676',
  '#40C4FF',
  '#FF6D00',
];

export function init(): void {
  const c = document.getElementById('particles-canvas') as HTMLCanvasElement;
  if (!c) return;
  const ctx = c.getContext('2d')!;
  const particles: Particle[] = [];
  const COUNT = 80;
  const LEAF_COUNT = 15;
  const CONNECT_DIST = 140;
  const mouse = { x: -1000, y: -1000 };

  function resize(): void {
    c.width = window.innerWidth;
    c.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  for (let i = 0; i < COUNT; i++) {
    const isLeaf = i < LEAF_COUNT;
    particles.push({
      x: Math.random() * c.width,
      y: Math.random() * c.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: isLeaf ? -(0.005 + Math.random() * 0.02) : -(0.04 + Math.random() * 0.18),
      r: isLeaf ? 7 + Math.random() * 4 : 2.5 + Math.random() * 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: isLeaf ? 0.2 + Math.random() * 0.15 : 0.5 + Math.random() * 0.45,
      life: Math.random(),
      isLeaf,
      leafEmoji: LEAF_EMOJIS[Math.floor(Math.random() * LEAF_EMOJIS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.015,
    });
  }

  function draw(): void {
    ctx.clearRect(0, 0, c.width, c.height);

    for (let i = 0; i < COUNT; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life += 0.001;

      if (p.isLeaf) {
        p.rotation += p.rotationSpeed;
      }

      if (p.life > 1) p.life = 0;
      if (p.x < -30) p.x = c.width + 30;
      if (p.x > c.width + 30) p.x = -30;
      if (p.y < -30) p.y = c.height + 30;
      if (p.y > c.height + 30) p.y = -30;

      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) {
        const force = (150 - dist) / 150;
        p.x += (dx / dist) * force * 0.5;
        p.y += (dy / dist) * force * 0.5;
      }

      if (p.isLeaf) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha;
        ctx.font = `${p.r * 1.6}px system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.leafEmoji, 0, 0);
        ctx.restore();
      } else {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.shadowBlur = 0;

    for (let i = 0; i < COUNT; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT_DIST) {
          const lineAlpha = (1 - dist / CONNECT_DIST) * 0.18;
          ctx.globalAlpha = lineAlpha;
          ctx.strokeStyle = a.color;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  document.addEventListener('mousemove', (e: MouseEvent) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  draw();
}