// Build every compendium pack from its JSON source: packs/_source/<name> → packs/<name>.
// Run by `npm run build`, so the shipped LevelDB always matches the tracked sources and the
// current module id — built packs are gitignored, like dist/. If Foundry holds a pack open
// (LevelDB lock), the existing build is kept and we warn rather than fail; close Foundry to
// refresh it. Manual single-pack rebuild: `npm run pack -- <name> --in packs/_source/<name> --out packs`.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const sourceRoot = join(process.cwd(), 'packs', '_source');
if (!existsSync(sourceRoot)) process.exit(0);

const names = readdirSync(sourceRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

for (const name of names) {
  try {
    execSync(`fvtt package pack ${name} --in packs/_source/${name} --out packs`, { stdio: 'inherit' });
  } catch {
    console.warn(`⚠ pack "${name}" not rebuilt (is Foundry holding it open? LevelDB lock) — keeping the existing build.`);
  }
}
