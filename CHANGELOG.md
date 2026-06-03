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

### Changed

- `npm run setup` now resolves a single Foundry data dir and creates three
  consistently named reference links (`_pf2e-source`, `_foundry-data`,
  `_foundry-modules`). Dropped the multi-version (v13/v14) scan and the `-v14` link
  suffix, matching the template's v14-only stance.

## [0.1.0]

### Added

- Initial template: v14-only TypeScript + Svelte 5 + Vite stack; a Svelte 5 UI mounted
  in an ApplicationV2 shell; compendium pack workflow; `npm run init` rename; `npm run
  setup` dev linking; a tag-driven GitHub release workflow; and the bundled
  `foundry-pf2e` Claude Code skill.
