<p align="center">
  <img src="public/icon.svg" alt="Lumen" width="64" height="64" />
</p>

<h1 align="center">Lumen</h1>
<p align="center"><strong>Minimal Data Dashboard</strong></p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" /></a>
  <a href="#quick-start"><img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="Node >= 18" /></a>
  <a href="#technology-stack"><img src="https://img.shields.io/badge/React-18-61dafb?logo=react" alt="React 18" /></a>
  <a href="#technology-stack"><img src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript" alt="TypeScript 5" /></a>
</p>

<p align="center">
  <video src="demo.mp4" width="800" autoplay muted loop playsinline controls>
    <img src="public/screenshot.png" alt="Lumen dashboard screenshot" width="800" />
  </video>
</p>

---

**Lumen** is a zero-config, client-side data exploration tool. Drop a CSV, TSV, TXT, or JSON file and get structured visualizations, column-level statistics, search, and theming — all rendered locally in the browser. No servers, no accounts, no data leaves your machine.

---

## ✨ Features

### 📂 Data Input
- **Drag-and-drop** or **file browse** for `.csv`, `.tsv`, `.txt`, and `.json` files
- **Folder mode** — select a directory to browse and switch between multiple data files without re-uploading
- **Recent folders** — localStorage remembers your last 5 folders with file counts and total size
- Automatic delimiter detection via [PapaParse](https://www.papaparse.com)
- 50 MB file size cap — all parsing runs locally

### 📊 Smart Column Analysis
Each column is inspected and classified as **numeric**, **date**, or **text** using a configurable 70% threshold. Per-column statistics include:

| Numeric | Date | Text |
|---|---|---|
| Mean, median, stdev | Earliest / latest dates | Unique count |
| Min / max / range | Day span | Top-N category frequency |
| Null count | Null count | Null count |

### 📈 Auto-Generated Charts
The dashboard renders up to 5 histograms, 3 category breakdowns, 1 time-series line, 1 aggregation bar, and 1 doughnut:

- **Histogram** — 10-bin numeric distribution
- **Category Bar** — horizontal top-N breakdown
- **Time-Series Line** — date × numeric trend
- **Metric Bar** — mean grouped by category
- **Doughnut** — proportional share

All charts use the active theme's 6-color palette and update instantly on theme change.

### 🔍 Interactive Exploration
- **Column sidebar** — every column listed with type badge, unique count, mean, range
- **Focus mode** — click any column to filter all charts and stats
- **Dataset search** — search every value in every column with instant results, keyboard navigation, and highlighted matches in the data table
- **Fullscreen charts** — click ↗ to expand any chart with scroll-to-zoom and drag-to-pan via `chartjs-plugin-zoom`
- **Scrollable data table** — first 50 rows with search match highlighting

### 🎨 Theming
Six theme options with smooth 0.3s CSS transitions:

| Theme | Shortcut | Style |
|---|---|---|
| Midnight *(default)* | `Ctrl+1` | Dark blue / green / amber |
| Graphite | `Ctrl+2` | Muted grayscale |
| Paper | `Ctrl+3` | Light & crisp |
| Ember | `Ctrl+4` | Warm orange / red / yellow |
| Auto | `Ctrl+0` | Follows OS preference |
| Custom | — | Pick any accent color; full surface derived from luminance |

Theme preference persists in `localStorage`. Custom themes auto-derive light/dark surfaces.

### 📱 Progressive Web App
Installable on desktop and mobile home screens. Works offline via service worker caching.

---

## 🚀 Quick Start

**Prerequisites:** Node.js 18 or later.

```bash
# Install dependencies
npm install

# Start dev server (hot reload on http://localhost:5173)
npm run dev

# Open the app and drop sample-data.csv, or browse any supported file
```

Production build:

```bash
npm run build
npm run preview   # serves dist/ on http://localhost:4173
```

---

## 📋 Supported Formats

| Extension | Description |
|---|---|
| `.csv` | Comma-separated values |
| `.tsv` | Tab-separated values |
| `.txt` | Any delimited text (auto-detected) |
| `.json` | Array of objects, or `{ "rows" \| "data": […] }` |

A **`sample-data.csv`** is included (60 rows of fictional Q1–Q2 product sales) for immediate testing.

---

## 🏗 Architecture

### Chart Selection
Columns are evaluated in a single pass:

1. **Numeric** → histogram (up to 5)
2. **String** → horizontal category bar + doughnut on highest-cardinality column (up to 3 bars)
3. **Date + Numeric** → time-series line
4. **String + Numeric** → vertical bar of mean values by category

Clicking a column in the sidebar enters **Focus Mode**, filtering all charts to that column's data.

### Folder Workflow
```
Select folder → File browser (with preview stats) → Click file → Dashboard
                                                      ← Folder         ↲
                                                      × Clear → Empty
```

Each file in the folder browser shows a live preview (column count, row count) parsed via a lightweight O(n) string scanner — no Papa Parse overhead.

---

## 📁 Project Structure

```
src/
├── App.tsx                    # Shell, state, folder/recent-folder logic
├── main.tsx                   # React entry point
├── lib/
│   └── chartSetup.ts          # Chart.js registration, defaults, zoom plugin
├── utils/
│   ├── fileParser.ts          # CSV / TSV / TXT / JSON parsing + preview
│   ├── columnAnalyzer.ts      # Column type inference and statistics
│   ├── themes.ts              # Theme definitions, palettes, surface derivation
│   └── useTheme.tsx           # Theme context, provider, persistence
├── components/
│   ├── FileUpload.tsx         # Drag-and-drop + folder picker
│   ├── FolderView.tsx         # Folder file browser with preview stats
│   ├── DataOutline.tsx        # Column list sidebar
│   ├── StatsCards.tsx         # Summary statistics row
│   ├── ChartsPanel.tsx        # Chart orchestration + fullscreen overlay
│   ├── HistogramChart.tsx     # Numeric distribution
│   ├── CategoryBarChart.tsx   # Horizontal category breakdown
│   ├── MetricBarChart.tsx     # Vertical aggregation bar
│   ├── MetricLineChart.tsx    # Time-series line
│   ├── MetricDoughnut.tsx     # Category share doughnut
│   ├── DataPreview.tsx        # Data table with search highlighting
│   ├── SearchBar.tsx          # Topbar search with dropdown
│   └── ThemePicker.tsx        # Theme selection popover
└── styles/
    └── glass.css              # Theme system + compact dashboard layout

public/
├── icon.svg                   # Brand mark, favicon, PWA icon
├── screenshot.png             # Dashboard screenshot
└── demo.mp4                   # Feature demo video

scripts/
├── screenshot.mjs             # Puppeteer screenshot capture
└── record-demo.mjs            # Puppeteer + ffmpeg demo video

.github/workflows/
└── deploy.yml                 # GitHub Pages auto-deploy
```

---

## 🔧 Technology Stack

| Layer | Library |
|---|---|
| Build | [Vite 5](https://vitejs.dev) |
| UI | [React 18](https://react.dev) + [TypeScript 5](https://www.typescriptlang.org/) |
| Charts | [Chart.js 4](https://www.chartjs.org) via [react-chartjs-2](https://react-chartjs-2.js.org/) |
| Zoom | [chartjs-plugin-zoom](https://www.chartjs.org/chartjs-plugin-zoom/) |
| Parsing | [PapaParse 5](https://www.papaparse.com) |
| Upload | [react-dropzone 14](https://react-dropzone.js.org) |
| PWA | [vite-plugin-pwa](https://vite-pwa-org.netlify.app) |
| Styling | Custom CSS custom properties — zero framework dependency |

No CSS framework, no UI kit, no external state management.

---

## 🚢 Deployment

### GitHub Pages

Includes a `.github/workflows/deploy.yml` workflow and `.nojekyll` marker.

1. Go to **Settings → Pages** → set source to **GitHub Actions**
2. Push to `main`

Deploys to `https://<owner>.github.io/<repo-name>/`. Vite uses `base: './'` for relative asset paths.

### PWA (Desktop App)

After deploying or running `npm run preview`:
1. Open in Chrome or Edge
2. Click the install icon in the address bar
3. Launch from Start Menu / Dock / Applications

### Native Binary (Tauri)

For a lightweight native executable using the system WebView:

> **Prerequisites:** [Rust](https://rustup.rs) and [Tauri platform dependencies](https://tauri.app/start/prerequisites/)

```bash
npm install --save-dev @tauri-apps/cli@latest
npx tauri init
# Follow prompts (dev: npm run dev, build: npm run build, dist: ../dist)
npm run tauri build
```

---

## 🛠 Development

```bash
npm run dev         # Vite dev server with HMR
npm run build       # Production build → dist/
npm run preview     # Preview build on http://localhost:4173
npx tsc -b --noEmit # TypeScript type-check
```

Scripts:

```bash
node scripts/screenshot.mjs   # Capture dashboard screenshot
node scripts/record-demo.mjs  # Record feature demo video (requires dev server running)
```

---

## 📄 License

[MIT](LICENSE) — Copyright (c) 2026 Jeremy.
