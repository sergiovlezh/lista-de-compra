# lista-de-compra

A shopping list tracker for one person, in the browser. Create lists per store, scan barcodes from your phone to add items, group multiple store visits into one shopping trip ("compra de mercado").

![screenshot placeholder](docs/screenshot.png)

> Add a real screenshot here when Phase 3 lands.

---

## Features

- **Multiple lists per store** — each list belongs to a store because barcodes and prices can differ.
- **List states** — track lists as *Preparando* (at home), *Comprando* (at store), or *Revisado* (done).
- **Filter lists** — filter by state and date to find past shopping trips.
- **Product catalog** — view all saved products, edit name/price/barcode, scan new barcodes.
- **Smart deduplication** — adding the same product (by barcode or exact name) increments quantity instead of creating duplicates.
- **Quantity controls** — increment/decrement item quantity inline; removing last item shows confirmation modal.
- **Item totals** — see unit price × quantity for each line item.
- **Barcode scanning** — point your phone at a product, the app matches it to your stored products and adds it to the current list. Camera starts immediately on scan button click. Zoom slider appears when the device supports hardware zoom.
- **Price history** — each product carries an `updatedAt`. When you scan and the price has changed, the app asks you whether to update.
- **Import/Export** — import products or lists from JSON/CSV, export products only or everything (products + lists) as JSON/CSV.
- **Direct URLs** — React Router enables deep linking to specific lists, products, or settings.
- **Offline by design** — everything lives in your browser's `localStorage`. No account, no server, no sync (yet).

---

## Tech stack

- **Vite + React + TypeScript** — fast scaffold, type safety
- **Tailwind CSS v4** — via the official Vite plugin, no config file
- **shadcn/ui** — accessible, customizable components (Radix UI + Tailwind)
- **Zustand** — single store with localStorage persistence
- **html5-qrcode** — barcode/QR scanning that works on iOS Safari too
- **React Router v6** — client-side routing for direct URL access

Decisions and tradeoffs are recorded in [`docs/DECISIONS.md`](docs/DECISIONS.md).

---

## Setup

```sh
npm install
npm run dev
```

Open the URL Vite shows (usually `http://localhost:5173`).

---

## Documentation

- [`docs/PLAN.md`](docs/PLAN.md) — the roadmap, phases, and Trello board spec
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — architectural decisions (ADRs)
- [`AGENTS.md`](AGENTS.md) — agent-facing notes about the repo

---

## Status

**Phase 6 complete.** Lists with states, filtering, product catalog with full CRUD, smart deduplication, inline quantity controls with modal confirmation, item totals, camera auto-start on scan, import/export in settings, React Router for deep linking. Deployed to Vercel. Run `npm run dev`.

> Baskets ("compra de mercado" grouping) deferred — lists stand alone. See [`docs/PLAN.md`](docs/PLAN.md) Phase 5.