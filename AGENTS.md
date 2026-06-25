# SpY — Agent Guide

## Two dev servers (don't confuse them)

| Command | cwd | What it does |
|---|---|---|
| `npm run dev` | root | Vite serves `SCADA/` **statically** on `:8080` — no API endpoints |
| `npm start` | `SCADA/` | Webpack dev server with **all file APIs** (upload, delete, mkdir, list) on `:3000` |
| `npm run build` | `SCADA/` | Webpack production build → `SCADA/dist/` |
| `npm run build` | root | Shell script (unix-only: `rm`, `mkdir`, `cp`, `sed`) — **will fail on Windows** |

Use `npm start` inside `SCADA/` for full functionality (file manager etc).

## CSS is NOT bundled

CSS files (`style.css`, `scada-core.css`) are loaded via `<link>` tags in `index.html`, **not** imported from JS or processed by webpack loaders.

## API layer

- **File management** (CRUD on `Acceso_seguro/`): defined inline in `webpack.config.js` `setupMiddlewares` — not a separate server
- **AI / data backend**: `SCADA/backend/ai_backend.py` — FastAPI on port `5000`, requires PostgreSQL + OpenAI key. DB params in the file are empty placeholders; set them before use. Run with: `uvicorn ai_backend:app --host 0.0.0.0 --port 5000`

## Key structure

- Entry point: `SCADA/js/app.js` (webpack compiles this alone)
- **Never move functions between files** without explicit request — each JS file has a fixed responsibility (see `SCADA/CONTEXTO_PROYECTO.md`)
- `Acceso_seguro/` is the secure file storage root (sandboxed by file manager APIs)
- Login: `admin` / `admin123`
- Default dashboard variables in `variable-manager.js` are for **biodiesel production** (fatty acid monoalkyl esters): reactor temperatures, tank levels, product quality (density, viscosity, acidity, water content), column pressures, pump status.
- Widget catalog (`DM_TYPES` in `dashboard-manager.js`) uses process-oriented names and default variables.

## HMI toolbar

HMI tool buttons (upload, catalog, zoom, rotate, fullscreen, reset) are **hardcoded in HTML** inside `#hmiToolbar`, not created by JS. JS only wires click handlers (`_setupHMITools`) that guard against double-wiring via `data-wired` attribute on `#hmiToolsGroup`.

Login modal sizing: `max-width: 320px` for the form, reduced font sizes (20px heading, 13px inputs), smaller logo (72px left / 56px mobile), padding reduced throughout. Change in `style` block + inline styles in `#loginModal`.

## Integration: P&ID ↔ HMI ↔ Dashboard

- **P&ID** loads SVGs from `Acceso_seguro/pid/` — `pid-manager.js`
- **HMI** loads SVGs from `Acceso_seguro/hmi/` — `hmi-manager.js`
- **Dashboard** widgets consume live data from `processVars` — `dashboard-manager.js`
- **`scadaBus`** (`integration-bus.js`) connects all three via `tag:select`/`tag:focus` events
- SVG elements with `data-tag="VarName"` become interactive hotspots linked to variables
- Live value overlays appear on SVG elements with `data-tag`, updated every 2s
- **LIVE badge** only shows when P&ID, HMI, and Dashboard share at least one common tag
- Each viewer has a file list panel showing saved SVGs for quick reload

## Conventions

- CSS uses custom properties (`var(--primary)` etc.) — colors in `:root` in `style.css`
- Default theme: `data-theme="dark"` on `<html>`
- i18n: `setLang()` in `app.js` — supports ES, EN, DE
- Prettier: 100 width, semicolons, double quotes, trailing commas
- `.venv/` at root is a Python venv for the AI backend

## Responsive breakpoints

| Breakpoint | Device | Changes |
|---|---|---|
| ≥1200px | Large desktop | Full layout (default) |
| 992–1199px | Tablet landscape | Grids reduce columns, smaller content padding |
| 768–991px | Tablet portrait | Sidebar → off-canvas overlay with backdrop, hamburger visible, grids stack, login single-column |
| <768px | Mobile | Smaller topbar (52px), search/clock hidden, panels compact, widgets stack, smaller font sizes |
| <480px | Tiny | Single column grids, full-width login, minimal padding |

Sidebar on tablet/mobile: toggled via hamburger btn → adds `.open` on sidebar + `.sidebar-open` on wrapper. Closes on nav item click or backdrop click.

## Gotchas

- Webpack's `resolve.modules` falls back to root `../node_modules` — deps can live in either `SCADA/node_modules` or root `node_modules`
- `tmp_uploads/` (created by multer) is gitignored
- Static assets (3D models, P&ID SVGs) are copied to `dist/` by CopyWebpackPlugin during build
