# pf2e-module-template — project rules

A Foundry VTT **Pathfinder 2e** module template. Hybrid: compendium content (`packs/`)
plus a scripted esmodule (`src/`) built with TypeScript + Svelte 5 + Vite
(`src/index.ts` → `dist/pf2e-module-template.{js,css}`). `module.json` is the manifest.

**The Foundry/PF2e API, compendium packs, Svelte-in-ApplicationV2, the Vite build, and
multi-client sync live in the user-level `foundry-pf2e` skill** — consult it for any of
those (it loads on demand, so this file stays lean). Here: only the hard rules and
what's specific to this repo.

New module from this template: `npm run init -- <new-id> [--title "..."]` rewrites the
id/title everywhere and deletes the init script. See README.

Code style: global `~/.claude/CLAUDE.md` — comment only the non-obvious *why*.

## Hard rules (override defaults)

- **v14 only, no v1 APIs.** Everything under `foundry.*`. Never `foundry.appv1`, bare
  `Application` / `FormApplication` / `Dialog`, or bare `mergeObject` / `duplicate` /
  `getProperty`. Windows are ApplicationV2; dialogs DialogV2; structured data is
  `foundry.abstract.DataModel` + `defineSchema()`. A v1-only class → find the V2 form first.
- **TypeScript everywhere, including tooling.** `vite.config.ts`, `svelte.config.ts`,
  and `scripts/*.ts` run via `node` (≥22.6 strips types — no `tsx`/`ts-node`). No
  `.mjs`/`.js` tooling. `package.json` pins `engines.node`.
- **UI is Svelte 5 mounted in an ApplicationV2 shell** (`mount`/`unmount`, runes) — not
  Svelte 4 forms (`new Component()`, `$destroy`, `export let`). See the skill's
  `svelte-in-applicationv2.md`.

## Build & dev

- `npm run build` → `dist/` (gitignored; build before enabling a world, and after edits).
- `npm run dev` — watch. `npm run check` — `svelte-check` + `tsc`. `npm run setup` —
  resolve dev paths (detect/clone/prompt), then symlink into Foundry + pull references in.
- Active install: `FoundryVTT-v14`. References: `_pf2e-source`, `_foundry-data(-v14)`,
  `__foundryModules(-v14)`.

## This repo's specifics

- Module id `pf2e-module-template`; flags, settings, the socket channel (`module.<id>`),
  and pack names (`<id>.<pack>`) all key off it. Use `const MODULE_ID`.
- Public API: `game.modules.get(MODULE_ID).api = {...}` (cast — `api` isn't typed on `Module`).
- Strings: `lang/en.json` under `pf2e-module-template.*`; `game.i18n.localize/format`. No hard-coded strings.
- compatibility `minimum "13"`, `verified "14"`; author `Mark Pearce`, org `rune-goblin`, proprietary license.
- Release: tag `vX.Y.Z` → `release.yml` stamps the version, type-checks, builds, publishes `module.json` + `pf2e-module-template.zip`.

## Gotchas

- Close Foundry before any `fvtt package` op (LevelDB lock). Pack workflow: skill's `packs-cli.md`.
- `dist/` is gitignored — loaded via the dev symlink after build; CI builds it for releases.
- Vite does **not** type-check — run `npm run check` (the release workflow does too).
- Foundry hot-reloads `.hbs`/`.css`/`.json`, not esmodules — reload the browser after a `.js`/`.svelte` rebuild.
- Persist state in document flags, not raw socket; raw socket for transient signals only (skill's `multi-client-sync.md`).
