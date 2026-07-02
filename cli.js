#!/usr/bin/env node
'use strict';

const http          = require('node:http');
const https         = require('node:https');
const { spawn }     = require('node:child_process');

const BASE = (process.env.SNIP_API || 'http://localhost:3000').replace(/\/+$/, '');

// ── Helpers ───────────────────────────────────────────────────────────────────

function fatal(msg) {
  process.stderr.write(msg + '\n');
  process.exit(1);
}

/** Wrapper around global fetch — exits on network failure. */
async function api(path, init) {
  try {
    return await fetch(BASE + path, init);
  } catch (err) {
    fatal(`Cannot reach backend at ${BASE}: ${err.message}`);
  }
}

/**
 * Single non-following HTTP request; returns the Location header value for
 * redirect responses, or null for anything else (404, etc.).
 * Avoids fetch(redirect:'manual') whose opaque-redirect type hides headers.
 */
function getRedirectLocation(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https:') ? https : http;
    const req = mod.request(url, { method: 'GET' }, (res) => {
      const isRedirect = res.statusCode >= 300 && res.statusCode < 400;
      resolve(isRedirect ? (res.headers.location || null) : null);
      res.resume(); // drain socket
    });
    req.on('error', reject);
    req.end();
  });
}

// ── Commands ──────────────────────────────────────────────────────────────────

async function cmdAdd(url) {
  if (!url) fatal('Usage: snip add <url>');

  const res = await api('/api/links', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ url }),
  });

  if (res.status === 400) {
    const body = await res.json().catch(() => ({}));
    fatal(body.error || 'Invalid URL');
  }
  if (!res.ok) fatal(`Server error ${res.status}`);

  const link = await res.json();
  process.stdout.write(link.shortUrl + '\n');
}

async function cmdLs() {
  const res = await api('/api/links');
  if (!res.ok) fatal(`Server error ${res.status}`);

  const links = await res.json();
  if (links.length === 0) {
    console.log('No links yet.');
    return;
  }

  // Column widths
  const wCode = Math.max('CODE'.length, ...links.map(l => l.code.length));
  const wHits = Math.max('HITS'.length, ...links.map(l => String(l.hits).length));

  console.log(`${'CODE'.padEnd(wCode)}  ${'HITS'.padStart(wHits)}  URL`);
  console.log(`${'-'.repeat(wCode)}  ${'-'.repeat(wHits)}  ${'-'.repeat(50)}`);
  for (const l of links) {
    console.log(`${l.code.padEnd(wCode)}  ${String(l.hits).padStart(wHits)}  ${l.url}`);
  }
}

async function cmdOpen(code) {
  if (!code) fatal('Usage: snip open <code>');

  let location;
  try {
    location = await getRedirectLocation(`${BASE}/${code}`);
  } catch (err) {
    fatal(`Cannot reach backend at ${BASE}: ${err.message}`);
  }
  if (!location) fatal(`Unknown code: ${code}`);

  const plt = process.platform;
  // Decompose into [executable, ...arguments] per platform
  const [cmd, ...args] =
    plt === 'win32'  ? ['cmd.exe', '/c', 'start', '', location] :
    plt === 'darwin' ? ['open', location] :
                       ['xdg-open', location];

  const child = spawn(cmd, args, { detached: true, stdio: 'ignore' });
  child.on('error', err => process.stderr.write(`Warning: could not open browser: ${err.message}\n`));
  child.unref();

  process.stdout.write(`Opening ${location}\n`);
}

function printHelp() {
  console.log(`Snip \u2014 URL Shortener CLI

Usage:
  snip add <url>    Shorten a URL and print the short link
  snip ls           List all short links (code, hits, URL)
  snip open <code>  Open a short link in the default browser
  snip help         Show this help

Config:
  SNIP_API          Backend base URL (default: http://localhost:3000)`);
}

// ── Dispatch ──────────────────────────────────────────────────────────────────

const [,, cmd, arg] = process.argv;

switch (cmd) {
  case 'add':  cmdAdd(arg).catch(err => fatal(err.message)); break;
  case 'ls':   cmdLs().catch(err => fatal(err.message)); break;
  case 'open': cmdOpen(arg).catch(err => fatal(err.message)); break;
  default:     printHelp();
}
