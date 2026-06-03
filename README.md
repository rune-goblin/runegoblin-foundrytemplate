# PF2e Module Template

A starting point for Pathfinder 2e Foundry VTT modules. Hybrid: compendium
content (`packs/`) plus a scripted esmodule (`src/`) with a **Svelte 5** UI
mounted in an **ApplicationV2** shell.

- System: `pf2e`
- Foundry: v13 minimum, verified on v14
- Build: TypeScript + Svelte 5 + Vite

<!-- TEMPLATE:START -->
## Use this template

This repo is a GitHub **template repository**. Create a new module from it, then run
`npm run init` to rename it to your module id.

**GitHub CLI (recommended)** — creates the repo, clones it, and gives it its own
history and remote in one step:

```bash
gh repo create rune-goblin/pf2e-my-module \
  --template rune-goblin/runegoblin-foundrytemplate \
  --private --clone
cd pf2e-my-module
npm run init -- pf2e-my-module --title "PF2e My Module"
npm install && npm run build
```

**GitHub UI** — click **Use this template → Create a new repository**, then:

```bash
git clone git@github.com:rune-goblin/pf2e-my-module.git
cd pf2e-my-module
npm run init -- pf2e-my-module --title "PF2e My Module"
npm install && npm run build
```

**Plain clone** — no new GitHub repo yet; start fresh history yourself:

```bash
git clone git@github.com:rune-goblin/runegoblin-foundrytemplate.git pf2e-my-module
cd pf2e-my-module
npm run init -- pf2e-my-module --title "PF2e My Module"
rm -rf .git && git init -b main
npm install && npm run build
```

`npm run init -- <id> [--title "..."]` rewrites the id/title across `module.json`,
`package.json`, `src/`, `lang/`, `scripts/`, the release workflow, and this README,
then deletes itself. It leaves `.claude/` (the bundled skill) untouched, and derives
`--title` from the id when omitted.

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
scripts/setup.ts     dev path resolution + symlink setup (run via node's TS type-stripping)
```

## Develop

```bash
npm install
npm run build      # emits dist/pf2e-module-template.{js,css}
npm run dev        # vite build --watch
npm run check      # svelte-check + tsc --noEmit (foundry-pf2e types)
npm run setup      # resolve dev paths, then symlink this repo into Foundry
```

### `npm run setup`

A one-shot dev linker. It works out three things — prompting only when it can't
detect them — then symlinks the repo into Foundry and pulls reference sources in:

1. **Your Foundry Data dir.** Detected per-platform (macOS `~/Library/Application
   Support/FoundryVTT{,-v14}/Data`, Windows `%LOCALAPPDATA%\FoundryVTT\Data`, Linux
   `~/.local/share/FoundryVTT/Data`), or via a `FOUNDRY_DATA` env var. If none
   resolve, it asks you to paste the path.
2. **The PF2e system source** (optional — types also come from the `foundry-pf2e`
   dep). If it can't find a checkout it offers to **clone** `foundryvtt/pf2e`
   (defaulting beside this repo), **point** at an existing one, or **skip**.
3. **The symlinks.** It then asks before creating them (say no, or pass `--no-link`,
   to resolve paths without touching the filesystem).

Resolved paths are cached in `.dev-paths.json` (gitignored) so re-runs don't
re-prompt. Flags: `--reconfigure` (ask again), `--no-link` (paths only), `--yes`
(non-interactive — link whatever was detected). It links into **every** Foundry
instance it finds, and creates these gitignored references for reading (not
distribution):

| In-repo link            | Points at                                  |
|-------------------------|--------------------------------------------|
| `_pf2e-source`          | your `pf2e` checkout (system source / types) |
| `_foundry-data-v14`     | `FoundryVTT-v14/Data`                       |
| `_foundry-data`         | `FoundryVTT/Data`                           |
| `__foundryModules-v14`  | `FoundryVTT-v14/Data/modules`              |
| `__foundryModules`      | `FoundryVTT/Data/modules`                  |

After `npm run build`, enable the module in a world and reload — the symlink
serves `dist/` live. Foundry hot-reloads `.hbs`/`.css`/`.json` but not esmodules,
so reload the browser after a `.js`/`.svelte` rebuild.

## AI tooling

This repo ships a project skill at `.claude/skills/foundry-pf2e/` — the Foundry/PF2e
authoring rules and reference (API, packs, Svelte-in-ApplicationV2, the Vite build,
multi-client sync). Claude Code loads it automatically when you work here, and `npm run
init` carries it into new modules.

For Svelte, the skill keeps only the Foundry integration and defers the language to
Svelte's own AI tooling (`@sveltejs/mcp`). Two ways to use it:

- **No setup (on demand):** validate a component after editing it —
  `npx -y @sveltejs/mcp svelte-autofixer src/ui/Foo.svelte` — or fetch language docs
  with `npx -y @sveltejs/mcp get-documentation <sections>`.
- **As an MCP server (optional, persistent):** register it once so the tools are in
  every session.

  ```bash
  claude mcp add -s user svelte -- npx -y @sveltejs/mcp     # all your projects
  # or commit it for collaborators (writes .mcp.json to this repo):
  claude mcp add -s project svelte -- npx -y @sveltejs/mcp
  ```

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
