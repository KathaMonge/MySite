interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  alpha: number;
}

// Cohesive forest palette — no vivid oranges or rainbow mix
const COLORS = [
  '#2E7D32', // grass
  '#1B5E20', // forest
  '#43A047', // mid-green
  '#0288D1', // sky
  '#01579B', // sky-deep
];

const COUNT = 48;
const CONNECT_DIST = 115;
const CONNECT_DIST_SQ = CONNECT_DIST * CONNECT_DIST;
const REPEL_DIST = 110;
const REPEL_DIST_SQ = REPEL_DIST * REPEL_DIST;

export function init(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.getElementById('particles-canvas') as HTMLCanvasElement;
  if (!c) return;
  const ctx = c.getContext('2d')!;
  const particles: Particle[] = [];
  const mouse = { x: -9999, y: -9999 };

  function resize(): void {
    c.width = window.innerWidth;
    c.height = window.innerHeight;
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  function makeParticle(initialY?: number): Particle {
    return {
      x: Math.random() * c.width,
      y: initialY !== undefined ? initialY : Math.random() * c.height,
      vx: (Math.random() - 0.5) * 0.22,
      vy: -(0.06 + Math.random() * 0.18),
      r: 1.4 + Math.random() * 2.2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: 0.22 + Math.random() * 0.32,
    };
  }

  for (let i = 0; i < COUNT; i++) {
    particles.push(makeParticle());
  }

  function draw(): void {
    ctx.clearRect(0, 0, c.width, c.height);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;

      // Wrap: when a particle leaves the top, respawn at bottom
      if (p.y < -10) {
        const fresh = makeParticle(c.height + 10);
        p.x = fresh.x; p.y = fresh.y;
        p.vx = fresh.vx; p.vy = fresh.vy;
        p.r = fresh.r; p.alpha = fresh.alpha;
        p.color = fresh.color;
      }
      if (p.x < -10) p.x = c.width + 10;
      if (p.x > c.width + 10) p.x = -10;

      // Mouse repulsion — squared distance, sqrt only for normalization
      const mdx = p.x - mouse.x;
      const mdy = p.y - mouse.y;
      const mdSq = mdx * mdx + mdy * mdy;
      if (mdSq < REPEL_DIST_SQ && mdSq > 0.1) {
        const md = Math.sqrt(mdSq);
        const force = ((REPEL_DIST - md) / REPEL_DIST) * 0.35;
        p.x += (mdx / md) * force;
        p.y += (mdy / md) * force;
      }

      // Draw dot — no shadowBlur, use layered circles for soft glow
      ctx.globalAlpha = p.alpha * 0.25;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 2.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Connection lines — quadratic alpha falloff from squared dist (no extra sqrt)
    ctx.lineWidth = 0.55;
    for (let i = 0; i < COUNT; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dSq = dx * dx + dy * dy;
        if (dSq < CONNECT_DIST_SQ) {
          const t = 1 - dSq / CONNECT_DIST_SQ;
          ctx.globalAlpha = t * t * 0.14;
          ctx.strokeStyle = a.color;
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

  // Reset mouse when it leaves the window
  document.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  draw();
}
