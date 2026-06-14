export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function hexToRgb(h: string): { r: number; g: number; b: number } {
  const n = parseInt(h.slice(1), 16);
  return { r: n >> 16, g: (n >> 8) & 255, b: n & 255 };
}

export function lerpHex(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return (
    'rgb(' +
    Math.round(ca.r + (cb.r - ca.r) * t) +
    ',' +
    Math.round(ca.g + (cb.g - ca.g) * t) +
    ',' +
    Math.round(ca.b + (cb.b - ca.b) * t) +
    ')'
  );
}

export function createCanvasObserver(
  canvas: HTMLElement,
  onVisible: () => void,
  onHidden: () => void,
  threshold = 0.1,
): IntersectionObserver | null {
  if (!('IntersectionObserver' in window)) {
    onVisible();
    return null;
  }
  const section = canvas.closest('section') || canvas.parentElement!;
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        onVisible();
      } else {
        onHidden();
      }
    },
    { threshold },
  );
  observer.observe(section);
  return observer;
}

export function resizeCanvas(canvas: HTMLCanvasElement, dpr = window.devicePixelRatio || 1): void {
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
}
