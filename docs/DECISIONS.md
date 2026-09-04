# Decisions

Lightweight ADRs. Each entry is a short tag (`D-NNN`) so we can reference decisions from `docs/PLAN.md` and from commit messages.

Format per entry: **Context** / **Decision** / **Consequences**. Status: `accepted` | `superseded` | `rejected`.

---

## D-001 — Single-page app, no router · status: accepted

**Context.** Small client-only app with ~4 views total. Project is also a learning exercise, so we want to keep moving parts minimal.

**Decision.** View switcher driven by a `view` field in the Zustand store. React Router rejected for v1.

**Consequences.**
- No URL deep-linking. Refreshing mid-flow re-enters at the last view (acceptable for now).
- One less dep, one less concept.
- If we ever need shareable URLs or browser history, drop in the router and migrate views to routes. Each view is already a standalone component, so the move is local.

---

## D-002 — Zustand over Redux or plain Context · status: accepted

**Context.** Shared state across multiple views plus persistence to localStorage. No async/server layer in v1.

**Decision.** Zustand with the `persist` middleware. One store, one file (`src/store.ts`).

**Consequences.**
- Small bundle, no provider boilerplate.
- Persistence is one line of middleware config.
- Tests can construct a fresh store per test without a wrapping provider.
- If we add server sync later, Zustand handles async actions fine; no rewrite needed.

---

## D-003 — Html5-QRCode for scanning · status: accepted

**Context.** We want barcode scanning on phones. The browser-native `BarcodeDetector` API is missing on iOS Safari, which matters for this project's audience.

**Decision.** Use `html5-qrcode` (~200KB). It covers both Android and iOS from a single dependency, so we don't need a fallback dance.

**Consequences.**
- iOS Safari requires camera start from a user gesture (click). The Scanner view starts the camera on button click, not in `useEffect`.
- One library covers both 1D barcodes and QR. Slightly more code than the native API, but uniform.
- If native BarcodeDetector becomes universal, we can swap the lib behind the same Scanner component.

---

## D-004 — Tailwind v4 via Vite plugin · status: accepted

**Context.** Learning project. Want fast iteration with minimal config ceremony.

**Decision.** `@tailwindcss/vite` plugin. CSS entry is just `@import "tailwindcss";`. No `tailwind.config.js` unless we need it.

**Consequences.**
- Theme tokens go through CSS variables, not a JS config.
- Any future Tailwind plugins must be CSS-imported, not JS-registered.
- If we ever need a config file (custom theme, content globs), Tailwind v4 supports it; we add it then.

---

## D-005 — Basket optional, store-list can stand alone · status: accepted

**Context.** User described baskets ("compra de mercado") as a way to group several store-lists into one shopping trip, but also said individual store-lists should exist without a basket.

**Decision.** A `StoreList` has an optional `basketId`. The Baskets view lists both baskets and standalone store-lists in one place.

**Consequences.**
- Slight UI complexity (two list types in one view) for the flexibility the user asked for.
- Data model is uniform — one `storeLists` array, a `baskets` array. No "orphan vs nested" branching in code.
- A store-list can later be re-parented to a basket with one field change.

---

## D-006 — Templates deferred · status: accepted

**Context.** "Reuse this list" came up as a feature. The user chose to defer it; they want the simpler model first and will revisit when the friction of repeating a shop is felt.

**Decision.** No template entity in v1. When added later, "new from past list" can be implemented as a clone of an existing `StoreList` or `Basket` — no new entity required.

**Consequences.**
- Less to build now.
- Revisit when the user feels the friction. Adding clone is a few lines on top of the existing actions.