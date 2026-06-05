# Changelog

Notable changes to **this template**. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions track the template's
own `package.json`.

This file documents the template itself — `npm run init` removes it so each module
generated from the template starts its own history.

## [Unreleased]

### Added

- `fvtt` CLI (`@foundryvtt/foundryvtt-cli`) as a pinned dev dependency, with `npm run
  pack` / `npm run unpack` scripts — no global install needed, reproducible in CI.
- `tsconfig.node.json` and a third `npm run check` pass that type-check the tooling
  (`vite.config.ts`, `svelte.config.ts`, `scripts/*.ts`), backed by `@types/node`. The
  "TypeScript everywhere, including tooling" rule is now actually enforced.
- `.nvmrc` (Node 22.12.0); the release workflow reads it via `node-version-file`, so CI
  and `engines.node` no longer drift.
- `npm run init` fills the `module.json` author and `url`/`manifest`/`download` URLs from
  your GitHub owner (auto-detected from the repo's `origin`, or `--org`) and `git config
  user.name` (or `--author`). The committed template ships `<your-org>`/`<your-name>`
  placeholders — no personal identity baked in.

### Changed

- `npm run setup` now resolves a single Foundry data dir and creates three
  consistently named reference links (`_pf2e-source`, `_foundry-data`,
  `_foundry-modules`). Dropped the multi-version (v13/v14) scan and the `-v14` link
  suffix, matching the template's v14-only stance.
- Pinned the `foundry-pf2e` dev dependency to a commit (no tags exist upstream) so
  `npm ci` is reproducible and can't shift under a force-push.

### Fixed

- `ExampleApp` mounted a fresh Svelte component on every ApplicationV2 render without
  unmounting the previous one — a leak (and loss of reactive state) on any re-render.
  It now mounts once and reuses the node. Same fix applied to the bundled skill's
  documented pattern.
- `.gitattributes` marked pack *sources* (`packs/_source`) as binary alongside the built
  LevelDB, killing diffs on the hand-edited JSON. Sources are now text + diffable; only
  built packs stay binary.

## [0.1.0]

### Added

- Initial template: v14-only TypeScript + Svelte 5 + Vite stack; a Svelte 5 UI mounted
  in an ApplicationV2 shell; compendium pack workflow; `npm run init` rename; `npm run
  setup` dev linking; a tag-driven GitHub release workflow; and the bundled
  `foundry-pf2e` Claude Code skill.
