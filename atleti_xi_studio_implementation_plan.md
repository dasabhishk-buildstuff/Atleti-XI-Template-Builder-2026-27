# Atlético XI Studio — Agent-Ready Implementation & Architecture Plan

**Document type:** Product + technical implementation specification  
**Status:** Ready for implementation  
**Data snapshot:** 13 October 2026  
**Product scope:** Atlético de Madrid men’s first-team lineup and matchday graphics; single-user, local-first web app; no accounts or collaboration

---

## 1. Product definition

Build a small, polished web app for making Atlético de Madrid starting-XI posts. The user picks a visual template skin, chooses a formation, drags players into the eleven positions, selects the opponent club, edits match text and colors, optionally uploads a background, and exports a high-resolution PNG.

The experience should borrow the useful parts of Canva—an asset rail, a central artboard, and contextual controls—without turning into a general-purpose design editor.

### Product principles

1. **Design quality before feature count.** Ship four excellent template skins rather than dozens of average ones.
2. **Formation and visual skin are separate concepts.** Formation data controls the eleven football positions; each skin decides how those positions are rendered.
3. **Drag-and-drop is the primary interaction.** Drag a player onto a formation slot; drag a club onto the opponent badge; move placed player elements on the artboard.
4. **Use owner-provided assets only.** Do not scrape, invent, generate, or silently substitute player photos or club crests. Missing images must be obvious and the app must remain usable without them.
5. **Local-first and no account flows.** The lineup and uploaded background stay in the browser unless a future requirement explicitly introduces a server.
6. **No unnecessary infrastructure.** No microservices, database server, message queue, authentication, external football-data API, or live roster sync for v1.

### Non-goals for v1

- Multi-user editing, sharing links, comments, cloud sync, and accounts.
- Automatic lineup or fixture data from third-party APIs.
- Photo editing, background removal, masking tools, or a general layers panel.
- Social publishing integrations.
- An unrestricted freeform design editor comparable to full Canva.
- Downloading any player/club images on behalf of the user.

---

## 2. Recommended technology stack

### Primary recommendation: frontend-only SPA

| Concern | Choice | Reason |
|---|---|---|
| App | React + TypeScript + Vite | Small, fast, familiar, static-buildable, easy to deploy |
| Styling | Tailwind CSS + shadcn/ui | Maintainable design tokens and accessible UI primitives without a custom component library |
| Artboard / interaction | `react-konva` + `konva` | Canvas scene graph, draggable nodes, shape/text rendering, and high-resolution export support |
| App state | Zustand | Small store for document state, selection, template, formation, undo/redo actions |
| Local persistence | IndexedDB with a small wrapper such as `idb` | Stores project JSON and uploaded background blobs across reloads without a server |
| Icons | `lucide-react` | Consistent, lightweight interface icons |
| Validation | Zod for imported project/manifest data | Validate project files and asset manifests at boundaries |
| Unit/component tests | Vitest + React Testing Library | Fast tests for formation geometry, state transitions, and UI behaviour |
| Browser tests | Playwright | Verify drag/drop, upload, reload persistence, and PNG export end to end |
| Code quality | ESLint + Prettier | Keep the project consistent for agent and human edits |
| Fonts | Bundle licensed local font files | Avoid external font requests and make exported typography predictable |
| Hosting | Cloudflare Pages, Netlify, Vercel static hosting, or equivalent | Build and serve the static app; no long-running backend required |

**Versioning guidance:** use the supported stable versions available when scaffolding; pin them in the lockfile. Do not add dependencies merely because they are fashionable. Use `npm create vite@latest` and follow the current official Tailwind/shadcn setup instructions for the generated project.

### Is FastAPI required?

**No—not for v1.** The core features happen in the browser. The player and club catalog can be a checked-in JSON manifest, images can be served as static assets, and projects/background uploads can be persisted in IndexedDB. A FastAPI backend would add deployment and operational work without enabling a required feature.

If a backend becomes necessary later, add **one FastAPI application in the same repository** for a central asset-manifest endpoint, health checks, or controlled asset administration. Keep it a modular monolith; do not split it into services. Start without a database unless there is a concrete persistence requirement. The current plan must not block that future addition, but the agent must not build the backend in v1.

### Why Konva rather than an HTML-only layout?

The artboard contains many positioned objects—player cut-outs, captions, crests, pitch graphics, shapes, and editable labels. Konva gives these objects a common coordinate system and native drag behaviour. It also supports pixel-ratio export, which is useful for 2×/3× PNG output. Build the surrounding app controls in ordinary React/shadcn components; use Konva only for the artwork surface.

---

## 3. Information architecture and UI layout

Design desktop-first at a comfortable 1440px-wide viewport, then make the workspace usable on tablet widths. Mobile can be a simplified view with the library and inspector shown as drawers; do not attempt to show three cramped columns at once.

### Main workspace

**A. Top toolbar — about 64px high**

- App wordmark: `Atleti XI Studio` (working product name; not a claim of official affiliation).
- Current project name, editable inline; default `Atlético — Starting XI`.
- Template skin chooser.
- Formation dropdown.
- Opponent club selector, showing the club crest when available.
- Competition label selector: `LaLiga`, `Champions League`, `Copa del Rey`, `Supercopa de España`, or custom text.
- Match date / kick-off optional fields.
- Undo and redo.
- Export PNG primary action.

Do not cram every control into the toolbar at narrower widths. Move secondary controls into the inspector/drawer when needed.

**B. Left library rail — around 270px**

Tabs: **Players**, **Clubs**, and **My backgrounds**.

Players tab:
- Search by name.
- Quick position filter: All, GK, DEF, MID, FWD.
- Compact grid/list cards with portrait, display name, and optional squad number.
- Missing portrait indicator if an image is not present.
- Draggable asset card; dragging starts a player placement operation.

Clubs tab:
- Search by club name.
- Competition filter: LaLiga 2026–27, Champions League 2026–27, Supercopa 2027, Custom.
- Small crest, club name, and missing-image state.
- Dragging a club onto the opponent area changes the opponent. Dropping a club elsewhere should not silently create random decoration.

My backgrounds tab:
- Upload background button.
- Show locally stored uploaded backgrounds as small thumbnails.
- Click to apply as canvas background; optional drag-and-drop to apply.

**C. Central artboard area — flexible width**

- Neutral/dark workspace chrome so the exported artwork is easy to evaluate.
- One portrait artboard, initially **1080 × 1350 logical pixels (4:5)**, the default social-post size.
- Artboard scaled to fit available space without changing its aspect ratio.
- Thin outside border/shadow that is not part of the exported image.
- Optional snap-to-slot guides while dragging. Guides must never appear in export.
- A compact zoom control (`Fit`, `75%`, `100%`) is optional. Do not build a pan/zoom system unless testing shows it is needed.

**D. Contextual inspector — around 260px**

The inspector depends on selection:

- **No selection / document:** title, subtitle, competition, date, accent colors, background upload/fit/opacity, reset formation.
- **Player slot selected:** selected player, display-name override, optional shirt number, portrait mode (`Crop` or `Contain`), scale, and reset-to-formation-position.
- **Opponent badge selected:** club, badge size, optional club-name text.
- **Text selected:** content, font family from the bundled set, size, weight, alignment, color.

Do not add a general-purpose vector-properties panel. Expose only controls relevant to this editor.

### Primary workflow

1. Open app; the default Atleti squad catalog appears in the left rail.
2. Pick a template skin.
3. Pick a formation such as 4-3-3.
4. The template immediately shows eleven empty player slots in the selected formation.
5. Drag players onto the desired slots. Dropping onto an occupied slot replaces that player after a clear visual target cue; dropping elsewhere fills the nearest empty slot only if a slot is within the target threshold.
6. Choose an opponent by dropdown or drag a club to the opponent badge.
7. Edit title/date/competition and choose a color scheme.
8. Upload an optional background and set fit/overlay.
9. Export 2× or 3× PNG.

The default experience must be useful before all images have been added: player names and club names should remain visible with simple neutral placeholders, never misleading fake artwork.

---

## 4. Template system and visual direction

Start with **four** authored skins. Each should look intentionally designed—not like the same layout with a different background color. Use vector shapes, gradients, typographic hierarchy, fine rules, subtle texture built from shapes, and thoughtful negative space. Any real photos or badges are user-provided assets.

### Skin 1 — Editorial Cover

- Feel: premium football magazine cover.
- Palette: warm white / ink navy with Atlético-inspired red accents.
- Large headline and strong match-up line at the top.
- Formation/pitch zone in the lower two-thirds.
- Strong vertical typography, small metadata labels, restrained dividers.
- Best for a clean, information-first lineup post.

### Skin 2 — Stadium Night

- Feel: dramatic European-night poster.
- Palette: near-black/navy, crimson accent, off-white text.
- Vector floodlight glows and restrained radial gradients; avoid noisy effects that reduce legibility.
- Opponent crest and match title are prominent, with lineup in a defined lower region.
- Optional uploaded background sits under a configurable dark overlay.

### Skin 3 — Tactical Board

- Feel: tactical analysis graphic.
- A clear pitch diagram with markings, position nodes, compact player labels, formation text, and space for both crests.
- Lower decoration density than the other templates so names remain readable.
- Background colors and pitch tint must be themeable.

### Skin 4 — Heritage Stripes

- Feel: bold, modern interpretation of red-and-white stripes with a navy information panel.
- Stripes should be built from vector shapes, not a raster image.
- Formation area should retain sufficient contrast even when the striped motif is present.
- Allow alternate color tokens so the user is not locked to one exact palette.

### Theme tokens

Each skin must consume shared theme tokens rather than hardcoded one-off colors:

```ts
export interface DesignTokens {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  mutedText: string;
  pitch: string;
  pitchLine: string;
}
```

Include 4–6 curated palettes, including an Atlético-inspired red/white/navy preset and a monochrome preset. Provide one or two custom color inputs for the principal accent and background/surface; derive only simple dependent variants. Do not implement a complicated palette-generation engine.

### Keep template and formation separate

A template skin owns:
- Its backdrop and decorative layers.
- Header, title, match-up, crest, footer and metadata placement.
- The rectangle/region in which the eleven formation positions are rendered.
- Player-card presentation (e.g., circular portrait versus cut-out frame).

A formation owns:
- Eleven named/numbered slots and their roles.
- Normalized x/y coordinates from 0 to 1.
- A label (`4-3-3`, `4-4-2`, etc.).

The renderer maps normalized formation coordinates into the active skin’s `formationBounds`. Switching skins must preserve the selected players and formation. Switching formations should reposition slots deterministically; if the user has manually moved individual players, present a small reset/replace confirmation instead of silently discarding their positions.

For v1, keep a single authored `TemplateStage` renderer with a small switch on `skinId`, plus reusable subcomponents. **Do not** build a declarative arbitrary-layer template language or a drag-to-build template editor.

### Formations for v1

Ship these presets:

- 4-3-3
- 4-4-2
- 4-2-3-1
- 3-5-2
- 3-4-3
- 4-1-4-1
- 5-3-2

Represent coordinates as normalized data. Use the same coordinate convention consistently: `x=0` is left, `x=1` right; `y=0` is the top of the skin’s formation area, `y=1` is the bottom. The design can invert the pitch direction visually if a template requires it, but it must not mutate the formation data.

---

## 5. Interaction details and rules

### Drag a player from the library

- The library item has `draggable=true` and carries only the stable asset ID in its drag payload.
- The canvas shows valid slot targets when a drag begins.
- If the pointer is over a slot, dropping assigns that player to that slot.
- If the pointer is not over a slot but is close to one, assign only when the distance is within a defined threshold; otherwise cancel the drop. Do not place players at arbitrary coordinates that break the formation by default.
- If the target slot already has a player, replace it.
- If the user drops a player on the empty pitch area, optionally place it in the nearest empty slot only when the drop is within a visible target threshold. Otherwise show a non-blocking hint: “Drop onto a player position.”
- A player already used in another slot must not accidentally appear twice. Prefer moving that player from the old slot to the new slot, or show a clear replace/move behaviour.

### Drag a placed player on the artboard

- Placed player groups are draggable within the artboard bounds.
- Store a manual position override separately from formation coordinates, e.g. `positionOverride?: { x: number; y: number }`.
- Offer **Reset to formation** for a selected player and **Reset all positions** for the lineup.
- Text labels should stay attached to their player group and export as one unit.

### Drag a club

- The opponent crest/name area is an explicit drop target.
- Dropping a club there sets `opponentClubId`; template text/badge render from that state.
- Also offer a standard searchable dropdown because drag-and-drop must not be the only way to use the app.

### Undo/redo

- Use a small command/history stack in the document store with a cap around 50 states/actions.
- Cover practical actions: assigning/replacing a player, changing the opponent, changing formation, title/text edits, theme changes, background changes, and moving a player.
- Avoid a full editor-grade history framework.

### Keyboard and usability

- Provide visible focus states and keyboard-accessible dropdowns/buttons.
- Every drag action must have an equivalent click/selection alternative.
- Do not rely on color alone to indicate the selected slot; also use outline/shape changes.
- Display helpful empty states when asset files are missing.

---

## 6. Data model and state boundaries

Keep the persisted project state serializable. Do not persist Konva node instances, DOM references, `Image` objects, or object URLs.

### Asset data

```ts
export type PlayerPosition = "GK" | "DEF" | "MID" | "FWD";
export type PlayerImageMode = "crop" | "contain";

export interface PlayerAsset {
  id: string;                 // stable slug, e.g. "julian-alvarez"
  displayName: string;        // name shown in the library
  shortName: string;          // default lineup label
  position: PlayerPosition;
  shirtNumber?: number;
  imagePath?: string;         // optional same-origin asset path
  imageMode: PlayerImageMode;
  season: "2026-27";
  active: boolean;
}

export interface ClubAsset {
  id: string;                 // stable slug
  displayName: string;
  shortName: string;
  crestPath?: string;
  competitions: string[];     // IDs, not free-form labels where avoidable
  season: "2026-27";
  active: boolean;
}

export interface FormationSlot {
  id: string;                 // stable within formation, e.g. "gk", "lcb"
  role: string;               // e.g. GK, LB, LCB, CM, RW
  x: number;                  // normalized 0..1
  y: number;                  // normalized 0..1
  order: number;
}

export interface FormationDefinition {
  id: string;                 // "4-3-3"
  label: string;
  slots: FormationSlot[];     // exactly 11
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TemplateDefinition {
  id: string;
  label: string;
  formationBounds: Rect;      // destination rectangle for normalized formation slots
  playerPresentation: "portrait-card" | "cutout";
}
```

### Project / lineup state

```ts
export interface LineupSlotState {
  formationSlotId: string;
  playerId?: string;
  displayNameOverride?: string;
  shirtNumberOverride?: string;
  positionOverride?: { x: number; y: number }; // normalized within the active skin formationBounds
}

export interface MatchMetadata {
  competition: string;
  title: string;
  subtitle?: string;
  dateText?: string;
  kickoffText?: string;
  opponentClubId?: string;
}

export interface CanvasProject {
  schemaVersion: 1;
  id: string;
  name: string;
  updatedAt: string;
  skinId: string;
  formationId: string;
  themeId: string;
  customTokens?: Partial<DesignTokens>;
  match: MatchMetadata;
  lineupSlots: LineupSlotState[];
  backgroundAssetId?: string; // references local IndexedDB background or bundled asset
  backgroundFit: "cover" | "contain";
  backgroundOpacity: number;  // 0..1
}
```

Project state should have clear ownership. Asset catalog data lives in checked-in manifest files; the current design/project and selection live in Zustand. Local uploaded file blobs live in IndexedDB. Temporary browser object URLs are created when reading blobs and revoked when replaced or the app unmounts.

### Suggested Zustand slices

Keep a single small store, split into slices only if it improves readability:

- `document`: project metadata, current skin/formation/theme, lineup slots, background settings.
- `selection`: selected player slot or text element; not part of the exported project state unless selection is needed for restore (it is not in v1).
- `history`: undo/redo snapshots or commands.
- `ui`: active sidebar tab, search text, open panels, export state.

Never couple visual rendering components directly to IndexedDB calls. Put persistence behind `projectRepository` and background operations behind `backgroundRepository`.

---

## 7. Asset catalogue and local asset conventions

### Required asset types

1. Atlético first-team player portraits/cut-outs.
2. Club crests for clubs in the in-scope competitions.
3. Optional user-uploaded template backgrounds.
4. Optional bundled fonts with compatible licences.

The decorative elements in all four starter skins should be drawn as vector shapes. Do not create or procure a decorative-image dependency for the starter templates.

### Suggested repository layout

```text
atleti-xi-studio/
├── public/
│   └── assets/
│       ├── players/
│       │   ├── musso.webp
│       │   ├── oblak.webp
│       │   └── ...
│       ├── clubs/
│       │   ├── atletico-de-madrid.png
│       │   ├── real-madrid.png
│       │   └── ...
│       └── fonts/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── routes.tsx
│   ├── components/
│   │   ├── shell/
│   │   ├── ui/                 # shadcn/ui-generated components only
│   │   └── common/
│   ├── features/
│   │   ├── library/            # player/club/background rail
│   │   ├── editor/             # artboard, drop targets, selection
│   │   ├── templates/          # four authored skin renderers
│   │   ├── formations/          # preset definitions and geometry
│   │   ├── theme/              # presets and token controls
│   │   ├── export/             # PNG export workflow
│   │   └── projects/            # local project persistence
│   ├── data/
│   │   ├── players.atleti-2026-27.json
│   │   ├── clubs.laliga-2026-27.json
│   │   ├── clubs.ucl-2026-27.json
│   │   └── formations.json
│   ├── lib/
│   │   ├── asset-paths.ts
│   │   ├── image-loader.ts
│   │   ├── idb.ts
│   │   ├── validation.ts
│   │   └── utils.ts
│   ├── store/
│   │   ├── editor-store.ts
│   │   └── history.ts
│   ├── types/
│   │   └── domain.ts
│   ├── styles/
│   │   └── globals.css
│   └── main.tsx
├── tests/
│   ├── formations.test.ts
│   ├── project-store.test.ts
│   └── export.spec.ts
├── README.md
├── package.json
└── vite.config.ts
```

This is a suggested boundary map, not a reason to create empty files for every folder up front. Add modules when implementation needs them.

### Filename and format guidance

Use lowercase kebab-case stable filenames. Examples:

- `public/assets/players/julian-alvarez.webp`
- `public/assets/players/oblak.webp`
- `public/assets/clubs/manchester-united.png`
- `public/assets/clubs/bodo-glimt.png`

Recommended owner-provided assets:

- **Club crests:** preferably transparent PNG/WebP at 1024 × 1024 or better; square artboard with reasonable padding. A clean, properly licensed SVG is also suitable for bundled assets if the pipeline is tested.
- **Player portraits:** either transparent cut-outs at roughly 1500px or taller, or portrait photos at least 900 × 1200. Use one image mode per asset (`contain` for cut-outs, `crop` for photographic portraits) so framing remains intentional.
- **Custom backgrounds:** user uploads PNG, JPEG, or WebP. Limit file size and dimensions to keep the browser responsive.

Do not require every file to exist before the app runs. The manifest can list a missing `imagePath`; the library and canvas should show a clear neutral placeholder and a missing-asset indicator.

### Local background upload rules

- Accept PNG, JPEG, and WebP only for v1; reject SVG uploads and other active/unsupported formats.
- Validate MIME type and maximum size (start with 15 MB), show image dimensions, and give a clear error for unsupported files.
- Store the `Blob` in IndexedDB, not just an object URL or `File` reference.
- On reload, read the blob and create a new object URL.
- Support `cover` and `contain`, plus an opacity/overlay slider. Do not implement an advanced crop tool in v1.
- Uploaded background remains local to that browser/profile and is not sent to a server.

---

## 8. Asset procurement inventory — 2026–27 season

This inventory is a **cataloguing checklist**, not an image pack. The implementation agent must only create manifest records and expected file paths. The project owner will supply the actual high-resolution assets. Do not substitute unverified imagery.

### 8.1 Atlético de Madrid first-team player names

The official Atlético first-team squad page for 2026–27 listed the following short display names at the time of this document (13 October 2026). Use these official short labels in the initial manifest and verify any expanded full name before adding it. Squad membership, numbers, and availability can change; update the manifest manually when the owner confirms the squad change.

- J. Musso
- Oblak
- Esquivel
- Hancko
- Marc Pubill
- Romero
- Grimaldo
- Le Normand
- D. Martínez
- Obed Vargas
- Mendoza
- Johnny
- Koke
- Kang In
- Barrios
- Álex B.
- Marcos Llorente
- Arnau Ortiz
- Giuliano
- Hjulmand
- Sorloth
- Lookman
- J. David
- J. Alvarez

For each player create a manifest record with `id`, `displayName`, `shortName`, `position`, optional squad number if verified, `imagePath`, `imageMode`, `season`, and `active`. Do not guess positions or shirt numbers if the source manifest does not provide them; leave them blank until verified or maintain the position manually in the catalog. The left-rail position filter requires a position label, but it may be set/maintained manually.

Official source: [Atlético de Madrid — first-team squad, 2026–27](https://en.atleticodemadrid.com/jugadores-primer-equipo/).

### 8.2 All 20 LALIGA EA SPORTS clubs, 2026–27

Create an asset manifest entry for every club below. `Atlético de Madrid` is the home team and should have a crest like all other records. Use a canonical stable slug, not the list index.

1. Athletic Club
2. Atlético de Madrid
3. CA Osasuna
4. Celta
5. Deportivo Alavés
6. Elche CF
7. FC Barcelona
8. Getafe CF
9. Levante UD
10. Málaga CF
11. R. Racing Club (Racing Santander)
12. Rayo Vallecano
13. RC Deportivo (Deportivo de La Coruña)
14. RCD Espanyol de Barcelona
15. Real Betis
16. Real Madrid
17. Real Sociedad
18. Sevilla FC
19. Valencia CF
20. Villarreal CF

Official source: [LALIGA EA SPORTS clubs, 2026–27](https://www.laliga.com/laliga-easports/clubes).

### 8.3 Atlético’s confirmed UEFA Champions League league-phase opponents, 2026–27

These eight opponents are confirmed for the current league phase. Mark them with `competition: "ucl-2026-27"` and `atletiOpponent: true` in the manifest. Use a single canonical club record when a club also appears in the LaLiga list.

**Home fixtures at the time of the draw:**

1. FC Bayern München
2. Manchester United FC
3. Fenerbahçe SK
4. Viking FK

**Away fixtures at the time of the draw:**

5. Liverpool FC
6. PSV Eindhoven
7. FK Bodø/Glimt
8. VfB Stuttgart

Official sources: [Atlético’s 2026–27 league-phase opponents](https://en.atleticodemadrid.com/noticias/our-26-27-champions-league-league-phase-opponents) and [UEFA: all 36 teams and the league-phase draw](https://www.uefa.com/uefachampionsleague/news/02a8-216cd740d41f-fd3b45ac4a0f-1000--champions-league-league-phase-draw-all-36-teams-learn-their/).

### 8.4 Full 36-club Champions League 2026–27 league-phase catalogue

Because the app includes a Clubs library and future knockout opponents can come from elsewhere in the same competition, add all 36 league-phase clubs. Several overlap with LaLiga and should not be duplicated as separate entities; one club can carry multiple competition tags.

1. AEK Athens
2. Arsenal FC
3. Aston Villa FC
4. Atlético de Madrid
5. FC Barcelona
6. FC Bayern München
7. Borussia Dortmund
8. FK Bodø/Glimt
9. Club Brugge KV
10. Como 1907
11. Fenerbahçe SK
12. Feyenoord
13. Galatasaray SK
14. FC Internazionale Milano (Inter)
15. LASK
16. RB Leipzig
17. RC Lens
18. Lille OSC
19. Liverpool FC
20. Manchester City FC
21. Manchester United FC
22. SSC Napoli
23. Paris Saint-Germain
24. FC Porto
25. PSV Eindhoven
26. Real Betis
27. Real Madrid CF
28. AS Roma
29. ŠK Slovan Bratislava
30. SK Slavia Praha
31. Sabah FC
32. FC Shakhtar Donetsk
33. Sporting CP
34. VfB Stuttgart
35. Viking FK
36. Villarreal CF

Treat display names and punctuation as editable metadata. The application must use stable internal IDs such as `manchester-united`, `bodo-glimt`, and `slovan-bratislava`, so names can be revised without breaking stored projects.

### 8.5 Supercopa de España 2027 participants

The RFEF announced these four participants for the 2027 Supercopa de España:

- Atlético de Madrid
- FC Barcelona
- Real Madrid CF
- Real Sociedad

All four already exist in the LaLiga catalogue. Add the `supercopa-2027` competition tag; do not create duplicates.

Source: [RFEF — Supercopa de España 2027 announcement and competition information](https://rfef.es/es/noticias/competiciones-masculinas/supercopa).

### 8.6 Copa del Rey and later knockout rounds

Do **not** hard-code a purported full Copa del Rey opponent pool into the initial asset checklist. Entry rounds, draws, and the clubs Atlético can actually meet depend on the draw and results. Include a `Copa del Rey` competition filter and the ability to add a custom club record; add clubs to the default catalogue when the official draw or a confirmed matchup makes them relevant. Likewise, future UCL knockout opponents should be represented by the full 36-club UCL catalogue, not only the initial eight opponents.

### 8.7 Deduplication rule

Use one `ClubAsset` record per real club. Store competition memberships as a list. A search for “Real Madrid” should return one record with all applicable labels, not separate LaLiga/UCL/Supercopa records. The competition filter filters by tags and does not change the club identity.

### 8.8 Rights and provenance

The project owner must obtain image assets from sources that permit the intended use. Club crests, competition marks, player portraits, and official photography may be protected by copyright, trademark, publicity, or licensing rules. The app should not redistribute an unofficial asset bundle, scrape another service, or imply that the app is officially endorsed. Add a short owner-facing README checklist recording asset source/licence for each batch.

---

## 9. Rendering and high-resolution PNG export

### Canvas contract

- Logical artboard: **1080 × 1350**.
- Default export: **2× = 2160 × 2700 PNG**.
- Optional high-resolution export: **3× = 3240 × 4050 PNG**.
- Export format: PNG only for v1.
- Export includes the selected template, backgrounds, player images/names, crests, competition label, and match metadata.
- Export excludes app chrome, selection outlines, drop hints, guides, hover states, and resize handles.

### Implementation outline

1. The user presses Export.
2. Validate that the artboard is ready and resolve all image loads.
3. Await local font readiness before rendering/exporting.
4. Temporarily hide editor-only layers (selection, slot hit targets, guides, grid, transformer handles).
5. Use the Konva stage export API with the chosen `pixelRatio` (`2` or `3`).
6. Convert the generated data URL to a PNG `Blob` where practical, then initiate a download using a temporary object URL.
7. Use a filename such as `atleti-xi-vs-real-madrid-2026-10-13-2x.png`; sanitize user-provided names.
8. Restore editor-only layers and selection even if export fails. Show a useful error rather than silently doing nothing.

### Export quality requirements

- Text is crisp and readable at 2×/3× export.
- Avoid cross-origin image URLs; bundled image assets must be same-origin, and uploaded backgrounds must be local blobs. This prevents canvas tainting.
- Check how the chosen Konva version scales text, shadows, and filters at high pixel ratios. Avoid heavy blur filters that can cause memory spikes.
- Exports should match the visible artboard composition, not the surrounding editor viewport or current screen zoom.
- The export process must not mutate the saved project.
- Display the final image dimensions in the export control/menu so the user knows what they are getting.

---

## 10. Persistence and project lifecycle

No user account is required. Keep project data local to the current browser profile.

### v1 persistence

- Save the current project automatically to IndexedDB after meaningful changes, with a debounce to avoid writing on every pointer movement.
- Store uploaded background files as `Blob` values in a separate IndexedDB object store.
- On first load, create a sensible starter project with skin 1 and a default formation.
- Add **New project**, **Duplicate project**, and **Reset current project** only if they can be built cleanly; at minimum, new/reset and autosave are required.
- Use a versioned project schema. If the app cannot load a newer/invalid schema, show a recoverable error and offer to start a new project; do not crash the entire app.
- Add a simple `Export project JSON` / `Import project JSON` path only if it remains small and can validate asset IDs. This is useful as a backup, but PNG export is the mandatory feature.

### Local data caveats

- Clearing browser site data can remove projects and custom backgrounds.
- Local uploads are not available across devices or browsers.
- State this plainly in the README/help text. Do not imply that the app offers cloud storage.

---

## 11. Architecture boundaries

Keep this a **single deployable frontend application** with feature modules. A modular monolith does not require a backend when the product does not need server-side operations.

### Module responsibilities

- `features/library`: asset search, filters, draggable cards, missing-image indicators.
- `features/editor`: stage sizing, drops, slot hit targets, selected-object operations, keyboard alternative actions.
- `features/formations`: formation definitions and coordinate mapping only; no UI styling.
- `features/templates`: skin-specific visual composition and shared player/club/text subcomponents.
- `features/theme`: palettes and color-token controls.
- `features/export`: export readiness, temporary hiding of editor layers, file naming, PNG download.
- `features/projects`: project create/load/save/import/export and migration of `schemaVersion`.
- `lib/image-loader`: image load/error state and lifecycle; never keep `HTMLImageElement` in persisted state.
- `store`: shared serializable state and a small history mechanism.

### Dependency direction

UI components call feature actions. Feature actions update the store or use repositories. Templates read state and render it; they do not write directly to IndexedDB. Repositories do not import React components. Formation math is a pure utility module and must be unit-testable without the browser.

### Avoid

- Microservices or a distributed architecture.
- A database server for one user’s local project.
- A generic plugin architecture for templates.
- A hand-built component library instead of shadcn/ui primitives.
- Global CSS styles for every component or inline style objects where utility classes/design tokens are clearer.
- External requests for player/club data at runtime.
- Hard-coded player positions inside individual template files.

---

## 12. Implementation sequence

Implement in the following order. Keep each phase runnable and demonstrable.

### Phase 1 — Scaffold and design system

- Create the Vite React + TypeScript project.
- Configure Tailwind and shadcn/ui using current documentation.
- Add global tokens, typography, shell layout, tabs, dropdowns, color inputs, tooltips, toast/error component, and empty/loading states.
- Implement the left rail, centre workspace, and right inspector with mock data only.
- Deliverable: attractive non-functional shell that matches the intended three-panel editing workflow.

### Phase 2 — Typed data and catalogues

- Add `PlayerAsset`, `ClubAsset`, `FormationDefinition`, `TemplateDefinition`, and `CanvasProject` types.
- Add the player manifest, all 20 LaLiga clubs, all 36 UCL clubs, competition tags, and Supercopa tags.
- Add `imagePath` entries using expected filenames, but do not create fake photos or crest files.
- Build robust missing-asset fallbacks and asset path checks.
- Deliverable: left-rail search/filter works; all asset names can be browsed even while image files are not installed.

### Phase 3 — Formation engine

- Add 7 formation definitions with exactly 11 unique slots each.
- Add a pure function mapping a normalized slot into a template formation rectangle.
- Add tests for slot count, unique IDs, coordinate bounds, and transformation.
- Render the eleven empty slots on the stage after a formation is selected.
- Deliverable: changing formations updates slots without losing unrelated match metadata or template choice.

### Phase 4 — First beautiful template skin

- Implement Editorial Cover end to end before adding more skins.
- Render template decoration, title, match-up, opponent crest placeholder, eleven player groups and labels using the shared design tokens.
- Make 4:5 stage layout responsive to the workspace while preserving logical coordinates.
- Deliverable: the app already creates a usable lineup composition with placeholder assets.

### Phase 5 — Drag/drop and editing

- Implement native draggable library cards with stable ID payloads.
- Implement slot hit targets and drag cues.
- Implement replacement/move semantics when a player is already used.
- Implement draggable placed player groups, selection, inspector fields, text overrides, opponent selection, and theme controls.
- Add accessible click-to-assign alternatives.
- Deliverable: the complete core lineup workflow works from blank template to filled XI.

### Phase 6 — Remaining template skins

- Implement Stadium Night, Tactical Board and Heritage Stripes as distinct compositions that consume the same formation/player/match/theme state.
- Verify that the same lineup survives switching between every skin.
- Deliverable: four genuinely different template choices.

### Phase 7 — Background upload and local projects

- Add background upload/validation, fit/opacity controls and IndexedDB persistence.
- Add project autosave and restore-on-reload.
- Add local background gallery.
- Deliverable: a user can upload a background, refresh the page, and retain the project/background.

### Phase 8 — Export and QA

- Implement 2× and 3× PNG export.
- Test local image load failures, font readiness, missing assets, export failure recovery, and output dimensions.
- Add Playwright end-to-end test for the main workflow.
- Complete keyboard/accessibility pass and responsive layout pass.
- Deliverable: deployment-ready build with a README and documented asset placement instructions.

---

## 13. Testing and acceptance criteria

### Data/formation unit tests

- All seven formations have exactly eleven slots.
- Slot IDs are unique per formation.
- Coordinates are finite and normalized to `[0, 1]`.
- Mapping normalized coordinates into a template bounds rectangle returns expected logical canvas coordinates.
- Club records are deduplicated across competition tags.
- Missing optional image paths do not break catalogue rendering.
- Project validation rejects invalid schema versions and malformed background settings.

### Interaction tests

- Dragging a player to a slot assigns the player and visible label.
- Dropping onto an occupied slot follows the stated replacement rule.
- A player cannot be duplicated in two slots without an explicit move/replace action.
- Changing formation changes slot coordinates and retains selected players when a meaningful role mapping exists; otherwise show a clear reset/reassign state instead of silently misplacing data.
- Switching skins preserves the lineup, opponent, match metadata, theme, and background.
- Dragging a club to the opponent badge updates crest and name.
- Uploading an unsupported format or oversized background shows a useful error.
- Refresh restores the saved project and uploaded background.

### Export tests

- Export at 2× creates a 2160 × 2700 PNG.
- Export at 3× creates a 3240 × 4050 PNG.
- The image contains the correct template, players, names, opponent, and uploaded background.
- Selection outlines and editor controls are absent from the PNG.
- Export works with missing player/club image assets by rendering non-misleading placeholders.
- Repeated exports do not leave the stage hidden or modify the project.

### Product acceptance checklist

The MVP is complete when:

- [ ] The left rail contains the 24 listed Atlético first-team player labels and searchable club catalogues.
- [ ] The club catalogue covers all 20 LaLiga 2026–27 clubs, all 36 UCL league-phase clubs, and the Supercopa participants via tags without duplicate records.
- [ ] Four visibly distinct skin layouts are selectable.
- [ ] The seven formations generate eleven slots each.
- [ ] Players can be dragged into slots and their names appear correctly.
- [ ] Opponent club can be set by drag-and-drop and by dropdown.
- [ ] Template color scheme can be changed.
- [ ] Custom background can be uploaded, fitted, and opacity-adjusted.
- [ ] Current work autosaves locally and survives a page reload.
- [ ] Export produces valid 2× and 3× PNGs with the expected dimensions.
- [ ] The production build can be deployed as a static site.
- [ ] No unrequested auth, cloud API, database, or generated photo assets are introduced.

---

## 14. Deployment and project hygiene

### Static deployment

- Build with `npm run build`.
- Deploy the Vite `dist/` directory to the selected static host.
- Configure SPA fallback to `index.html` if routes are introduced; v1 can remain a single route.
- No environment secrets should exist in the frontend.
- Add `npm run lint`, `npm run test`, and `npm run build` checks to CI.

### README must cover

- Local development and build commands.
- How to add a player to `players.atleti-2026-27.json`.
- How to add a club crest to the club manifest and expected asset path.
- Supported player image modes and recommended dimensions.
- How to add a new skin or formation without duplicating logic.
- Where local projects and backgrounds are stored and the browser-clearing caveat.
- Asset-source/licence tracking.

### Optional future FastAPI extension — not part of v1

Only add this if centrally managed catalogues or server-side capabilities are required. Keep one Python application:

```text
backend/
  app/
    main.py            # FastAPI app, mounts API and built static frontend
    api/
      health.py        # GET /api/health
      catalog.py       # optional GET /api/catalog only if a central catalogue is needed
    schemas.py         # Pydantic request/response contracts
    services/
      catalog_service.py
```

Do not add authentication, PostgreSQL, Redis, Celery, or object storage until a real requirement needs them. If all catalogue assets remain checked into the app and all project data remains local, leave this directory out entirely.

---

## 15. Agent implementation prompt

The following can be handed to a coding agent as the execution brief.

> You are implementing **Atlético XI Studio**, a single-user web app for designing Atlético de Madrid starting-XI social graphics. Treat this document as the product contract.
>
> **Stack:** React + TypeScript + Vite, Tailwind CSS, shadcn/ui, react-konva/Konva for the artwork stage, Zustand for serializable editor state, IndexedDB for local project/background persistence, Vitest for unit tests, and Playwright for the end-to-end smoke test. Deploy as a static site. Do not add FastAPI in v1 because the app has no server-side use case.
>
> **Scope:** 4:5 1080×1350 logical stage, four authored template skins, seven formations, 24 Atlético first-team display labels from the provided 2026–27 manifest, full 2026–27 LaLiga catalogue, all 36 UCL league-phase clubs, competition tags for Supercopa 2027, player and club drag/drop, opponent selection, editable player labels, palette/theme selection, user background upload, local autosave, and 2×/3× PNG export.
>
> **Asset constraint:** Do not invent, generate, scrape, hotlink, or download player portraits or club crests. Create manifest records and file paths only. If a file is missing, show a visually neutral placeholder with the correct text label. The owner will procure and add images later.
>
> **Implementation rules:** Work phase by phase in the order in Section 12. Keep every phase runnable. Reuse shared types and renderers; do not hard-code formation positions separately in each skin. Use one canonical club record with multiple competition tags. Keep persisted state JSON-serializable—never store Konva nodes, DOM objects, image objects, or object URLs. Store uploaded background blobs in IndexedDB. Avoid a generic template-builder, complex layers system, backend, database, live data API, or account system.
>
> **Visual bar:** The UI must feel like a polished, simplified Canva workspace. Spend time on spacing, typography, contrast, artboard presentation, empty states, and four distinct art directions. Use shadcn/ui components rather than inventing inline-styled controls. Build starter skins with vector shapes and bundled typography; do not make template beauty depend on missing real-world images.
>
> **Done means:** the acceptance checklist in Section 13 passes; `npm run lint`, tests, and production build pass; the README documents local setup and asset replacement. At the end, report changed files, implemented features, test commands/results, known limitations, and the exact paths where the owner should copy each set of image assets.

---

## 16. Source links and freshness notes

The season/club records above were checked against official sources on **13 October 2026**:

- [LALIGA EA SPORTS clubs, 2026–27](https://www.laliga.com/laliga-easports/clubes) — authoritative list for the 20 first-division clubs.
- [Atlético de Madrid first-team squad, 2026–27](https://en.atleticodemadrid.com/jugadores-primer-equipo/) — current official short display-name roster used for the initial player manifest.
- [Atlético de Madrid: 2026–27 Champions League opponents](https://en.atleticodemadrid.com/noticias/our-26-27-champions-league-league-phase-opponents) — the club’s eight confirmed league-phase opponents.
- [UEFA: all 36 Champions League league-phase teams and draw](https://www.uefa.com/uefachampionsleague/news/02a8-216cd740d41f-fd3b45ac4a0f-1000--champions-league-league-phase-draw-all-36-teams-learn-their/) — full UCL catalogue and opponent draw.
- [RFEF Supercopa de España information](https://rfef.es/es/noticias/competiciones-masculinas/supercopa) — 2027 participants.

The catalogue should be treated as a season-specific starting point, not a live feed. Update it manually when official roster, competition, or opponent information changes.
