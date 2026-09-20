# Plan — `lista-de-compra`

Shopping list tracker. Single user, browser-only, barcode-scanning on phones.

This file is the source of truth. The Trello board mirrors it.

---

## Phases

Each phase ends with a runnable verify line. That line is the contract: pass it, ship the phase.

### Phase 0 — Bootstrap ✅

The first code that exists. Goal: confirm the toolchain works before any domain code.

- [x] `npm create vite@latest . -- --template react-ts` (run with the dir empty except git)
- [x] `npm i html5-qrcode zustand`
- [x] `npm i -D tailwindcss @tailwindcss/vite`
- [x] Add Tailwind v4 plugin to `vite.config.ts`
- [x] Replace generated CSS with `@import "tailwindcss";`
- [x] `npm run dev` → see Vite default page

**Verify:** `npm run dev` boots without errors and renders the Vite page in the browser.

### Phase 1 — Types + storage ✅

Lock the schema before any component reads or writes.

- [x] `src/types.ts` with `Item`, `StoreList`, `ProductMemory`, `View`, `ListState`
- [x] `src/store.ts` with Zustand + persist middleware
- [x] `npm run dev` still boots
- [x] Type-check passes (`npm run build`)

**Verify:** `npm run dev` boots without errors. Type-check passes (`npm run build`).

### Phase 2 — Zustand + persistence wiring ✅

Prove persistence before building views on top.

- [x] `src/store.ts` with slices: lists, products, view
- [x] Wire `persist` middleware, single key `ldc:v1`
- [x] Actions: `createList`, `deleteList`, `updateList`, `addItem`, `toggleItem`, `removeItem`, `updateItemQty`, `rememberProduct`, `updateProduct`, `deleteProduct`, `importProducts`, `importLists`, `exportData`
- [x] Reload page → state survives

**Verify:** trigger each action via the dev console, reload, confirm state rehydrates from localStorage.

### Phase 3 — Views ✅

Single-page view switcher with React Router.

- [x] `src/App.tsx` with React Router routes
- [x] Lists view — create/list lists, filter by state/date
- [x] Detail view — items with quantity controls, add form, scanner button at top
- [x] Scanner view — camera auto-starts, cancel button
- [x] Products view — list all products, create/edit/delete with modal form
- [x] Settings view — import/export JSON/CSV
- [x] Top nav with links to Lists, Products, Settings

**Verify:** full manual flow works end-to-end, data survives reload, direct URLs work.

### Phase 4 — Scanner ✅

Html5-QRCode. Camera must start from a user click (iOS gesture rule).

- [x] Scanner view with Html5-QRCode, camera starts on scan button click
- [x] On scan → match product, add to list (with deduplication)
- [x] On miss → form to enter name/price, then add
- [x] Price drift → confirm "update price?" prompt
- [x] Unsupported browser → friendly fallback message
- [x] Scan a real barcode, item lands in list

**Verify:** scan a product barcode with a phone, item appears in the list and survives reload.

### Phase 5 — Polish ✅

- [x] Empty states (no lists, no products)
- [x] Edit/delete product with full modal form
- [x] Confirm-delete dialogs (modal for items, native confirm for lists)
- [x] Date picker uses native `<input type="date">`
- [x] Total per list and per item (price × qty)
- [x] Notes field on list
- [x] Deploy: Vercel with SPA rewrite

**Verify:** empty states render, totals add up, native date picker works on mobile, Vercel deploy works.

### Phase 6 — Enhanced UX ✅

- [x] **shadcn/ui** component library for consistent, accessible UI
- [x] **List states**: Preparando / Comprando / Revisado with badge colors
- [x] **Filter lists** by state and date
- [x] **Lists view**: new list form on top, lists sorted by date descending
- [x] **Detail view**: scanner button and add form at top, item totals column
- [x] **Quantity controls**: inline +/- buttons, removing last item shows modal
- [x] **Remove item**: trashcan icon, modal confirmation
- [x] **Camera auto-start**: scan button opens camera immediately
- [x] **Cancel scan**: button to return to list
- [x] **Product form**: modal with all fields, barcode scanner, create/edit redirect to products list
- [x] **Import/Export** moved to Settings page

**Verify:** all features work, build passes, deployed to Vercel main.

---

## Deferred

Each becomes its own phase when needed.

- Templates / "reuse this list" — see `D-006`
- Multi-user + sync
- PWA install / offline indicator
- Categories / sections
- Baskets ("compra de mercado" grouping) — lists stand alone for now

---

## Trello mirror

**Board:** `lista-de-compra` (private)

**Lists (columns):**
1. Backlog — items from the Deferred section
2. Phase 0 — Bootstrap
3. Phase 1 — Types + storage
4. Phase 2 — Zustand
5. Phase 3 — Views
6. Phase 4 — Scanner
7. Phase 5 — Polish
8. Phase 6 — Enhanced UX
9. Done

**Cards** = one per checklist `[ ]` above. Naming: `[P0] Vite scaffold`, `[P1] types.ts`, …

**Labels:** `setup`, `types`, `state`, `ui`, `scanner`, `verify`

**Card description** always includes:
- The exact command or file edit
- A "Verify: ..." line copied from this file
- "see `docs/PLAN.md`"

**Workflow:** card moves to Done when its verify line passes. Verify line is the definition of done.