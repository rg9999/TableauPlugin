# Tableau Telemetry Explorer — Deployment Guide

## Prerequisites

- Tableau Server 2021.4+ (Extensions API v1.4+)
- Access to Tableau Server's extension hosting directory
- Tableau Server administrator access (for allowlisting)

## Build

```bash
cd tableau-telemetry-extension
npm install
npm run build
```

This produces a `dist/` directory containing:

```
dist/
  index.html          # Extension entry point
  manifest.trex       # Tableau extension manifest
  assets/
    index-[hash].js   # Single JS bundle (React + AG Grid + MUI + app code)
    index-[hash].css   # Combined styles
```

The build is fully self-contained — no external CDN references, no runtime network requests.
Bundle size: ~1.1MB JS + ~215KB CSS (326KB + 37KB gzipped).

## Deploy to Tableau Server

### 1. Host the extension files

Copy the entire `dist/` directory to a web-accessible location on your Tableau Server (or any internal web server). Example:

```bash
# On Tableau Server (or internal web server)
mkdir -p /var/www/extensions/telemetry-explorer
cp -r dist/* /var/www/extensions/telemetry-explorer/
```

The extension must be served over HTTPS in production. For development, HTTP is acceptable.

### 2. Update manifest.trex

Before deploying, update the `<url>` in `dist/manifest.trex` to point to your server:

```xml
<source-location>
  <url>https://your-server.example.com/extensions/telemetry-explorer/index.html</url>
</source-location>
```

### 3. Register on Tableau Server allowlist

1. Log in to Tableau Server as an administrator
2. Navigate to **Settings > Extensions**
3. Add the extension URL to the allowlist
4. Set the extension to **Allow** (or **Allow with Full Data Access** if needed)

No other Tableau Server configuration is required.

### 4. Add to a dashboard

1. Open a Tableau workbook
2. Navigate to a dashboard
3. From the Objects panel, drag **Extension** onto the dashboard
4. Select **My Extensions** and provide the `.trex` file or URL
5. The extension loads and displays the tree selector + grid

## Version Updates

To deploy a new version:

1. Build the new version: `npm run build`
2. Replace the contents of the hosting directory with the new `dist/` files
3. Existing dashboards will pick up the new version on next page load
4. Previously saved field selections and configurations are preserved (settings are versioned)
5. Analysts do not need to reconfigure their dashboards

## Air-Gapped Deployment

The extension is designed for air-gapped environments:

- All JavaScript, CSS, and assets are bundled into the single `dist/` directory
- No external CDN references or runtime network requests
- No `fetch()`, `XMLHttpRequest`, or dynamic `import()` calls to external URLs
- AG Grid Community (open source) — no license key required
- The extension communicates exclusively through the Tableau Extensions API

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Extension doesn't load | Check the URL in manifest.trex matches the hosting location |
| "Extension not allowed" error | Add the URL to Tableau Server's extension allowlist |
| Blank grid after load | Verify the data source has columns with dotted-path naming |
| Settings not persisting | Ensure the workbook is saved after configuring fields |
| HTTPS required error | Serve the extension files over HTTPS in production |

## Configuration

The extension has no configuration files. All settings are persisted through the Tableau Settings API when the workbook is saved.

| Setting | Stored | Restored |
|---------|--------|----------|
| Selected fields | Yes | Yes |
| Column order | Yes | Yes |
| Tree panel width | Planned | Planned |
| Sort/filter state | No (session only) | No |
