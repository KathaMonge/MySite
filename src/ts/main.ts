import { init as initParticles } from './particles';
import { init as initOscilloscope } from './oscilloscope';
import { init as initSnake } from './snake';
import { init as initEqualizer } from './equalizer';
import { init as initBackToTop } from './back-to-top';
import { init as initTiles } from './tiles';
import { init as initHeroAutoScroll } from './hero-auto-scroll';
import { init as initTrello } from './trello-board';
import { init as initNavbar } from './navbar';

import '../css/main.css';

declare const Vitra: {
  theme: { init: (config: Record<string, unknown>) => void };
  reveal: { init: (config: Record<string, unknown>) => void };
};

document.addEventListener('DOMContentLoaded', function () {
  if (typeof Vitra !== 'undefined') {
    Vitra.theme.init({ defaultTheme: 'neon', persist: true });
    Vitra.reveal.init({ selector: '.vitra-reveal', threshold: 0.15, stagger: 120 });
  }
  initParticles();
  initOscilloscope();
  initSnake();
  initEqualizer();
  initBackToTop();
  initTiles();
  initHeroAutoScroll();
  initTrello();
  initNavbar();
});

// Hero CTA — scroll to projects
document.getElementById('hero-cta')?.addEventListener('click', () => {
  document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
});

// Set footer year
const yearEl = document.getElementById('footer-year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// Scroll progress bar
const progressBar = document.getElementById('scroll-progress');
if (progressBar) {
  let scrollRaf: number | undefined;
  window.addEventListener('scroll', () => {
    if (scrollRaf !== undefined) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = undefined;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar!.style.width = max > 0 ? `${(window.scrollY / max) * 100}%` : '0%';
    });
  }, { passive: true });
}