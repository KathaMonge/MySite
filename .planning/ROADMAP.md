# 🗺️ Roadmap

## ✅ Implemented

- **Hero** — Full-bleed PCB-inspired inline SVG with strawberry core, elbow traces, component labels
- **About** — Bio card with debugging-style specs table
- **Music** — Self-hosted HTML5 audio + 24-bar neon Web Audio equalizer
- **Toolbox** — shields.io badges grid
- **Projects** — 3-card grid with LED status indicators
- **Oscilloscope** — Dual-channel Smart Scope with CRT phosphor trail, LED power meter, math channel (CH1±CH2), probe 1×/10×, cursor measurements (ΔV, Δt, duty), sub-division grid, status bar, professional control layout
- **LED Dashboard** — 6 toggleable LED indicators
- **Timeline** — 3-card (Origin/Present/Future) with LED dots
- **Snake Game** — Canvas snake with strawberry food, swipe + keyboard, fullscreen
- **Scoreboard (Global)** — Supabase leaderboard with top-20 rankings, name prompt dialog, UPSERT best-score-per-player

## 🚧 In Progress

- Accessibility refinement (keyboard nav, screen reader labels)
- Performance optimization (canvas rendering, intersection observers)

## 🔮 Planned

- **PWA** — Service worker, offline fallback, manifest
- **Blog / Tutorials** — Markdown-based section with project write-ups
- **Dark/Light theme toggle** — CSS custom properties swap
- **i18n** — Spanish/English toggle for portfolio content
- **CI/CD improvements** — Lighthouse CI, Percy visual diffs

---

## Changelog

### 2026-05-31 — Scoreboard + Oscilloscope Overhaul
- Massive oscilloscope redesign: CRT phosphor trail, sub-division grid, LED power meter, math channel, probe 1×/10×, RMS measurement, status bar on canvas, CRT scanline CSS overlay
- Global Supabase leaderboard for snake game (UPSERT per player, top-20 ranking, `<dialog>` name prompt)
- Project cleanup: removed GitHub Stats section, deleted stale `docs/integration.md`, expanded `.gitignore`
- Updated AGENTS.md and created ROADMAP.md

### 2026-05-30 — 7-Phase Redesign
- Hero SVG: full PCB component layout with strawberry core, elbow traces, VU meter
- Web Audio API equalizer: 24 neon bars with beat detection, replaces analyzer bar
- LED system: reduced to 6 essential dashboard indicators
- Particle system: upgraded to 70 dots with mouse repulsion
- Oscilloscope: cursor measurements, trigger controls, wave type toggle
- GitHub stats: added onerror SVG fallback for API failures
- Cleaned dead CSS, removed scanner strips and section dividers

### 2026-05-10 — Vite 6 Migration
- Migrated from plain HTML/CSS/JS to Vite 6 + TypeScript 5
- Added ESLint + Prettier
- Set up GitHub Actions → gh-pages deployment
- CSS split into modular files with @import
