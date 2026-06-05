# PF2e Module Template

A starting point for **Pathfinder 2e Foundry VTT** modules. Ship compendium content
(`packs/`) and a scripted esmodule (`src/`) — a **Svelte 5** UI in an **ApplicationV2**
shell — from one repo.

- System: `pf2e`
- Foundry: v14 minimum, verified on v14
- Build: TypeScript + Svelte 5 + Vite

## What you get

- **FoundryVTT v14 Stack.** TypeScript runs source and tooling alike: `vite.config.ts`,
  `svelte.config.ts`, and `scripts/*.ts` run on Node ≥ 22.12, with no
  `tsx` or `ts-node`. No v1 Foundry APIs — ApplicationV2, DialogV2, and DataModel only.

- **Svelte 5 in ApplicationV2, wired up.** A working window (`src/ui/ExampleApp.ts`)
  `mount()`s a runes component and `unmount()`s it on close. Open it from the console:
  `game.modules.get('pf2e-module-template').api.open()`.

- **Vite Hot Module Reload.** `src/index.ts` compiles to `dist/<id>.{js,css}`, the artifacts
  `module.json` loads. `npm run dev` serves with hot module reload (HMR); `npm run check` runs `svelte-check` and `tsc`.

- **Compendium packs.** `packs/_source/` JSON, tracked in git and packed to LevelDB with
  the bundled `fvtt` CLI (`npm run pack`).

- **One-command rename.** `npm run init -- <new-id> [--title "..."]` rewrites the id and
  title across the manifest, sources, flags, socket channel, and pack names, then deletes
  itself.

- **Dev setup that finds Foundry.** `npm run setup` detects your Foundry data dir from
  `options.json`, symlinks the module in, and pulls reference sources. It prompts only when
  it cannot resolve a path itself.

- **Release on tag.** Push `vX.Y.Z`; `release.yml` stamps the version, type-checks, builds,
  and publishes a GitHub release with `module.json` and the module zip.

- **AI authoring built in.** A bundled `foundry-pf2e` Claude Code skill (`.claude/skills/`)
  carries the Foundry/PF2e API, packs, Svelte-in-ApplicationV2, build, and sync rules into
  every module you make from this template.

- **Sensible defaults.** Localization (`lang/en.json`), a public `api` surface, the
  `module.<id>` socket channel, and license and author metadata all key off the module id.

<!-- TEMPLATE:START -->

## Starting with Claude Code

In a new session, fill in the blanks and paste this:

```text
Set up a new Foundry VTT PF2e module from this template:
https://github.com/rune-goblin/runegoblin-foundrytemplate

GitHub repo:  https://github.com/<account> or local only
local path:   <path to folder containing repo, e.g. ~/repos/pf2e-my-module>
module id:    <my-module>   (lowercase + hyphens; usually the repo name)
title:        <My Module>

Follow the README's "Use this template manually" section. Default to the recommended
GitHub CLI flow (gh repo create <account>/<my-module> --template
rune-goblin/runegoblin-foundrytemplate --private --clone) unless I wrote "local only",
in which case use the local-only flow. Then, in order: npm run init, npm install, and
npm run build. If Foundry is installed locally, run npm run setup too. Then run
npm run check to confirm it's green; for a GitHub repo, also confirm module.json
shows my owner/author rather than the <your-org>/<your-name> placeholders. Finally,
tell me how to open the example window. Ask first if anything is unclear.
```

## Use this template manually

This is a GitHub **template repository**, and like the prompt above you pick one of two
paths: create **a GitHub repo** (recommended — `npm run init` auto-fills your owner and
author from the repo's `origin`) or go **local only**. Either way, `npm run init` renames
the module.

**GitHub repo — CLI (recommended)** — create, clone, and detach history in one step:

```bash
gh repo create <your-org>/pf2e-my-module \
  --template rune-goblin/runegoblin-foundrytemplate \
  --private --clone
cd pf2e-my-module
npm run init -- pf2e-my-module --title "PF2e My Module"
npm install && npm run build && npm run check
```

**GitHub repo — UI** — **Use this template → Create a new repository**, then:

```bash
git clone git@github.com:<your-org>/pf2e-my-module.git
cd pf2e-my-module
npm run init -- pf2e-my-module --title "PF2e My Module"
npm install && npm run build && npm run check
```

**Local only** — no GitHub repo yet, so pass your owner with `--org` (or add it later —
`npm run setup` offers to, once an `origin` exists):

```bash
git clone git@github.com:rune-goblin/runegoblin-foundrytemplate.git pf2e-my-module
cd pf2e-my-module
rm -rf .git && git init -b main                                         # detach template history first
npm run init -- pf2e-my-module --title "PF2e My Module" --org <your-org>
npm install && npm run build && npm run check
```

`npm run init -- <id> [--title "..."] [--org <github-owner>] [--author "Name"]` rewrites the
id and title across the repo, then removes itself and the template's `CHANGELOG.md` (your
module starts its own history). It fills the `module.json` author and `url`/`manifest`/`download`
URLs from your GitHub owner (auto-detected from the repo's `origin` remote) and `git config
user.name`; pass `--org`/`--author` to override, or when there's no `origin` yet (the local-only
clone above detaches it). It leaves `.claude/` (the bundled skill) alone and derives the title
from the id when omitted.

Then `npm run setup` links the module into Foundry for local development — see [Develop](#develop).

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

Set up once — needs Node ≥ 22.12 and a local Foundry install. The
[`fvtt`](https://github.com/foundryvtt/foundryvtt-cli) CLI (for packs) ships as a dev
dependency, so `npm install` brings it:

```bash
npm install
npm run setup      # symlink this module into Foundry (see below)
npm run build      # emit dist/, then enable the module in a world
```

Then:

```bash
npm run dev        # HMR dev server (Vite reverse-proxies Foundry)
npm run watch      # vite build --watch (rebuild dist/ on save, no HMR)
npm run check      # svelte-check + tsc --noEmit
```

**HMR** runs Vite on `:30001` as a reverse proxy *in front of* a running Foundry. Foundry
must already be running, and the esmodule loads only inside an **active world** — so
there's nothing to hot-swap until you launch one:

1. Start Foundry, then **Launch World** (Setup → a world with this module enabled). First
   time only: launch the world once on `:30000`, enable the module under *Manage Modules*,
   and reload — after that it stays on.
2. `npm run dev` (leave Foundry running).
3. Open **http://localhost:30001/game** — *not* `:30000` — and log in.

Now editing a `.svelte` component hot-swaps in place, keeping state. Editing
`src/index.ts` (hooks/bootstrap) triggers a full page reload instead — that's expected.

Prefer the plain bundle? `npm run watch` keeps the old flow: it rebuilds `dist/` on
save; browse `:30000` and reload the browser after a `.js`/`.svelte` rebuild (Foundry
hot-reloads `.hbs`/`.css`/`.json` in place, but not esmodules).

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

| In-repo link       | Points at                  |
|--------------------|----------------------------|
| `_pf2e-source`     | your `pf2e` checkout       |
| `_foundry-data`    | `<FoundryData>/Data`       |
| `_foundry-modules` | `<FoundryData>/Data/modules` |

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

The `fvtt` CLI is a dev dependency, wrapped as `npm run pack` / `npm run unpack`. Close
Foundry first — LevelDB locks while it runs.

```bash
npm run pack   -- <pack-name> --in packs/_source/<pack-name> --out packs
npm run unpack -- <pack-name> --in packs --out packs/_source/<pack-name>
```

Add the pack to `module.json` `"packs"`; Actor/Item packs also need `"system": "pf2e"`.

## Release

Push a tag `vX.Y.Z`; `release.yml` stamps the version, type-checks, builds, and
publishes a GitHub release with `module.json` + `pf2e-module-template.zip`.

## License

This template's own code is [MIT](LICENSE) — use, modify, and build on it freely.

The MIT license covers **only the template**. It does not grant any rights to Paizo
intellectual property. Pathfinder rules text, names, and other Paizo content require
their own license — see <https://paizo.com/licenses>.

If you include any code from the PF2e system, that code is distributed under Apache 2.0;
comply with its terms — see
<https://github.com/foundryvtt/pf2e/blob/v14-dev/LICENSE>.
