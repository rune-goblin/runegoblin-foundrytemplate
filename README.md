# PF2e Module Template

A starting point for Pathfinder 2e Foundry VTT modules. Hybrid: compendium
content (`packs/`) plus a scripted esmodule (`src/`) with a **Svelte 5** UI
mounted in an **ApplicationV2** shell.

- System: `pf2e`
- Foundry: v13 minimum, verified on v14
- Build: TypeScript + Svelte 5 + Vite

<!-- TEMPLATE:START -->
## Use this template

Clone it, then rename everything to your new module id in one shot:

```bash
npm run init -- pf2e-my-module --title "PF2e My Module"
# --title is optional; it's derived from the id when omitted
```

`init` rewrites the id/title across `module.json`, `package.json`, `src/`, `lang/`,
`scripts/`, the release workflow, and this README, then deletes itself. Afterward:

```bash
rm -rf .git && git init -b main   # fresh history
npm install
npm run build
```

<!-- TEMPLATE:END -->
## Layout

```
module.json          manifest (esmodules + styles + packs + pf2e relationship)
src/                 TypeScript + Svelte source (entry: src/index.ts)
  index.ts           registers hooks, exposes game.modules.get(id).api
  ui/ExampleApp.ts   ApplicationV2 shell that mounts a Svelte component
  ui/Example.svelte  sample Svelte 5 component (runes)
  styles.css         global styles, bundled to dist/pf2e-module-template.css
  app.d.ts           ambient *.svelte module declaration
dist/                build output (gitignored) — what module.json loads
lang/en.json         localization
packs/               LevelDB compendium packs (built)
  _source/           human-readable JSON pack sources (tracked; packed with fvtt)
scripts/link-dev.ts  sandbox symlink setup (run via node's TS type-stripping)
```

## Develop

```bash
npm install
npm run build      # emits dist/pf2e-module-template.{js,css}
npm run dev        # vite build --watch
npm run check      # svelte-check + tsc --noEmit (foundry-pf2e types)
npm run link-dev   # symlink this repo into Foundry + pull reference sources in
```

`npm run link-dev` symlinks the repo into **both** Foundry instances'
`Data/modules/pf2e-module-template`, and pulls these gitignored references into
the repo for reading (not for distribution):

| In-repo link            | Points at                                  |
|-------------------------|--------------------------------------------|
| `_pf2e-source`          | `repos/pf2e` (PF2e system source / types)  |
| `_foundry-data-v14`     | `FoundryVTT-v14/Data`                       |
| `_foundry-data`         | `FoundryVTT/Data`                           |
| `__foundryModules-v14`  | `FoundryVTT-v14/Data/modules`              |
| `__foundryModules`      | `FoundryVTT/Data/modules`                  |

After `npm run build`, enable the module in a world and reload — the symlink
serves `dist/` live. Foundry hot-reloads `.hbs`/`.css`/`.json` but not esmodules,
so reload the browser after a `.js`/`.svelte` rebuild.

## UI: Svelte 5 in ApplicationV2

The window is a thin `ApplicationV2` subclass; Svelte does the rendering. In
`_renderHTML` you `mount()` the component into a detached element, `_replaceHTML`
inserts it, and `_preClose` calls `unmount()`. See `src/ui/ExampleApp.ts`. Open
the sample window from the console: `game.modules.get('pf2e-module-template').api.open()`.

## Compendium packs (fvtt CLI)

Foundry must be **closed** while packing/unpacking (LevelDB is locked when it runs).

```bash
fvtt package pack <pack-name>   --in packs/_source/<pack-name> --out packs
fvtt package unpack <pack-name> --in packs --out packs/_source/<pack-name>
```

Add the pack to `module.json` `"packs"`; Actor/Item packs also need `"system": "pf2e"`.

## Release

Push a tag `vX.Y.Z`; `.github/workflows/release.yml` stamps the version, type-checks,
builds, and publishes a GitHub release with `module.json` + `pf2e-module-template.zip`.
