import { resolve, normalize, sep } from 'node:path';

const PORT    = parseInt(process.env.PORT || '3000', 10);
const RAILWAY = process.env.RAILWAY_PUBLIC_DOMAIN;
const BASE_URL = (
  process.env.BASE_URL ??
  (RAILWAY ? `https://${RAILWAY}` : `http://localhost:${PORT}`)
).replace(/\/+$/, '');

const PUBLIC_DIR = process.env.PUBLIC_DIR ? resolve(process.env.PUBLIC_DIR) : null;

// ── In-memory store ───────────────────────────────────────────────────────────
/** @type {Map<string, {code:string,url:string,shortUrl:string,hits:number,createdAt:string}>} */
const links = new Map();

// ── Code generation ───────────────────────────────────────────────────────────
const BASE62 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function generateCode() {
  let code = '';
  for (let i = 0; i < 6; i++) code += BASE62[Math.floor(Math.random() * 62)];
  return code;
}

function uniqueCode() {
  let code;
  do { code = generateCode(); } while (links.has(code));
  return code;
}

// ── CORS helpers ──────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// ── Static-file helper ────────────────────────────────────────────────────────
async function tryStatic(pathname) {
  if (!PUBLIC_DIR) return null;
  try {
    const rel  = normalize(pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, ''));
    const full = resolve(PUBLIC_DIR, rel);
    // Guard against path traversal
    if (full !== PUBLIC_DIR && !full.startsWith(PUBLIC_DIR + sep)) return null;
    const file = Bun.file(full);
    if (!(await file.exists())) return null;
    return new Response(file, { headers: { ...CORS } });
  } catch {
    return null;
  }
}

// ── Server ────────────────────────────────────────────────────────────────────
Bun.serve({
  port: PORT,

  async fetch(req) {
    const { pathname } = new URL(req.url);
    const method       = req.method;

    // ── CORS preflight ──────────────────────────────────────────────────────
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    // ── POST /api/links — create a short link ───────────────────────────────
    if (method === 'POST' && pathname === '/api/links') {
      let body;
      try   { body = await req.json(); }
      catch { return json({ error: 'Invalid JSON' }, 400); }

      const target = typeof body?.url === 'string' ? body.url : null;
      if (!target) return json({ error: 'Missing or non-string url field' }, 400);

      let parsed;
      try   { parsed = new URL(target); }
      catch { return json({ error: 'Invalid URL' }, 400); }

      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return json({ error: 'URL must use http or https' }, 400);
      }

      const code = uniqueCode();
      const link = {
        code,
        url:       target,
        shortUrl:  `${BASE_URL}/${code}`,
        hits:      0,
        createdAt: new Date().toISOString(),
      };
      links.set(code, link);
      return json(link, 201);
    }

    // ── GET /api/links — list all links ─────────────────────────────────────
    if (method === 'GET' && pathname === '/api/links') {
      return json([...links.values()]);
    }

    // ── GET * — static files win over short codes ────────────────────────────
    if (method === 'GET') {
      const staticRes = await tryStatic(pathname);
      if (staticRes) return staticRes;

      if (pathname.length > 1) {
        const code = pathname.slice(1);
        const link = links.get(code);
        if (link) {
          link.hits++;
          return new Response(null, {
            status:  302,
            headers: { ...CORS, Location: link.url },
          });
        }
      }
    }

    return json({ error: 'Not found' }, 404);
  },
});

console.log(`Snip backend running on port ${PORT}  BASE_URL=${BASE_URL}`);
