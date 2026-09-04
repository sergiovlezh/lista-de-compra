# AGENTS.md

## Status

Phase 0 complete. Toolchain is live; no domain code yet.

## Repo

- Remote: `git@github.com:sergiovlezh/lista-de-compra.git`
- Default branch: `main`
- Integration branch: `dev` (PRs to `main` come from `dev`)
- Feature branches: `feat/<short-name>`, off `dev`, PR back to `dev`

## Stack

- Vite 5 + React 18 + TypeScript 5
- Tailwind v4 via `@tailwindcss/vite` (no `tailwind.config.js`)
- Zustand for state, `zustand/middleware/persist` for localStorage
- `html5-qrcode` for barcode/QR scanning

## Commands

- `npm install` — install deps
- `npm run dev` — Vite dev server (default `http://localhost:5173`)
- `npm run build` — typecheck (`tsc -b`) then production build to `dist/`
- `npm run preview` — serve the built `dist/` locally

No test runner, no linter, no formatter configured yet. Add when a second contributor shows up or the first one complains.

## Entrypoints

- `index.html` → `src/main.tsx` → `src/App.tsx`
- `src/store.ts` — Zustand store (Phase 2)
- `src/types.ts` — domain types (Phase 1)
- `src/views/*` — one file per view (Phase 3)

## Conventions

- Keep `README.md` updated alongside any new feature or setup step.
- Do not commit secrets; `.env*` is gitignored except `.env.example`.
- Tailwind: theme tokens via CSS variables in `src/index.css`, no JS config.
- Imports use the `@/` alias? No — keep it relative until a second level of nesting earns it.
