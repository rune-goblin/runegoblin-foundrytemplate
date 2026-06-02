// Sandbox dev linking. Idempotent. Run with `npm run link-dev`.
//   - Pulls reference sources INTO the repo (gitignored `_*` / `__*` links).
//   - Symlinks this repo OUT into both Foundry instances' Data/modules.
import { existsSync, symlinkSync, lstatSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const repo = process.cwd();
const home = homedir();
const ID = 'pf2e-module-template';

const dataV14 = join(home, 'Library/Application Support/FoundryVTT-v14/Data');
const data = join(home, 'Library/Application Support/FoundryVTT/Data');

// name-in-repo -> target it points at
const refs = {
  '_pf2e-source': join(home, 'Documents/repos/pf2e'),
  '_foundry-data-v14': dataV14,
  '_foundry-data': data,
  '__foundryModules-v14': join(dataV14, 'modules'),
  '__foundryModules': join(data, 'modules'),
};

function link(linkPath, target) {
  if (!existsSync(target)) {
    console.log(`skip (missing target): ${linkPath} -> ${target}`);
    return;
  }
  const st = lstatSync(linkPath, { throwIfNoEntry: false });
  if (st) {
    if (!st.isSymbolicLink()) {
      console.log(`skip (exists, not a symlink): ${linkPath}`);
      return;
    }
    unlinkSync(linkPath);
  }
  symlinkSync(target, linkPath);
  console.log(`linked ${linkPath} -> ${target}`);
}

for (const [name, target] of Object.entries(refs)) link(join(repo, name), target);

for (const d of [dataV14, data]) {
  const modulesDir = join(d, 'modules');
  if (!existsSync(modulesDir)) {
    console.log(`skip (no modules dir): ${modulesDir}`);
    continue;
  }
  link(join(modulesDir, ID), repo);
}
