# Atleti XI Studio

A dedicated, local-first web application for designing polished Atlético de Madrid starting-XI graphics and matchday posters.

---

## Quickstart

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev
```

The application runs locally at `http://localhost:5173/`.

### Quality & Test Commands

```bash
# Run unit tests
npm test

# Run linter
npm run lint

# Production build
npm run build
```

---

## Features

- **Four Authored Visual Skins**:
  - *Editorial Cover*: Magazine editorial aesthetic with prominent typography and structured dividers.
  - *Stadium Night*: Dramatic European-night atmosphere with radial glows and deep contrast.
  - *Tactical Board*: Analytical chalkboard pitch layout with crisp markings and balanced spacing.
  - *Heritage Stripes*: Modern interpretation of the iconic *Rojiblanco* stripes.
- **Seven Tactical Formations**:
  - `4-3-3`, `4-4-2`, `4-2-3-1`, `3-5-2`, `3-4-3`, `4-1-4-1`, `5-3-2`.
- **Drag-and-Drop & Free Positioning**:
  - Drag players from squad rail directly onto pitch slots.
  - Fine-tune placed player positions directly on the canvas with smooth pointer dragging.
  - Per-player and full-lineup "Reset to formation" controls.
- **Club Catalogues & Opponent Mapping**:
  - Full 2026–27 LaLiga catalogue (20 clubs).
  - Full 36-club UEFA Champions League catalogue.
  - Supercopa de España 2027 tags.
  - All 51 club vector SVG crests verified and mapped in `public/assets/clubs/`.
- **Custom Wallpaper / Background Engine**:
  - Upload PNG, JPEG, or WebP images (up to 15MB).
  - Stored locally as raw Blobs in IndexedDB.
  - In-app wallpaper desk with thumbnail gallery, quick-apply, and delete.
  - Custom fit modes (`Cover` vs `Contain`) and opacity overlay slider.
- **Local Persistence & Project Management**:
  - Automatic debounced autosave to IndexedDB across page reloads.
  - Project backup export to `.json` and full schema-validated import (via Zod).
  - One-click starter project reset.
  - Full 50-step undo/redo history.
- **High-Resolution PNG Export**:
  - **2× PNG (2160 × 2700)** — standard social post size.
  - **3× PNG (3240 × 4050)** — ultra high-resolution master.
  - Automatic font readiness checks, editor chrome stripping, and clean file naming.

---

## Adding and Updating Assets

### 1. Player Portraits & Cutouts
Player profile cutouts reside in `public/assets/players/`:
- By default, `playerCutoutSrc` resolves to `/assets/players/<shirtNumber>.png` or the player's configured `imagePath`.
- Player manifest records are located in [src/data/players.atleti-2026-27.json](file:///src/data/players.atleti-2026-27.json).
- Recommended cutout format: Transparent WebP/PNG, 1500px+ height.

### 2. Club Crests
Club vector logos are located in `public/assets/clubs/`:
- Mapped in [src/data/clubs.json](file:///src/data/clubs.json) via `crestPath`.
- All 51 clubs in the catalogue have active, verified SVG crests.

---

## Architecture & Storage Notes

- **IndexedDB**: Project document states and custom background Blobs are stored locally in the browser's IndexedDB under `atleti-xi-studio`.
- **Zero Server Overhead**: The app is completely static and client-side; no backend server, external telemetry, or credentials are required. Clearing browser site data will reset locally stored projects.
