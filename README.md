<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/banner-pcb.svg">
    <img alt="Site banner" src="assets/banner-pcb.svg" width="100%">
  </picture>
</p>

<h1 align="center">my-site</h1>

<p align="center">
  Portfolio site &middot; built with <a href="https://desvosoft.github.io/Vitra/">Vitra CSS</a> &middot; deployed via GitHub Pages
</p>

---

## Tech Stack

| Layer | Tech |
|-------|------|
| **Build** | Vite 6 + TypeScript 5 (strict mode) |
| **Lint/Format** | ESLint + Prettier (config in package.json) |
| **CSS Framework** | Vitra CSS v1.6 (CDN via jsdelivr, theme: neon) |
| **Audio** | Web Audio API (AnalyserNode, MediaElementSource) |
| **Canvas** | Particles, oscilloscope, snake game, equalizer |
| **Persistence** | localStorage + JSON file export/import |
| **Database** | Supabase (PostgreSQL with RLS, snake leaderboard) |
| **Animation** | anime.js v3 (tile grid stagger) |
| **Deploy** | GitHub Actions &rarr; GitHub Pages (gh-pages branch) |

## Project Structure

<pre>
/
|-- index.html
|-- package.json            Dependencies + ESLint + Prettier config
|-- vite.config.ts          base: /MySite/
|-- tsconfig.json           strict: true, noUnusedLocals
|-- .gitattributes          * text=auto
|-- .github/workflows/
|   +-- deploy.yml          CI/CD build + deploy-pages
|-- assets/
|   |-- banner-pcb.svg
|   +-- music/demo.mp3
+-- src/
    |-- anime.d.ts          Type declarations for anime.js
    |-- css/
    |   |-- main.css            @import hub for all CSS modules
    |   |-- variables.css       Custom properties (--mint, --sky, --rose, etc.)
    |   |-- base.css            Reset, body, skip-link, scrollbar
    |   |-- effects.css         Keyframes + particle canvas + equalizer + scanner beam
    |   |-- hero.css            Fixed fullscreen overlay, tile grid, leaves
    |   |-- sections.css        Section layout, footer
    |   |-- leaves.css          Decorative SVG pseudo-element leaves
    |   |-- components.css      Glass card, buttons, audio controls
    |   |-- oscilloscope.css    CRT bezel, scanlines, controls
    |   |-- snake.css           Game canvas, overlay, leaderboard, name dialog
    |   |-- trello-board.css    Drag & drop board, glow pulse
    |   +-- responsive.css      Tablet + mobile media queries
    +-- ts/
        |-- main.ts             Entry point. Inits Vitra theme + reveal, all modules
        |-- particles.ts        Fullscreen 80-dot particle canvas with mouse repulsion
        |-- oscilloscope.ts     Interactive waveform: sine/square/saw, CRT phosphor trail
        |-- snake.ts            20x20 canvas game with Supabase leaderboard
        |-- supabase.ts         Supabase singleton: submitScore, getTopScores
        |-- equalizer.ts        28-bar symmetric mirror equalizer (Web Audio API)
        |-- trello-board.ts     Drag & drop cross-list with localStorage persistence
        |-- tiles.ts            Hero tile grid with anime.js stagger reveal
        |-- hero-auto-scroll.ts rAF-throttled scroll-driven hero slide-out
        |-- back-to-top.ts      Scroll-position toggle button
        +-- utils.ts            lerp, lerpHex, createCanvasObserver, resizeCanvas
</pre>

## Module Breakdown

### Hero

The hero is a fixed-position overlay (`z-index: 100`) covering the full viewport. On page load, a grid of dark tiles covers the content. Clicking any tile triggers an anime.js stagger animation that dissolves the tiles outward from the clicked position, revealing the hero content beneath with a CSS opacity transition (0.7s ease, 0.25s delay).

Scroll behavior uses a rAF-throttled handler: scrolling past 200px down slides the hero out via `transform: translateY(-100%)`; scrolling back within 160px of the top brings it back. Bidirectional CSS transition (0.45s cubic-bezier).

Six leaf SVGs are positioned absolutely around the hero (top-right, top-left, mid, bottom, left, right) with `leaf-sway` animation at varying speeds and delays. Leaves use 3 SVG variants (green, dark, white), opacity 0.20-0.50.

### Equalizer

28 bars arranged symmetrically: 14 independent bars map to the lower half of frequency data (bins 0-127, 128 total from FFT 256), then mirrored so `targets[27 - i] = targets[i]`. Each independent bar averages ~9 frequency bins for smooth values.

Configuration:
- `fftSize`: 256 (faster time resolution than 512)
- `smoothingTimeConstant`: 0.3 (default 0.8 &mdash; reduces analyser smear)
- Bar value: `Math.pow(raw, 0.8) * 1.1` (gentle mid-range expansion)
- Attack lerp: 0.3 (bars rise quickly on transients)
- Release lerp: 0.12 (bars decay fast, avoid hanging)
- Frequency-bin-to-bar assignment reversed so bass (highest energy) maps to center bars, creating a mountain shape when mirrored

Idle animation applies a center-weighted Gaussian falloff with sinusoidal oscillation (0.02 base + 0.18 peak amplitude, 2.5 rad/s speed).

### Oscilloscope

Canvas waveform renderer with 3 wave types (sine, square, sawtooth). Key technical choices:

- Resolution synced to display via `devicePixelRatio` with resize handler
- Grid background cached to an offscreen canvas, redrawn only on window resize
- CRT phosphor trail effect: previous frames drawn to a persistent offscreen canvas with RGBA fade applied each frame
- `lineJoin: round` for clean waveform rendering
- Step minimum: `max(1, 1 / dpr)` to prevent sub-pixel artifacts
- UI controls: frequency slider (1-50 Hz), amplitude slider (10-80%), run/stop toggle
- Pauses via IntersectionObserver when scrolled out of view

### Particles

Fixed fullscreen canvas (`z-index: 0, pointer-events: none`) rendering 80 dots. Each particle has:
- Random initial position, velocity, and size (1-3 px)
- Sine-wave alpha breathing (period randomized per particle)
- Mouse repulsion: particles within 150px of cursor are pushed away with force inversely proportional to distance
- requestAnimationFrame loop, pauses via IntersectionObserver

Sections behind which particles are visible have no background color (transparent), allowing the particle canvas to show through.

### Trello Board

Drag & drop board implementing 3 lists (Backlog, In Progress, Done) with cross-list card movement.

Drag handling uses `DragEvent.relatedTarget` combined with `Node.contains()` to detect real enter/leave events &mdash; avoids the `enterCount` desync bug common with drag counter approaches. A placeholder `<div>` with class `drag-insert-before` or `.drag-insert-end` is inserted at the drop position via DOM queries (no stale `placeholderTarget` variable).

Cards support inline editing: double-click a card title to convert it to an `<input>`, press Enter to confirm or Escape to cancel. Three default cards with "!hello" populate on first visit.

Persistence layer:
- `localStorage` (`trello-board-data` key): auto-saves after every add, edit, or move
- File backup: export (`JSON.stringify` to download) and import (file input &rarr; `JSON.parse` &rarr; overwrite localStorage)
- Empty lists maintain `min-height: 48px` so placeholder renders correctly

### Snake Game

Canvas-based snake on a 20x20 grid at 25px per cell (500x500 canvas). Keyboard arrow keys + swipe support. Game loop runs via `requestAnimationFrame` with a minimum step interval (150ms). The snake head is rendered as a strawberry emoji via `fillText`.

On game over, a `<dialog>` prompts for player name, then submits the score to Supabase via `submitScore(name, score)`. The leaderboard shows the top 20 scores with an UPSERT strategy: if the player name already exists, only update if the new score is higher.

Controls: restart button, fullscreen toggle (switches between `requestFullscreen` and `exitFullscreen` on the card wrapper).

### Scanner Beam

A fixed-position div (`z-index: 0, mix-blend-mode: overlay`) with a 600px height and a multi-color linear gradient simulating a spectral scan. The gradient has 18 stops ranging from transparent through magenta, purple, blue, cyan, and back to transparent, with peak cyan opacity at 0.55 at the center.

Animation: `scanner-sweep` keyframes translate the beam from -600px (above viewport) through 100vh (below viewport) over 8 seconds with `ease-in-out` timing. `will-change: transform` hints for GPU acceleration. Disabled when `prefers-reduced-motion: reduce`.

### Leaves

Decorative SVG leaf pseudo-elements positioned across sections. ~15 instances using `::before` and `::after` on `.section-compact .mx-auto` and `.glass-card` elements, plus 6 absolute `<div>` elements in the hero. Three SVG data-URI variants provide different tints (green, dark green, white). Opacity range 0.20-0.30, each with `leaf-sway` animation at randomized speeds (6-9s) and delays (-1s to -5s).

`.glass-card` has `contain: layout` (but not `paint`) to allow leaf pseudo-elements to overflow the card boundaries.

## CSS Architecture

Styles are organized into 12 module files imported by `main.css` via `@import`. Vite bundles them into a single production stylesheet (~41 KB gzipped to ~9 KB).

<pre>
variables.css    Custom properties for colors, spacing, fonts
base.css         Reset, body, typography, focus-visible, scroll-progress
effects.css      Keyframes (blink, breath, float, glow-pulse, etc.)
                 + canvas sizing (#particles-canvas, #equalizer)
                 + scanner beam (#bg-scanner, scanner-sweep keyframes)
hero.css         Fixed overlay, tile grid, hero content, gradient, leaves
sections.css     Section padding, footer, layout utilities
leaves.css       Pseudo-element leaf decorators with SVG backgrounds
components.css   .glass-card, .btn-primary, audio controls, section headers
oscilloscope.css CRT bezel, scanlines, control knobs, power bar
snake.css        Game canvas, overlay, play button, leaderboard, name dialog
trello-board.css Drag placeholder glow-pulse, list columns, card styling
responsive.css   Breakpoints at 768px and 1024px
</pre>

No `@layer` declarations are used (conflicts with Vitra CSS layers). Reduced motion media queries are applied per-component rather than globally.

## Vitra CSS Integrations

- **Ripple**: `.vitra-ripple` class on buttons and project links provides click feedback
- **Reveal**: `.vitra-reveal` and `.vitra-reveal-up` classes trigger scroll-based fade-in (threshold 0.15, stagger 120ms)
- **Tooltip**: `data-vitra-tooltip` and `data-vitra-tooltip-position` attributes on footer social links
- **Design tokens**: Custom properties (`--mint`, `--rose`, `--sky`, `--light-grass`, `--glass-border`) are referenced by Vitra components for consistent theming

Vitra CSS and JS are loaded via CDN at the end of `<body>`:
- `https://cdn.jsdelivr.net/gh/DesvoSoft/Vitra@v1.6.0/dist/vitra.min.css`
- `https://cdn.jsdelivr.net/gh/DesvoSoft/Vitra@v1.6.0/dist/vitra.min.js`

## Build & Development

<pre>
npm install        Install dependencies
npm run dev        Start Vite dev server (hot reload)
npm run build      tsc type-check + Vite production build
npm run preview    Preview production build locally
npm run lint       ESLint src/*.ts
npm run format     Prettier format src/ + index.html
</pre>

The production build outputs to `dist/` with sourcemaps enabled for debugging.

## GitHub Pages Deployment

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that:

1. Triggers on push to `main` branch
2. Checks out the repository
3. Installs dependencies via `npm ci`
4. Runs `npm run build`
5. Uploads the `dist/` folder as a GitHub Pages artifact
6. Deploys to GitHub Pages via the `actions/deploy-pages` action

The deployed site is available at `https://kathamonge.github.io/MySite/`. The `vite.config.ts` sets `base: '/MySite/'` to match the repository name path.
