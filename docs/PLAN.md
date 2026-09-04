# Plan — `lista-de-compra`

Shopping list tracker. Single user, browser-only, barcode-scanning on phones.

This file is the source of truth. The Trello board mirrors it.

---

## Phases

Each phase ends with a runnable verify line. That line is the contract: pass it, ship the phase.

### Phase 0 — Bootstrap

The first code that exists. Goal: confirm the toolchain works before any domain code.

- [ ] `npm create vite@latest . -- --template react-ts` (run with the dir empty except git)
- [ ] `npm i html5-qrcode zustand`
- [ ] `npm i -D tailwindcss @tailwindcss/vite`
- [ ] Add Tailwind v4 plugin to `vite.config.ts`
- [ ] Replace generated CSS with `@import "tailwindcss";`
- [ ] `npm run dev` → see Vite default page

**Verify:** `npm run dev` boots without errors and renders the Vite page in the browser.

### Phase 1 — Types + storage

Lock the schema before any component reads or writes.

- [ ] `src/types.ts` with `Product`, `Store`, `Item`, `StoreList`, `Basket`, `View`
- [ ] `src/lib/storage.ts` — load/save to localStorage, version key, `migrate(state, version)`
- [ ] `src/seed.ts` — empty array stub; user pastes items later
- [ ] `src/main.tsx` imports from `types.ts` only, no UI changes
- [ ] `npm run dev` still boots

**Verify:** `npm run dev` boots without errors. Type-check passes (`npm run build`).

### Phase 2 — Zustand + persistence wiring

Prove persistence before building views on top.

- [ ] `src/store.ts` with slices: products, stores, baskets, storeLists, view, currentIds
- [ ] Wire `persist` middleware, single key `ldc:v1`
- [ ] Actions: `upsertProduct`, `addItem`, `toggleItem`, `createStoreList`, `createBasket`, `setView`
- [ ] `App.tsx` renders a `<pre>{JSON.stringify(state, null, 2)}</pre>` for sanity
- [ ] Reload page → state survives

**Verify:** trigger each action via the dev console, reload, confirm state rehydrates from localStorage.

### Phase 3 — Views

Single-page view switcher. No router.

- [ ] `src/App.tsx` switches on `view`, renders one of the views
- [ ] `src/views/Baskets.tsx` — list of baskets + standalone store-lists
- [ ] `src/views/BasketDetail.tsx` — its store-lists + totals + notes
- [ ] `src/views/StoreListDetail.tsx` — items, add by barcode (manual input), toggle checked
- [ ] `src/components/ItemRow.tsx`
- [ ] `src/components/ProductForm.tsx`
- [ ] Top nav with back button, calls `setView`
- [ ] Click through: create basket → add list → add item → reload → still there

**Verify:** full manual flow works end-to-end, data survives reload.

### Phase 4 — Scanner

Html5-QRCode. Camera must start from a user click (iOS gesture rule).

- [ ] `src/views/Scanner.tsx` with Html5-QRCode, camera start on user click
- [ ] On scan → `upsertProduct({barcode, storeId})` + open `ProductForm` on miss
- [ ] On hit with price drift → confirm "update price?" prompt
- [ ] Add item to current store-list (if set), else prompt "add to which list?"
- [ ] Unsupported browser → friendly fallback message
- [ ] Scan a real barcode, item lands in list

**Verify:** scan a product barcode with a phone, item appears in the list and survives reload.

### Phase 5 — Polish

- [ ] Empty states (no lists, no products)
- [ ] Edit/delete product
- [ ] Confirm-delete dialogs
- [ ] Date picker uses native `<input type="date">`
- [ ] Total per list and per basket
- [ ] Notes field on basket/list
- [ ] Deploy: push to GitHub Pages or similar (skip until asked)

**Verify:** empty states render, totals add up, native date picker works on mobile.

---

## Deferred

Each becomes its own phase when needed.

- Templates / "reuse this list" — see `D-006`
- Multi-user + sync
- PWA install / offline indicator
- Categories / sections
- Export / import JSON

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
8. Done

**Cards** = one per checklist `[ ]` above. Naming: `[P0] Vite scaffold`, `[P1] types.ts`, …

**Labels:** `setup`, `types`, `state`, `ui`, `scanner`, `verify`

**Card description** always includes:
- The exact command or file edit
- A "Verify: ..." line copied from this file
- "see `docs/PLAN.md`"

**Workflow:** card moves to Done when its verify line passes. Verify line is the definition of done.