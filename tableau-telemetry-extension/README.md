# Telemetry Explorer — Tableau Dashboard Extension

A Tableau Dashboard Extension for aerospace telemetry analysis. It provides a tree-based field selector paired with an AG Grid data view, allowing analysts to interactively explore, filter, sort, and compare telemetry fields directly inside Tableau dashboards.

## Features

- **Tree-based field selection** — Browse available telemetry fields in a hierarchical tree and drag them onto the grid.
- **AG Grid data view** — High-performance grid with sortable columns, column-level filtering, resizable columns, and row-level message-type color coding.
- **Layout presets** — Save and load named layout configurations (selected fields, panel sizes, sort/filter state) that persist across sessions via the Tableau Extensions Settings API.
- **Auto-save** — Panel sizes, collapse states, selected worksheet, sort model, and filter model are automatically saved and restored.
- **Detail panel** — Click any row to inspect the full record in a collapsible side panel.
- **Air-gapped deployment** — The production build is fully self-contained with no CDN dependencies. The Tableau Extensions API JS is bundled locally.

## Tech Stack

| Layer | Technology |
|---|---|
| UI framework | React 19 + TypeScript |
| Data grid | AG Grid Community 35 (Balham theme) |
| Component library | MUI 7 (Material UI) |
| Drag-and-drop | @dnd-kit |
| State management | Zustand 5 (slices pattern) |
| Build tool | Vite 8 |
| Persistence | Tableau Extensions Settings API |

## Project Structure

```
tableau-telemetry-extension/
├── public/
│   ├── manifest.trex              # Tableau extension manifest
│   ├── tableau.extensions.min.js  # Bundled Tableau Extensions API (v1.16.0)
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── GridArea/              # AG Grid + custom header + column builder
│   │   ├── TreeSelector/          # Hierarchical field tree
│   │   ├── DetailPanel/           # Row detail inspector
│   │   ├── PanelLayout/           # Resizable 3-panel layout
│   │   ├── LayoutPresets/         # Save/load named presets
│   │   ├── StatusBar/             # Bottom bar with preset controls
│   │   ├── WorksheetSelector/     # Tableau worksheet picker
│   │   └── LogConsole/            # Dev-mode log viewer
│   ├── hooks/                     # useSettingsPersistence, etc.
│   ├── models/                    # TypeScript interfaces
│   ├── services/                  # tableauAdapter (Extensions API wrapper)
│   ├── store/                     # Zustand store + slices
│   ├── theme/                     # AG Grid styles, icons, design tokens
│   └── utils/                     # Shared helpers
├── scripts/
│   └── deploy.sh                  # Version bump + build + ZIP packaging
├── certs/                         # Self-signed TLS certs (dev only)
├── vite.config.ts
├── package.json
└── tsconfig.json
```

## Prerequisites

- **Node.js** 18+ and npm
- **Tableau Desktop** 2021.4+ or **Tableau Server** 2021.4+ (Extensions API 1.4+)
- **OpenSSL** (for generating dev TLS certificates)

## Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/rg9999/TableauPlugin.git
   cd TableauPlugin/tableau-telemetry-extension
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Generate self-signed TLS certificates** (required — the Extensions API requires HTTPS)

   ```bash
   mkdir -p certs
   openssl req -x509 -newkey rsa:2048 -keyout certs/key.pem -out certs/cert.pem \
     -days 365 -nodes -subj "/CN=localhost"
   ```

4. **Start the dev server**

   ```bash
   npm run dev
   ```

   The extension will be available at `https://localhost:5173`.

5. **Load in Tableau Desktop**

   - Open a Tableau workbook with a data source connected.
   - Drag an **Extension** object onto the dashboard.
   - Choose **My Extensions** and select `public/manifest.trex`.
   - Accept the "full data" permission prompt.

## Building for Production

```bash
npm run build
```

The output goes to `dist/`. It is a fully self-contained bundle — all JS, CSS, the Tableau Extensions API, and the manifest are included with no external dependencies.

### Versioned Release Package

```bash
npm run deploy
```

This runs `scripts/deploy.sh`, which automatically bumps the patch version in `package.json` and `manifest.trex`, builds the project, and creates a ZIP file in `releases/` (e.g., `telemetry-explorer-v1.0.2.zip`).

## Air-Gapped Deployment

The production build has **zero runtime CDN dependencies**. The Tableau Extensions API JavaScript (`tableau.extensions.min.js`) is bundled in the `dist/` folder alongside the application code. This means the extension works on networks with no internet access.

### Deploying to an Air-Gapped Tableau Server

1. **Build on a machine with internet access**

   ```bash
   npm install
   npm run build
   ```

   Or use the deploy script to get a versioned ZIP:

   ```bash
   npm run deploy
   ```

2. **Transfer the build output**

   Copy the `dist/` folder (or the ZIP from `releases/`) to the air-gapped environment via USB drive, secure file transfer, or your organization's approved transfer method.

3. **Host the files on your internal web server**

   Unzip or copy the contents of `dist/` to any HTTPS-enabled web server accessible from Tableau Server. For example, if you host at `https://internal-server.example.com/telemetry-explorer/`, the directory should contain:

   ```
   index.html
   manifest.trex
   tableau.extensions.min.js
   assets/
     index-XXXXX.js
     index-XXXXX.css
   ```

   The web server must serve over HTTPS (self-signed is fine if Tableau Server trusts the certificate).

4. **Update the manifest URL**

   Edit the `manifest.trex` file and change the `<url>` to point to your internal server:

   ```xml
   <source-location>
     <url>https://internal-server.example.com/telemetry-explorer/</url>
   </source-location>
   ```

5. **Allowlist the extension on Tableau Server**

   In Tableau Server admin settings, add the extension URL to the allowlist under **Settings > Extensions**. Enable "Full Data Access" for the extension.

6. **Add to a dashboard**

   Open a workbook in Tableau, drag an Extension object onto the dashboard, and select the hosted `manifest.trex`. No internet connectivity is required at any point during use.

### Deploying for Local Use (Tableau Desktop Only)

If you just need to run the extension on a single machine without a server:

1. Build the project as described above.
2. Copy the `dist/` folder to a permanent location on the machine (e.g., `C:\TableauExtensions\telemetry-explorer\`).
3. Start a local HTTPS server pointing at that folder (e.g., using Python, Node, or IIS).
4. Update `manifest.trex` with the local URL (e.g., `https://localhost:8443/`).
5. Load the extension from the local `manifest.trex`.

## Configuration

The extension stores all settings via the Tableau Extensions Settings API, which means configuration persists with the workbook. Settings include:

- Selected fields and their display order
- Column widths, sort model, and filter model
- Panel sizes and collapse states
- Named layout presets

Settings are versioned (`SETTINGS_VERSION = 2`) with automatic migration from older formats.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR (HTTPS on port 5173) |
| `npm run build` | Type-check and build for production |
| `npm run deploy` | Bump version, build, and create release ZIP |
| `npm run test` | Run Vitest in watch mode |
| `npm run test:ci` | Run tests once (CI mode) |
| `npm run lint` | Lint source files with ESLint |
| `npm run format` | Format source files with Prettier |
| `npm run preview` | Preview the production build locally |

## License

Private — not published to npm.
