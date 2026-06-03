# PF2e Module Template

Pathfinder 2e Foundry VTT module template. Hybrid: compendium content (`packs/`)
plus a scripted esmodule (`src/`) — a **Svelte 5** UI in an **ApplicationV2** shell.

- System: `pf2e`
- Foundry: v13 minimum, verified on v14
- Build: TypeScript + Svelte 5 + Vite

<!-- TEMPLATE:START -->
## Use this template

This is a GitHub **template repository**. Create a module from it, then `npm run init`
to rename it.

**GitHub CLI (recommended)** — create, clone, and detach history in one step:

```bash
gh repo create rune-goblin/pf2e-my-module \
  --template rune-goblin/runegoblin-foundrytemplate \
  --private --clone
cd pf2e-my-module
npm run init -- pf2e-my-module --title "PF2e My Module"
npm install && npm run build
```

**GitHub UI** — **Use this template → Create a new repository**, then:

```bash
git clone git@github.com:rune-goblin/pf2e-my-module.git
cd pf2e-my-module
npm run init -- pf2e-my-module --title "PF2e My Module"
npm install && npm run build
```

**Plain clone** — start your own history:

```bash
git clone git@github.com:rune-goblin/runegoblin-foundrytemplate.git pf2e-my-module
cd pf2e-my-module
npm run init -- pf2e-my-module --title "PF2e My Module"
rm -rf .git && git init -b main
npm install && npm run build
```

`npm run init -- <id> [--title "..."]` rewrites the id and title across the repo, then
deletes itself. It leaves `.claude/` (the bundled skill) alone and derives the title
from the id when omitted.

<!-- TEMPLATE:END -->
## Layout

```
module.json          manifest (esmodules, styles, packs, pf2e relationship)
src/                 TypeScript + Svelte source (entry: src/index.ts)
  index.ts           registers hooks, exposes game.modules.get(id).api
  ui/ExampleApp.ts   ApplicationV2 shell that mounts a Svelte component
  ui/Example.svelte  sample Svelte 5 component (runes)
  styles.css         global styles → dist/pf2e-module-template.css
  app.d.ts           ambient *.svelte declaration
dist/                build output (gitignored) — what module.json loads
lang/en.json         localization
packs/               LevelDB compendium packs (built)
  _source/           JSON pack sources (tracked; packed with fvtt)
scripts/setup.ts     dev symlink setup
```

## Develop

Set up once — needs Node ≥ 22.12, a local Foundry install, and (for packs) the
[`fvtt`](https://github.com/foundryvtt/foundryvtt-cli) CLI:

```bash
npm install
npm run setup      # symlink this module into Foundry (see below)
npm run build      # emit dist/, then enable the module in a world
```

Then:

```bash
npm run dev        # vite build --watch
npm run check      # svelte-check + tsc --noEmit
```

Foundry hot-reloads `.hbs`/`.css`/`.json` but not esmodules — reload the browser
after a `.js`/`.svelte` rebuild.

### `npm run setup`

Links the repo into Foundry and pulls reference sources in. It resolves three things,
prompting only when it can't detect them:

- **Foundry data dir** — from Foundry's `Config/options.json` (`dataPath`) in the
  default user-data folder (macOS `~/Library/Application Support/FoundryVTT*`, Windows
  `%LOCALAPPDATA%\FoundryVTT*`, Linux `~/.local/share/FoundryVTT*`); `FOUNDRY_DATA`
  overrides. It links an existing dir, never creates one.
- **PF2e source** (optional — types also come from the `foundry-pf2e` dep) — clone
  `foundryvtt/pf2e`, point at a checkout, or skip.
- **Symlinks** — confirms before writing them.

Resolved paths cache to `.dev-paths.json` (gitignored). Flags: `--reconfigure` (re-ask),
`--no-link` (paths only), `--yes` (non-interactive). The gitignored links it creates:

| In-repo link            | Points at                     |
|-------------------------|-------------------------------|
| `_pf2e-source`          | your `pf2e` checkout          |
| `_foundry-data-v14`     | `FoundryVTT-v14/Data`         |
| `_foundry-data`         | `FoundryVTT/Data`             |
| `__foundryModules-v14`  | `FoundryVTT-v14/Data/modules` |
| `__foundryModules`      | `FoundryVTT/Data/modules`     |

## AI tooling

A project skill at `.claude/skills/foundry-pf2e/` holds the Foundry/PF2e authoring rules
and reference (API, packs, Svelte-in-ApplicationV2, the Vite build, sync). Claude Code
loads it here automatically, and `npm run init` carries it into new modules.

It defers the Svelte language to `@sveltejs/mcp`. Run it on demand —
`npx -y @sveltejs/mcp svelte-autofixer src/ui/Foo.svelte` — or register it once:

```bash
claude mcp add -s user svelte -- npx -y @sveltejs/mcp     # all your projects
claude mcp add -s project svelte -- npx -y @sveltejs/mcp  # or commit for collaborators
```

## UI: Svelte 5 in ApplicationV2

The window is a thin `ApplicationV2` subclass; Svelte renders. `_renderHTML` calls
`mount()` into a detached element, `_replaceHTML` inserts it, `_preClose` calls
`unmount()`. See `src/ui/ExampleApp.ts`. Open the sample from the console:
`game.modules.get('pf2e-module-template').api.open()`.

## Compendium packs (fvtt CLI)

Close Foundry first — LevelDB locks while it runs.

```bash
fvtt package pack <pack-name>   --in packs/_source/<pack-name> --out packs
fvtt package unpack <pack-name> --in packs --out packs/_source/<pack-name>
```

Add the pack to `module.json` `"packs"`; Actor/Item packs also need `"system": "pf2e"`.

## Release

Push a tag `vX.Y.Z`; `release.yml` stamps the version, type-checks, builds, and
publishes a GitHub release with `module.json` + `pf2e-module-template.zip`.
