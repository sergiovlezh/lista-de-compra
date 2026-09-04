# lista-de-compra

A shopping list tracker for one person, in the browser. Create lists per store, scan barcodes from your phone to add items, group multiple store visits into one shopping trip ("compra de mercado").

![screenshot placeholder](docs/screenshot.png)

> Add a real screenshot here when Phase 3 lands.

---

## Features

- **Multiple lists per store** — each list belongs to a store because barcodes and prices can differ.
- **Baskets** — group several store-lists into one shopping trip. Baskets are optional; lists can stand alone.
- **Barcode scanning** — point your phone at a product, the app matches it to your stored products and adds it to the current list.
- **Price history** — each product carries an `updatedAt`. When you scan and the price has changed, the app asks you whether to update.
- **Offline by design** — everything lives in your browser's `localStorage`. No account, no server, no sync (yet).

---

## Tech stack

- **Vite + React + TypeScript** — fast scaffold, type safety
- **Tailwind CSS v4** — via the official Vite plugin, no config file
- **Zustand** — single store with localStorage persistence
- **html5-qrcode** — barcode/QR scanning that works on iOS Safari too

Decisions and tradeoffs are recorded in [`docs/DECISIONS.md`](docs/DECISIONS.md).

---

## Setup

```sh
npm install
npm run dev
```

Open the URL Vite shows (usually `http://localhost:5173`).

> Phase 0 is not done yet. These commands will work after Phase 0 lands — see [`docs/PLAN.md`](docs/PLAN.md).

---

## Documentation

- [`docs/PLAN.md`](docs/PLAN.md) — the roadmap, phases, and Trello board spec
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — architectural decisions (ADRs)
- [`AGENTS.md`](AGENTS.md) — agent-facing notes about the repo

---

## Status

Pre-Phase 0. The repo has the plan and the decisions; no application code yet. See [`docs/PLAN.md`](docs/PLAN.md) for what's coming.