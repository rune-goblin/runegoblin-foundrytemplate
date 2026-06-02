# pf2e-module-template — project rules

A Foundry VTT **Pathfinder 2e** module template. Hybrid: compendium content
(`packs/`) plus a scripted esmodule (`src/`). Build with TypeScript + **Svelte 5**
+ Vite (`src/index.ts` → `dist/pf2e-module-template.js` + `.css`). UI is Svelte
mounted in an ApplicationV2 shell. `module.json` is the manifest Foundry loads.

New module from this template: `npm run init -- <new-id> [--title "..."]` rewrites
the id/title everywhere and deletes the init script. See README.

Code style: see the global `~/.claude/CLAUDE.md` — comment only the non-obvious *why*.

## Hard rule: v14 only, no v1 APIs

Target Foundry **v14** and use only current APIs. Never touch the v1 namespace or
deprecated globals: no `foundry.appv1`; no bare `Application` / `FormApplication` /
`Dialog`; no bare `mergeObject` / `duplicate` / `getProperty` (use the `foundry.*`
forms). Every window is an **ApplicationV2** (`foundry.applications.api.ApplicationV2`)
shell; dialogs are **DialogV2** (`foundry.applications.api.DialogV2`). Render UI by
mounting Svelte into the shell (below), or `HandlebarsApplicationMixin` for static
markup. Structured data is `foundry.abstract.DataModel` with `defineSchema()`. If a
class exists only in v1, find its V2 replacement first.

## UI: Svelte 5 in ApplicationV2

The shell is a thin `ApplicationV2` subclass; Svelte renders the content. Pattern in
`src/ui/ExampleApp.ts`:
- `_renderHTML()` — `mount(Component, { target: el, props })` into a detached element, return it.
- `_replaceHTML(result, content)` — `content.replaceChildren(result)`.
- `_preClose()` — `unmount(this.#component)` to tear the component down.

Use Svelte 5 runes (`$state`, `$props`, `$derived`, `$effect`), `mount`/`unmount`
from `svelte` (not the Svelte 4 `new Component()` / `$destroy()` forms). `.svelte`
imports resolve in `.ts` via the ambient shim in `src/app.d.ts`. Component `<style>`
blocks are scoped and bundled into the single emitted CSS.

## Build & dev

- `npm run build` — Vite lib build → `dist/` (referenced by `module.json`). `dist/` is gitignored; build before enabling a world, and after edits.
- `npm run dev` — `vite build --watch`. `npm run check` — `svelte-check` + `tsc --noEmit` (`foundry-pf2e` types).
- `npm run link-dev` — symlinks the repo into both Foundry instances' `Data/modules/` and pulls reference sources in (gitignored `_*` / `__*`). Idempotent.
- Active install: **`FoundryVTT-v14`** (`~/Library/Application Support/FoundryVTT-v14/Data`). The `fvtt` CLI's `dataPath` points at the *other* install (`FoundryVTT`); pack commands pass explicit `--in/--out`, so it matters only for `fvtt package workon`.
- References: `_pf2e-source`, `_foundry-data(-v14)`, `__foundryModules(-v14)`.

**Vite emits two files** — `dist/pf2e-module-template.js` and `.css`. The CSS is the bundle of `src/index.ts`'s `import './styles.css'` plus every Svelte component's scoped `<style>`; a stylesheet outside the JS import graph won't bundle. **`.hbs` templates and other static assets are not bundled.** ApplicationV2 `PARTS` (Handlebars path) load them by URL, e.g. `template: 'modules/pf2e-module-template/templates/foo.hbs'`. Keep them in a repo-root `templates/`, register partials with `foundry.applications.handlebars.loadTemplates([...])` on `init`, and add the dir to the release zip in `release.yml` (it zips `dist lang packs` only — a new dir ships nothing).

**Path alias** `@/*` → `src/*` lives in both `tsconfig.json` and `vite.config.ts`. Keep them in sync; a tsconfig-only alias compiles but breaks the build.

## Compendium packs (fvtt CLI)

LevelDB locks while Foundry runs — close Foundry before packing or unpacking.

```bash
fvtt package pack <name>   --in packs/_source/<name> --out packs              # JSON → LevelDB
fvtt package unpack <name> --in packs               --out packs/_source/<name>  # LevelDB → JSON (after editing in Foundry)
```

Track `packs/_source/*.json`; LevelDB `LOCK`/`LOG*` are gitignored (`.gitattributes`: `packs/*/** binary`). Every doc needs a `_key` (`!collection!id`). Register packs in `module.json.packs`; Actor/Item packs also set `"system": "pf2e"`.

## Foundry API (v13/v14) — quick reference

**Docs:** the official reference is **https://foundryvtt.com/api/** (select the v14 build) for runtime classes, hooks, and signatures. The `foundry-pf2e` typedefs (`node_modules/foundry-pf2e/types/`) are what `tsc` checks and add PF2e types. On conflict, trust the typedefs for what compiles, the docs for what runs. Everything lives under `foundry.*`; bare globals are off-limits.

**Ambient globals (never import):** `game`, `ui`, `canvas`, `CONFIG`, `CONST`, `Hooks`, `foundry`, `Roll` — supplied by the `foundry-pf2e` types.

**Namespaces:** `foundry.utils` (`mergeObject`, `deepClone`, `duplicate`, `randomID`, `getProperty`/`setProperty`, `expandObject`/`flattenObject`, `debounce`, `fromUuid`/`fromUuidSync`), `foundry.documents` (Actor, Item, Scene, JournalEntry, Macro, …), `foundry.abstract` (`Document`, `DataModel`, `TypeDataModel`), `foundry.applications` (UI), `foundry.data.fields` (schema fields), `foundry.canvas`, `foundry.dice.Roll`, `foundry.helpers`.

**`game.*`:** `game.user`/`game.userId`/`game.user.isGM`, `game.users`, `game.actors`, `game.items`, `game.scenes`, `game.journal`, `game.macros`, `game.modules.get(id)?.version`, `game.settings`, `game.socket`, `game.i18n`, `game.packs.get('module.id.pack')`, `game.ready`. In a PF2e world `game` is typed `GamePF2e`.

**Hooks** (`Hooks.on/once/off/call/callAll`):
- Lifecycle: `init` (register settings/classes) → `i18nInit` → `setup` → `ready` (game state safe) → `canvasReady`.
- Documents: `create/update/delete{Actor,Item,Scene,…}` and `preCreate/preUpdate/preDelete*` (return `false` to cancel). `updateUser`, `userConnected`.
- ApplicationV2: `render{ClassName}(app, html, context, options)`, `close{ClassName}`.

**Documents & flags:** `Doc.create(data)`, `doc.update(changes)`, `doc.delete()`; embedded via `create/update/deleteEmbeddedDocuments(name, …)`. Module state lives in **flags**: `doc.getFlag('pf2e-module-template', key)` / `setFlag(...)` / `unsetFlag(...)` (stored at `doc.flags['pf2e-module-template']`). For structured data use `foundry.abstract.DataModel` + `static defineSchema()` with `foundry.data.fields.*`.

**Settings:** `game.settings.register('pf2e-module-template', key, { scope: 'world'|'client'|'user', config, type, default, onChange })`, then `get/set`. `world` = shared (GM writes); `client` = per-browser; `user` = per-user. `registerMenu` for config apps.

**Packs:** `const pack = game.packs.get('pf2e-module-template.<name>')`; `await pack.getIndex()`, `pack.getDocument(id)`, `pack.getDocuments()`, `pack.importAll()`.

**Public API:** expose it the Foundry way — `game.modules.get(MODULE_ID).api = {...}` (on `ready`, or earlier if dependents need it). Don't attach to `game`. Consumers read `game.modules.get('pf2e-module-template')?.api`.

**Localization:** strings live in `lang/en.json` under `pf2e-module-template.*`; read with `game.i18n.localize(key)` or `game.i18n.format(key, data)`. `lang/` ships verbatim and is in the release zip. No hard-coded user-facing strings.

## Multi-client sync

Replicate this when state must stay consistent across clients. The runegoblin
`pf2e-reignmaker` module is the worked reference (Svelte stores fed by document hooks).

**Two channels:**

1. **Document updates — the default.** Persist state in a flag (e.g. `actor.setFlag('pf2e-module-template', 'state', data)`). A GM write broadcasts `updateActor` to every client; each `Hooks.on('updateActor', …)` refreshes its store. The update fans out on its own — don't socket it. This is authoritative.
2. **Raw socket — transient signals only** (force-reload, console-clear, a popup on all clients). Needs `"socket": true` in `module.json`.

**GM-authority request/reply** (only the GM writes world documents):
- Channel: `'module.pf2e-module-template'` (always `module.<id>`).
- On every client: `game.socket.on('module.pf2e-module-template', handleMessage)`; emit with `game.socket.emit(...)`.
- A non-GM emits `{ action, data, senderId, requestId, kind: 'request' }` and awaits a reply. The GM runs the handler, writes the document, and emits `{ kind: 'result'|'error', requestId, targetId: senderId, data }`. The client whose `game.user.id === targetId` resolves its pending promise (keyed by `requestId`); time out after ~10s. A GM caller runs the handler locally instead.
- **Foundry never echoes `emit` to the sender.** So a sender that must react to its own broadcast calls the handler directly, and request/reply needs the explicit reply.

**Race safety:** flags carry a `version`; a write sends `expectedVersion`, the GM rejects a stale one (`VersionConflictError`) behind a per-document lock, and the caller re-reads, recomputes, retries. Add this only with concurrent writers.

**Readiness gate:** socket handlers `await` an init promise (resolved on `ready`, once the backing document loads) so startup-buffered messages don't hit null state.

## Conventions across the runegoblin modules

- **Simple content modules** (arashi-schooner, bookshop, coin-puzzle): `module.json` + `packs/` + `LICENSE` + `README` + release workflow. No build.
- **Scripted/PF2e modules** (pf2e-reignmaker, this template): add `esmodules`, `styles`, `socket`, `relationships.systems` (`pf2e`). This template uses `compatibility.minimum "13"`, `verified "14"`.
- Author `Mark Pearce` (`discord: "Mark Pearce#2772"`); org `rune-goblin`; license proprietary.
- Release: push tag `vX.Y.Z` → `release.yml` stamps the version into `module.json`, type-checks, builds, and publishes `module.json` + `pf2e-module-template.zip`.

## Gotchas

- Close Foundry before any `fvtt package` op (LevelDB lock).
- `dist/` is gitignored — Foundry loads it via the dev symlink after `npm run build`; CI builds it for releases.
- Persist state in document flags, not the raw socket; raw socket for transient signals only.
- Vite does **not** type-check — run `npm run check` (`svelte-check` + `tsc`). The release workflow runs it before building.
- Foundry hot-reloads `.hbs`/`.css`/`.json`, not esmodules — reload the browser after a `.js`/`.svelte` rebuild.
