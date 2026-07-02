#!/usr/bin/env node
/**
 * scripts/build-bundle.mjs
 *
 * Assembles the "bundle" submodule — a self-contained deployment directory
 * that runs the Bun backend, serves the Angular SPA, and ships as a Docker image.
 *
 * Usage:
 *   node scripts/build-bundle.mjs          # build locally, no push
 *   node scripts/build-bundle.mjs --push   # build + push bundle branch + main
 *
 * Safe to re-run: commits are skipped when nothing changed.
 * Requires: Node ≥ 18, npm, git  (Bun only needed at runtime in the bundle)
 */

import { execSync }                                    from 'node:child_process';
import { existsSync, copyFileSync, mkdirSync,
         writeFileSync, cpSync, rmSync }               from 'node:fs';
import { join, dirname }                               from 'node:path';
import { fileURLToPath }                               from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUSH = process.argv.includes('--push');

// ── helpers ───────────────────────────────────────────────────────────────────

const hr = label =>
  console.log(`\n${'═'.repeat(60)}\n  ${label}\n${'═'.repeat(60)}`);

function run(cmd, cwd = ROOT) {
  process.stdout.write(`$ ${cmd}\n`);
  execSync(cmd, { stdio: 'inherit', cwd });
}

/**
 * Returns true when the git index has staged changes (git diff --cached exits 1).
 * Returns false when there is nothing to commit (exits 0).
 */
function hasStagedChanges(cwd) {
  try {
    execSync('git diff --cached --quiet', { cwd, stdio: 'ignore' });
    return false;   // exit 0 → clean
  } catch {
    return true;    // exit 1 → staged changes present
  }
}

// ── 1. Pull source submodules to their branch tips ────────────────────────────
//      (bundle is intentionally excluded — we write INTO it)

hr('1 · pull backend / frontend / cli → branch tips');
run('git submodule update --init --remote backend frontend cli');

// ── 2. Build the Angular frontend ─────────────────────────────────────────────

const frontendDir = join(ROOT, 'frontend');
const distBrowser = join(frontendDir, 'dist', 'snip-frontend', 'browser');

hr('2 · build Angular frontend');
run('npm install --ignore-scripts', frontendDir);
run('npm run build',                frontendDir);

const indexHtml = join(distBrowser, 'index.html');
if (!existsSync(indexHtml)) {
  process.stderr.write(`\nFATAL: expected build output missing:\n  ${indexHtml}\n`);
  process.exit(1);
}
console.log(`  ✓ index.html present`);

// ── 3. Assemble bundle/ ───────────────────────────────────────────────────────

const bundleDir = join(ROOT, 'bundle');
const publicDir = join(bundleDir, 'public');

hr('3 · assemble bundle/');

// server.js  cli.js
copyFileSync(join(ROOT, 'backend', 'server.js'), join(bundleDir, 'server.js'));
copyFileSync(join(ROOT, 'cli',     'cli.js'),     join(bundleDir, 'cli.js'));
console.log('  server.js, cli.js');

// public/ — wipe before copy so deleted build assets don't linger
if (existsSync(publicDir)) rmSync(publicDir, { recursive: true, force: true });
mkdirSync(publicDir, { recursive: true });
cpSync(distBrowser, publicDir, { recursive: true });
console.log(`  public/ (${distBrowser})`);

// .env — Bun auto-loads this; PUBLIC_DIR enables static-file serving
writeFileSync(join(bundleDir, '.env'), 'PUBLIC_DIR=./public\n');

// package.json — NO "type" field so cli.js runs under plain Node
writeFileSync(join(bundleDir, 'package.json'),
  JSON.stringify({
    name:    'snip-bundle',
    version: '0.1.0',
    scripts: { start: 'bun server.js' },
  }, null, 2) + '\n');

// Dockerfile
writeFileSync(join(bundleDir, 'Dockerfile'), [
  'FROM oven/bun:1-alpine',
  'COPY . .',
  'ENV PORT=3000',
  'EXPOSE 3000',
  'CMD bun server.js',
  '',
].join('\n'));

// .dockerignore
writeFileSync(join(bundleDir, '.dockerignore'),
  'node_modules\n.env\n*.log\n');

// railway.json
writeFileSync(join(bundleDir, 'railway.json'),
  JSON.stringify({ build: { builder: 'DOCKERFILE' } }, null, 2) + '\n');

console.log('  .env, package.json, Dockerfile, .dockerignore, railway.json');

// ── 4. Commit inside bundle/ ──────────────────────────────────────────────────

hr('4 · commit bundle/');
run('git add -A', bundleDir);

if (hasStagedChanges(bundleDir)) {
  const ts = new Date().toISOString().slice(0, 16).replace('T', ' ');
  run(`git -c user.email=ci@snip -c user.name="Snip CI" commit -m "build: ${ts}"`,
      bundleDir);
  console.log('  committed');
} else {
  console.log('  nothing to commit — no-op ✓');
}

if (PUSH) {
  // HEAD:bundle works whether HEAD is attached or detached
  run('git push origin HEAD:bundle', bundleDir);
  console.log('  pushed bundle branch');
}

// ── 5. Bump bundle pointer in the superproject ────────────────────────────────

hr('5 · bump superproject bundle pointer');
run('git add bundle');

if (hasStagedChanges(ROOT)) {
  run('git -c user.email=ci@snip -c user.name="Snip CI" commit -m "chore: bump bundle submodule"');
  console.log('  committed');
} else {
  console.log('  nothing to commit — no-op ✓');
}

if (PUSH) {
  run('git push');
  console.log('  pushed main');
}

console.log('\n✓  build-bundle complete\n');
