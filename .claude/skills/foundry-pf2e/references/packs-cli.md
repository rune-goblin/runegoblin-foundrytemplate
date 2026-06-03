# Compendium packs (fvtt CLI)

Packs are LevelDB databases under `packs/`. Edit them as JSON sources in
`packs/_source/<name>/` and compile with the `fvtt` CLI.

## LevelDB is locked while Foundry runs

**Close Foundry before any `fvtt package` op** — the LevelDB `LOCK` blocks it otherwise.

## Pack / unpack

The CLI ships as a dev dependency, wrapped as `npm run pack` / `npm run unpack` (or call
`npx fvtt` directly).

```bash
# JSON sources -> LevelDB pack
npm run pack   -- <name> --in packs/_source/<name> --out packs

# LevelDB pack -> JSON sources (after editing content inside Foundry)
npm run unpack -- <name> --in packs --out packs/_source/<name>
```

Pass explicit `--in/--out` so the CLI's configured `dataPath` doesn't matter (it may
point at a different Foundry install).

## What to track and register

- Track `packs/_source/*.json`. The LevelDB `LOCK`/`LOG*` files are gitignored;
  `.gitattributes` marks `packs/*/** binary`.
- Every packed doc needs a `_key` of the form `!collection!id` (e.g.
  `!scenes!abc123…`).
- Register each pack in `module.json` `"packs"`:

```json
{ "name": "<name>", "label": "Human Label", "path": "packs/<name>", "type": "Scene" }
```

Actor/Item packs also need `"system": "pf2e"`.

## Runtime access

Reading packs at runtime is the `game.packs.get('<id>.<name>')` API — see
`foundry-api.md`.
