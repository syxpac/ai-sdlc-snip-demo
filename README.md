# Snip — URL Shortener Backend

A single-file Bun URL shortener with zero npm dependencies.

## Run

```sh
bun run server.js
# or
bun start
```

## Environment variables

| Variable                | Default                    | Description                                    |
|-------------------------|----------------------------|------------------------------------------------|
| `PORT`                  | `3000`                     | Port to listen on                              |
| `BASE_URL`              | `http://localhost:<PORT>`  | Origin used in `shortUrl` values               |
| `RAILWAY_PUBLIC_DOMAIN` | —                          | Auto-set by Railway; fallback when no BASE_URL |
| `PUBLIC_DIR`            | —                          | Folder of static files to serve (optional)     |

When `PUBLIC_DIR` is set, `GET /` serves `index.html` and any existing file takes
priority over a same-named short code.

## API

### `POST /api/links`

Create a short link.

**Body** `application/json`
```json
{ "url": "https://example.com/very/long/path" }
```

**201 Created**
```json
{
  "code":      "aB3xYz",
  "url":       "https://example.com/very/long/path",
  "shortUrl":  "http://localhost:3000/aB3xYz",
  "hits":      0,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

Returns **400** for invalid JSON or a non-http(s) URL.

### `GET /api/links`

**200** — array of all links (same shape as above).

### `GET /:code`

**302** redirect to the original URL (increments `hits`).  
**404** if the code is unknown.
