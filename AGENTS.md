# AGENTS.md

## Status

This repository currently contains only `.gitignore`, `LICENSE`, and a one-line `README.md`. There is no source code, no manifest (`package.json`, `Cargo.toml`, `pyproject.toml`, etc.), no build/test/lint config, and no existing instruction files.

Anything stated below as a command or convention is not yet verifiable; do not invent commands. Re-evaluate this file once the project's tooling and entrypoints are added.

## Repo

- Remote: `git@github.com:sergiovlezh/lista-de-compra.git`
- Default branch: `main`
- `.gitignore` is the standard Node template — it suggests a Node/JS toolchain is likely, but this is unconfirmed.

## Conventions (assumed, pending verification)

- Keep `README.md` updated alongside any new feature or setup step.
- Do not commit secrets; `.env*` is gitignored except `.env.example`.

## When you add the first real source

Update this file with:
- The exact dev / build / test / lint / typecheck commands (copy from the manifest's scripts block).
- Real entrypoints (e.g. `src/index.ts`, `app/main.py`) and any package boundaries.
- Required env vars and how to load them (e.g. `.env.example`).
- Any framework or codegen quirks discovered in the config.