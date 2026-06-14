# My Site — Portfolio

## Stack
- **Build**: Vite 6 + TypeScript 5 (strict)
- **Lint/Format**: ESLint + Prettier (configs in `package.json`)
- **Deploy**: GitHub Actions → `gh-pages` branch
- **Framework**: Vitra CSS v1.6.0 (CDN via jsdelivr)
- **Theme**: `neon`
- **DB**: Supabase (PostgreSQL + REST, serverless) — snake leaderboard

## File Structure
```
/
├── index.html
├── README.md
├── AGENTS.md
├── package.json          # Dependencies + ESLint + Prettier configs
├── vite.config.ts
├── tsconfig.json
├── .gitattributes
├── .gitignore
├── .nojekyll
├── robots.txt
├── .planning/
│   └── ROADMAP.md
├── .github/workflows/
│   └── deploy.yml
├── assets/
│   ├── banner-pcb.svg
│   └── music/demo.mp3
└── src/
    ├── anime.d.ts
    ├── vite-env.d.ts
    ├── css/
    │   ├── main.css           # Imports all CSS modules
    │   ├── variables.css      # CSS custom properties
    │   ├── base.css           # Reset, body, skip-link
    │   ├── effects.css        # Keyframes + canvas + scanner beam
    │   ├── hero.css           # Fixed fullscreen hero with tile grid
    │   ├── sections.css       # Section layout utilities
    │   ├── leaves.css         # Decorative SVG leaves
    │   ├── components.css     # Glass card, buttons, audio controls
    │   ├── oscilloscope.css   # Scope controls, CRT scanlines
    │   ├── snake.css          # Game canvas, overlay, leaderboard
    │   ├── trello-board.css   # Drag & drop board styles
    │   └── responsive.css     # Media queries
    └── ts/
        ├── main.ts            # Entry — inits Vitra + all modules
        ├── particles.ts       # Fullscreen canvas particles
        ├── oscilloscope.ts    # Waveform scope with CRT phosphor
        ├── snake.ts           # Snake game + Supabase leaderboard
        ├── supabase.ts        # Supabase client
        ├── equalizer.ts       # 28-bar mirror equalizer
        ├── trello-board.ts    # Drag & drop Trello with persistence
        ├── tiles.ts           # Hero tile grid with anime.js
        ├── hero-auto-scroll.ts # Scroll-driven hero slide-out
        ├── back-to-top.ts     # Scroll position toggle button
        └── utils.ts           # lerp, lerpHex, createCanvasObserver
```

## Sections (in order)
1. **Hero** — Fixed overlay with tile grid (click to reveal content), scroll-driven slide-out
2. **Music** — HTML5 audio + 28-bar mirror equalizer (Web Audio API)
3. **About** — Glass card with bio + debugging specs
4. **Project Board** — Drag & drop Trello-style board, localStorage + file backup
5. **Featured Work** — 3-card project grid (CoyotesCR, Python-KChess, Sentinel)
6. **Oscilloscope** — Interactive waveform with 3 wave types, CRT scanlines
7. **Skills** — Badge row (Python, C++, TypeScript, etc.)
8. **Snake Game** — Canvas snake with leaderboard
9. **Footer** — Terminal-style, Vitra tooltips on social links

## Key Modules

### `equalizer.ts`
- 28 bars, left half computed from frequency data, mirrored for symmetry (mountain shape)
- FFT size 256, `smoothingTimeConstant: 0.3` for fast transient response
- Separate attack (0.3) / release (0.12) lerp rates

### `tiles.ts`
- Anime.js staggered tile grid overlay on hero
- Click to toggle: tiles dissolve → hero content fades in (CSS transition)

### `trello-board.ts`
- Drag & drop cross-list with `DragEvent.relatedTarget` + `contains()` for consistent placeholder
- localStorage persistence + JSON file backup (export/import)

### `particles.ts`
- 80-dot particle canvas across full viewport, mouse repulsion

## Conventions
- TypeScript strict with `noUnusedLocals`, `noUnusedParameters`
- Each module exports `init()` called from `main.ts` on `DOMContentLoaded`
- Canvas animations pause via `IntersectionObserver` when offscreen
- All interactive controls must have `aria-label` + keyboard support
- Decorative elements must have `aria-hidden="true"`
- Canvas elements must have `role="img"` + `aria-label`

## Commands
```sh
npm run dev       # Vite dev server
npm run build     # tsc + vite build (output dist/)
npm run lint      # ESLint src/
npm run format    # Prettier src/ index.html
```

## Dependencies
- Vitra CSS/JS (CDN): ripple, tooltip, reveal animations
- `animejs`: tile grid stagger animations
- `@supabase/supabase-js`: serverless Postgres for snake leaderboard

## Git
- Remote: `https://github.com/KathaMonge/MySite.git`
- Branch: `main`
- User: `KathaMonge` / `katharinamonge28@gmail.com`
