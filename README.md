# snip CLI

Zero-dependency Node.js CLI for the Snip URL shortener. Requires Node ≥ 18.

## Quick start

```sh
node cli.js help          # run directly
# — or install globally —
npm link                  # then: snip help
```

## Commands

```
snip add <url>    Shorten a URL; prints the short link
snip ls           List all links  (code · hits · URL, aligned)
snip open <code>  Open a short link in the default browser
snip help         Show this help
```

## Configuration

| Variable   | Default                   | Description            |
|------------|---------------------------|------------------------|
| `SNIP_API` | `http://localhost:3000`   | Snip backend base URL  |

```sh
SNIP_API=https://short.example.com snip ls
```

## Wrappers

| File        | Use when                          |
|-------------|-----------------------------------|
| `snip`      | POSIX shell (bash / sh / zsh)     |
| `snip.cmd`  | Windows Command Prompt            |
| `snip.ps1`  | PowerShell (5.1 or 7+)            |
