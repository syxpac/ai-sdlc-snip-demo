# Snip — URL Shortener

A tiny URL shortener built as **one backend, two clients**, each layer on its
own orphan branch and mounted here as a Git submodule.

```
ai-sdlc-snip-demo (main)
├── backend/    ← Bun server   (branch: backend)
├── frontend/   ← Angular 19   (branch: frontend)
└── cli/        ← Node.js CLI  (branch: cli)
```

---

## API contract

All responses are `application/json`. Both clients talk only to the backend.

| Method | Path | Request body | Success | Error |
|--------|------|-------------|---------|-------|
| `POST` | `/api/links` | `{ "url": "https://…" }` | **201** `{ code, url, shortUrl, hits, createdAt }` | **400** `{ error }` — invalid JSON or non-http(s) URL |
| `GET`  | `/api/links` | — | **200** array of link objects | — |
| `GET`  | `/:code` | — | **302** → original URL (increments hits) | **404** `{ error }` |

`shortUrl` is `<BASE_URL>/<code>` where code is 6 random base-62 characters.

---

## Branch / submodule layout

| Submodule | Branch | Key file | Runtime |
|-----------|--------|----------|---------|
| `backend/` | `backend` | `server.js` | Bun ≥ 1.0 |
| `frontend/` | `frontend` | `angular.json` | Node ≥ 18 + Angular CLI |
| `cli/` | `cli` | `cli.js` | Node ≥ 18 |

Each branch is an **orphan** — it shares no commit history with the others.
The `main` branch holds only `.gitmodules` and this README; all substance
lives inside the submodules.

---

## Cloning

**Always use `--recurse-submodules`.**  
A plain `git clone` fetches only `.gitmodules` and leaves `backend/`,
`frontend/`, and `cli/` as empty directories.

```sh
git clone --recurse-submodules https://github.com/syxpac/ai-sdlc-snip-demo.git
cd ai-sdlc-snip-demo
```

If you already cloned without the flag, run:

```sh
git submodule update --init --recursive
```

---

## Running

### 1 — Backend (Bun)

```sh
cd backend
bun start
# Listens on http://localhost:3000
# Optional env vars:
#   PORT=8080
#   BASE_URL=https://short.example.com
#   PUBLIC_DIR=../frontend/dist/snip-frontend/browser
```

### 2 — Frontend (Angular dev server)

```sh
cd frontend
npm install        # first time only
npm start          # → http://localhost:4200
```

Build for production (output lands in `frontend/dist/snip-frontend/browser/`):

```sh
cd frontend
npx ng build
```

Point the backend at the built assets with `PUBLIC_DIR`:

```sh
cd backend
PUBLIC_DIR=../frontend/dist/snip-frontend/browser bun start
```

### 3 — CLI (Node ≥ 18)

```sh
node cli/cli.js help

node cli/cli.js add https://example.com/very/long/path
node cli/cli.js ls
node cli/cli.js open <code>
```

Override the backend URL:

```sh
SNIP_API=http://localhost:8080 node cli/cli.js ls
```

---

## Updating a submodule

Work inside the submodule directory as a normal repo:

```sh
cd backend                    # enter the submodule
# ... edit, commit ...
git push                      # push on the backend branch
cd ..                         # return to the superproject
```

Then advance the superproject's recorded commit pointer:

```sh
git submodule update --remote backend   # fetch latest from the tracked branch
git add backend
git commit -m "chore: bump backend submodule"
git push
```

> `git submodule update --remote <path>` fetches the latest commit from the
> tracked branch and updates the pointer.  Without `--remote` it only
> checks out the already-recorded SHA.
