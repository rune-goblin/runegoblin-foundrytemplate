// Dev environment setup. Idempotent. Run with `npm run setup`.
//   1. Find the Foundry data dir(s) — detect per-platform, else ask for the path.
//   2. Resolve the PF2e system source — detect, clone foundryvtt/pf2e, point at a
//      checkout, or skip (types also ship via the foundry-pf2e dep, so it's optional).
//   3. Symlink references INTO the repo and this repo OUT into Foundry's modules/.
// Resolved paths cache in .dev-paths.json (gitignored) so re-runs don't re-ask.
// Flags: --reconfigure (ask again), --no-link (resolve+cache only), --yes (no prompts).
import {
  existsSync, symlinkSync, lstatSync, unlinkSync, readFileSync, writeFileSync, mkdirSync,
} from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { homedir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const repo = process.cwd();
const home = homedir();
const ID = 'pf2e-module-template';

const PF2E_REPO = 'https://github.com/foundryvtt/pf2e.git';
const CONFIG = join(repo, '.dev-paths.json');

const argv = new Set(process.argv.slice(2));
const reconfigure = argv.has('--reconfigure');
const noLink = argv.has('--no-link');
const interactive = Boolean(stdin.isTTY) && !argv.has('--yes');

interface DevPaths {
  foundryData?: string[];
  pf2eSource?: string;
}

const rl = interactive ? createInterface({ input: stdin, output: stdout }) : null;

// Ctrl+D / closed stdin mid-prompt rejects with AbortError — treat it as "cancel", not a crash.
async function prompt(line: string): Promise<string> {
  try {
    return (await rl!.question(line)).trim();
  } catch {
    console.log('\nCancelled.');
    rl?.close();
    process.exit(0);
  }
}

async function ask(question: string, fallback = ''): Promise<string> {
  if (!rl) return fallback;
  const answer = await prompt(`${question}${fallback ? ` [${fallback}]` : ''} `);
  return answer || fallback;
}

async function confirm(question: string, def = true): Promise<boolean> {
  if (!rl) return def;
  const answer = (await prompt(`${question} [${def ? 'Y/n' : 'y/N'}] `)).toLowerCase();
  return answer ? answer.startsWith('y') : def;
}

function expand(p: string): string {
  if (p === '~') return home;
  if (p.startsWith('~/')) return join(home, p.slice(2));
  return p;
}

function readConfig(): DevPaths {
  if (!reconfigure && existsSync(CONFIG)) {
    try {
      return JSON.parse(readFileSync(CONFIG, 'utf8')) as DevPaths;
    } catch {
      /* malformed cache — start fresh */
    }
  }
  return {};
}

function foundryCandidates(): string[] {
  const out: string[] = [];
  if (process.env.FOUNDRY_DATA) out.push(process.env.FOUNDRY_DATA);
  if (process.platform === 'darwin') {
    const base = join(home, 'Library/Application Support');
    out.push(join(base, 'FoundryVTT-v14/Data'), join(base, 'FoundryVTT/Data'));
  } else if (process.platform === 'win32') {
    const local = process.env.LOCALAPPDATA ?? join(home, 'AppData/Local');
    out.push(join(local, 'FoundryVTT-v14/Data'), join(local, 'FoundryVTT/Data'));
  } else {
    const xdg = process.env.XDG_DATA_HOME ?? join(home, '.local/share');
    out.push(join(xdg, 'FoundryVTT-v14/Data'), join(xdg, 'FoundryVTT/Data'));
  }
  return out;
}

async function resolveFoundryData(cfg: DevPaths): Promise<string[]> {
  let found = (cfg.foundryData ?? []).filter(existsSync);
  if (found.length === 0) found = foundryCandidates().filter(existsSync);
  if (found.length > 0) {
    for (const d of found) console.log(`✓ Foundry data: ${d}`);
    return found;
  }
  console.log('• No Foundry data directory at the usual locations.');
  if (!interactive) {
    console.log('  Set FOUNDRY_DATA or run interactively to point at it; skipping Foundry links.');
    return [];
  }
  const entered = expand(await ask('  Path to your Foundry Data dir (holds modules/, worlds/):', foundryCandidates()[0]));
  if (!entered) return [];
  if (existsSync(entered)) return [entered];
  if (await confirm(`  ${entered} doesn't exist — create it?`, true)) {
    mkdirSync(join(entered, 'modules'), { recursive: true });
    console.log(`  created ${entered}`);
    return [entered];
  }
  console.log('  skipping Foundry links.');
  return [];
}

function pf2eCandidates(cfg: DevPaths): string[] {
  const out: string[] = [];
  if (cfg.pf2eSource) out.push(cfg.pf2eSource);
  out.push(join(home, 'Documents/repos/pf2e'), join(home, 'repos/pf2e'), join(repo, '..', 'pf2e'));
  return out;
}

async function resolvePf2eSource(cfg: DevPaths): Promise<string | undefined> {
  const hit = pf2eCandidates(cfg).find(existsSync);
  if (hit) {
    console.log(`✓ PF2e source: ${hit}`);
    return hit;
  }
  console.log('• PF2e system source not found (optional — types also come from the foundry-pf2e dep).');
  if (!interactive) return undefined;
  const choice = (await ask('  [c]lone foundryvtt/pf2e, [p]oint at a checkout, or [s]kip?', 's')).toLowerCase();
  if (choice.startsWith('p')) {
    const p = expand(await ask('  Path to your pf2e checkout:'));
    if (p && existsSync(p)) return p;
    console.log('  not found — skipping.');
    return undefined;
  }
  if (choice.startsWith('c')) {
    const dest = expand(await ask('  Clone destination:', join(repo, '..', 'pf2e')));
    if (!dest) return undefined;
    if (existsSync(dest)) {
      console.log(`  ${dest} already exists — using it.`);
      return dest;
    }
    try {
      mkdirSync(dirname(dest), { recursive: true }); // git clone needs the parent to exist
      console.log(`  cloning ${PF2E_REPO} → ${dest} (large repo; shallow --depth 1)…`);
      execFileSync('git', ['clone', '--depth', '1', PF2E_REPO, dest], { stdio: 'inherit' });
      return dest;
    } catch {
      console.log('  clone failed — skipping.');
      return undefined;
    }
  }
  return undefined;
}

// Windows can't make plain dir symlinks without admin; junctions need no privilege.
const symlinkType = process.platform === 'win32' ? 'junction' : undefined;

function link(linkPath: string, target: string): void {
  if (!existsSync(target)) {
    console.log(`skip (missing target): ${basename(linkPath)} → ${target}`);
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
  symlinkSync(target, linkPath, symlinkType);
  console.log(`linked ${basename(linkPath)} → ${target}`);
}

const used = new Set<string>();
function nameOnce(base: string): string {
  let name = base;
  for (let i = 2; used.has(name); i++) name = `${base}-${i}`;
  used.add(name);
  return name;
}

const cfg = readConfig();
console.log('Setting up the dev environment…\n');

const foundryData = await resolveFoundryData(cfg);
const pf2eSource = await resolvePf2eSource(cfg);

if (foundryData.length || pf2eSource) {
  writeFileSync(CONFIG, `${JSON.stringify({ foundryData, pf2eSource }, null, 2)}\n`);
  console.log(`\nSaved paths to ${basename(CONFIG)} (gitignored) — re-run with --reconfigure to change.`);
}

if (noLink) {
  console.log('--no-link: resolved paths only, no symlinks created.');
  rl?.close();
} else if (!(await confirm('\nCreate the dev symlinks now?', true))) {
  console.log('Skipped symlinks. Run `npm run setup` again when ready.');
  rl?.close();
} else {
  console.log('');
  if (pf2eSource) link(join(repo, nameOnce('_pf2e-source')), pf2eSource);
  for (const dataDir of foundryData) {
    const sfx = /v14/i.test(dataDir) ? '-v14' : '';
    link(join(repo, nameOnce(`_foundry-data${sfx}`)), dataDir);
    link(join(repo, nameOnce(`__foundryModules${sfx}`)), join(dataDir, 'modules'));
  }
  for (const dataDir of foundryData) {
    const modulesDir = join(dataDir, 'modules');
    if (!existsSync(modulesDir)) {
      console.log(`skip (no modules dir): ${modulesDir}`);
      continue;
    }
    link(join(modulesDir, ID), repo);
  }
  rl?.close();
}
