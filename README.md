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

# Run static type analysis
npm run typecheck

# Production build
npm run build
```

---

## CI/CD & Release Pipelines

This repository is equipped with automated GitHub Actions workflows:

1. **Continuous Integration ([`.github/workflows/ci.yml`](.github/workflows/ci.yml))**:
   - Triggers on every push and pull request targeting `main`.
   - Runs three dedicated, parallel verification jobs:
     - **Lint**: Fast JavaScript/TypeScript AST linting using `oxlint`.
     - **Static Analysis**: TypeScript compiler validation (`npm run typecheck`).
     - **Unit Tests**: Full test suite runner using `vitest` (`npm run test`).
   - Dependent **Build Check**: Executes `npm run build` only after linting, static analysis, and tests pass. Uploads production `dist` bundle as a build artifact for 7-day review.

2. **Automated Release Pipeline ([`.github/workflows/release.yml`](.github/workflows/release.yml))**:
   - Triggers on version tag pushes (`git tag v1.0.0 && git push origin v1.0.0`) or manual `workflow_dispatch` trigger in the GitHub UI.
   - Runs full quality checks (lint, static analysis, unit tests), compiles production build, packages distribution bundles (`.zip` and `.tar.gz`), computes `SHA256SUMS.txt` integrity hashes, and creates a GitHub Release with auto-generated release notes.

---

## Deployment on Vercel

### Option 1: Automatic GitHub Import (Recommended)
1. Go to [Vercel Dashboard](https://vercel.com/new).
2. Click **Add New...** > **Project** and import `dasabhishk-buildstuff/Atleti-XI-Template-Builder-2026-27`.
3. Vercel automatically detects the Vite preset and [`vercel.json`](vercel.json):
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Deploy**. Any future commits to `main` will automatically trigger a production deployment.

### Option 2: Deploy with Vercel CLI
```bash
# Log in to Vercel
npx vercel login

# Deploy to preview
npx vercel

# Deploy directly to production
npx vercel --prod
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
