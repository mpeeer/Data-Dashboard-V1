# Lumen — Data Dashboard

A clean, **glassmorphism** data dashboard that turns any CSV, TSV, TXT, or JSON file into a structured dashboard in one click. **No AI filler, no setup, no signup** — just drop a file and read the data.

> *“If you can see the data, you can understand it.”*

---

## ✨ Features

- **File-first input** — drag-drop or browse for `csv`, `tsv`, `txt`, or `json` (delimiter is auto-detected)
- **Smart column detection** — numbers, dates, and text columns inferred per type with statistics
- **Auto-generated charts** — histograms, category breakdowns, time series, mean-by-category bars, and a share doughnut
- **Data outline sidebar** — column types, unique counts, mean/range, sample values
- **Focused mode** — click any column in the sidebar to filter every chart to it
- **Scrollable preview table** — first 50 typed rows at the bottom
- **Modern glass UI** — frosted surfaces, gradient orbs, animated backdrop, Inter typography
- **Installable PWA** — adds to desktop / home screen as a standalone app
- **Zero backend** — all parsing happens in your browser; your data never leaves your machine

---

## 🚀 Quick start

Requires **Node.js 18+** (tested on 20 and 24).

```bash
# 1. install
npm install

# 2. develop (hot reload on http://localhost:5173)
npm run dev

# 3. try it
#    open http://localhost:5173
#    drag sample-data.csv onto the window, or click "Choose a file"
```

To produce a production build in `dist/`:

```bash
npm run build
npm run preview      # serves the build locally on http://localhost:4173
```

---

## 📂 Supported files

| Extension | What it accepts                                              |
| --------- | ------------------------------------------------------------ |
| `.csv`    | Comma-separated values                                       |
| `.tsv`    | Tab-separated values                                         |
| `.txt`    | Any delimited text (PapaParse auto-detects delimiter)        |
| `.json`   | Top-level array of objects, *or* `{ "rows" \| "data": [] }` |

A `sample-data.csv` is included (60 rows of fictional Q1–Q2 product sales) so you can poke at the dashboard immediately.

Limits: **50 MB** file size cap, column type detection ≥ 70 % of values match the inferred type, up to **5** numeric histograms and **3** category breakdowns auto-rendered.

---

## 🌐 Deploy to GitHub Pages

This repo ships with `.github/workflows/deploy.yml`. Push to `main` and the dashboard is live at:

```
https://<owner>.github.io/Data-Dashboard-V1/
```

If your repo is called something else, update `package.json`:

```jsonc
// change this line to match your repo name
"build:gh": "tsc -b && vite build --base=/YOUR-REPO-NAME/"
```

To enable Pages for the first time:

1. Repo → **Settings → Pages**
2. Source: **GitHub Actions**
3. Push to `main`

That’s it — every commit rebuilds and redeploys.

### Running the build locally under a subpath

```bash
npm run build:gh
npm run serve
```

---

## 📦 Install as a desktop app (PWA)

The build is a Progressive Web App. After deploying (or running `npm run preview`), in Chrome or Edge:

1. Open the dashboard URL
2. Click the **install icon** in the address bar (or *⋮ → Install Lumen*)
3. Launch from your Start Menu / Dock / Applications folder

The installed app launches standalone (no browser chrome), remembers your data per tab session, and works offline once the service worker has cached the shell.

---

## 🪟 Wrap as a real native executable (optional)

This repo ships only as a web app. If you want a **single-file native binary** (~ 10 MB, using the system WebView instead of bundling Chromium like Electron does), add [Tauri](https://tauri.app/) yourself:

> One-time setup on each dev machine: install the [Rust toolchain](https://rustup.rs) and the Tauri prerequisites for your OS. Tauri scaffolding is **not** included in this repo — it must be added per project.

From the project root, with the dev server stopped:

```bash
npm install --save-dev @tauri-apps/cli@latest
npx tauri init
```

When `npx tauri init` asks which command to run before `tauri dev` / `tauri build`, point it at the Vite preview/build scripts:

| Prompt                                | Answer                                |
| ------------------------------------- | ------------------------------------- |
| dev command (beforeDevCommand)        | `npm run dev`                         |
| build command (beforeBuildCommand)    | `npm run build`                       |
| frontend dist directory (frontendDist)| `../dist` (one level up from `src-tauri`) |
| dev server URL (devUrl)               | `http://localhost:5173`               |

Then add to your `package.json` `scripts`:

```jsonc
"tauri:dev":   "tauri dev",
"tauri:build": "npm run build && tauri build"
```

```bash
npm run tauri:build   # writes a real .exe (Windows), .dmg (macOS), .AppImage / .deb (Linux)
```

The Tauri shell will load the static `dist/` output. Because Lumen has **no network calls**, the small bundle ships without any external traffic.

### Alternatives

- **Electron** — heavier (~150 MB), ships its own Chromium, easiest mental model: `npm i -D electron electron-builder` plus a tiny `main.js`.
- **pkg / Node SEA** — wrap the static site with `npx serve` to get a cross-platform JS launcher.

Each of these adds native toolchain weight; Tauri is the lightest option that produces a real binary.

---

## 🧰 Stack

| Layer            | Library                                                  |
| ---------------- | -------------------------------------------------------- |
| Build / Dev      | [Vite 5](https://vitejs.dev)                             |
| UI               | [React 18](https://react.dev) + [TypeScript 5](https://www.typescriptlang.org/) |
| Charts           | [chart.js 4](https://www.chartjs.org) via react-chartjs-2|
| File parsing     | [PapaParse 5](https://www.papaparse.com)                 |
| Drop / browse    | [react-dropzone 14](https://react-dropzone.js.org)       |
| PWA              | [vite-plugin-pwa 0.20](https://vite-pwa-org.netlify.app) |
| Typography       | [Inter](https://rsms.me/inter/) (Google Fonts)           |
| Theme            | Hand-rolled glassmorphism in `src/styles/glass.css`      |

No CSS framework, no UI kit, no state library, **no AI-decorative code**.

---

## 🧠 How the dashboard decides what to chart

For each loaded dataset, Lumen walks the columns once:

1. **Numbers** → a histogram (10 equal-width bins), up to 5 of them
2. **Strings** → top-N category breakdown (horizontal bar) plus a share doughnut on the top column
3. **Dates × Numbers** → sorted time-series line chart
4. **Strings × Number** → top-N categories by mean (vertical bar) for the un-filtered view

Type inference uses a **70 % threshold** per column (configurable in `src/utils/columnAnalyzer.ts`).

---

## 🛠 Development

```bash
npm run dev         # vite dev server with HMR
npm run typecheck   # tsc -b --noEmit
npm run build       # production build → dist/
npm run build:gh    # build with /Data-Dashboard-V1/ base path for Pages
npm run serve       # vite preview of the production build
```

Project layout:

```
src/
├── App.tsx                          # top-level shell
├── main.tsx                         # React entry
├── lib/chartSetup.ts                # shared chart.js configuration
├── utils/
│   ├── fileParser.ts                # CSV/TSV/TXT/JSON → rows + columns
│   └── columnAnalyzer.ts            # per-column type detection + stats
├── components/
│   ├── FileUpload.tsx               # drag-drop / browse
│   ├── DataOutline.tsx              # sidebar with column list
│   ├── StatsCards.tsx               # top stats row
│   ├── ChartsPanel.tsx              # auto-selects which charts to render
│   ├── HistogramChart.tsx           # numeric distribution bar
│   ├── CategoryBarChart.tsx         # horizontal category breakdown
│   ├── MetricBarChart.tsx           # vertical aggregation bar
│   ├── MetricLineChart.tsx          # time-series line
│   ├── MetricDoughnut.tsx           # category share
│   └── DataPreview.tsx              # scrollable first-50-rows table
└── styles/glass.css                 # the glassmorphism theme

public/
└── icon.svg                         # brand mark / PWA icon

.github/workflows/
└── deploy.yml                       # Pages auto-deploy

sample-data.csv                      # 60 rows of sales data
```

---

## 📜 License

This project ships **without a license file** so all rights remain with you by default. If you want to open-source it, drop an MIT `LICENSE` file in the root and push — done.

---

## 🙌 Vision

> Most data tools clutter the screen with **AI summaries, “smart insights,”** and pretend-intelligence features. Lumen does the opposite: every chart on screen is **a direct, honest read of the data**. No decoration, no hidden model, no surprises.
