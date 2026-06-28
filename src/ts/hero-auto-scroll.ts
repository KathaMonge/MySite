export function init(): void {
  const hero = document.getElementById('hero');
  if (!hero) return;

  const HIDE_END = 200;
  const REVEAL_START = 160;
  let lastScrollY = window.scrollY;

  let rafId: number | undefined;

  window.addEventListener('scroll', () => {
    if (rafId !== undefined) return;
    rafId = requestAnimationFrame(() => {
      rafId = undefined;
      const sy = window.scrollY;
      const dir = sy > lastScrollY ? 'down' : 'up';
      lastScrollY = sy;

      const threshold = dir === 'down' ? HIDE_END : REVEAL_START;
      const progress = Math.max(0, Math.min(1, sy / threshold));

      hero.style.transform = `translateY(${-progress * window.innerHeight}px)`;
      hero.style.opacity = (1 - progress).toString();
      hero.style.pointerEvents = progress < 0.05 ? 'auto' : 'none';
    });
  }, { passive: true });
}