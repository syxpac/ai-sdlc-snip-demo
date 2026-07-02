# Snip Design System

Inspired by dark AI-product UIs: near-black background, warm coral/orange
gradient hero glow, a pill-shaped chat input as the centrepiece, and
spacious rounded surface cards.

---

## Color Tokens

| CSS variable      | Value                        | Usage                           |
|-------------------|------------------------------|---------------------------------|
| `--bg`            | `#0a0a0b`                    | Page background                 |
| `--surface`       | `#141416`                    | Card / input background         |
| `--surface-2`     | `#1c1c20`                    | Row hover / secondary surface   |
| `--border`        | `rgba(255,255,255,0.07)`     | Card & input borders            |
| `--border-focus`  | `rgba(255,107,107,0.50)`     | Focused input ring colour       |
| `--text`          | `#f2f2f2`                    | Primary body text               |
| `--muted`         | `rgba(255,255,255,0.45)`     | Sub-headlines, labels, hints    |
| `--accent`        | `#ff6b6b`                    | Coral primary accent            |
| `--accent-2`      | `#ff8c42`                    | Orange gradient end             |
| `--success`       | `#4ade80`                    | Success notices                 |
| `--danger`        | `#f87171`                    | Error notices                   |

---

## Gradients

```css
/* CTA button fill */
background: linear-gradient(135deg, #ff6b6b 0%, #ff8c42 100%);

/* Hero background glow (decorative div, position:absolute) */
background: radial-gradient(
  ellipse 80% 55% at 50% 10%,
  rgba(255,107,107,0.20) 0%,
  transparent 70%
);

/* Hero headline text fill */
background: linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.65) 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

---

## Typography

| Role             | Size              | Weight | Other                         |
|------------------|-------------------|--------|-------------------------------|
| Hero headline    | clamp(2.5rem,7vw,4rem) | 800 | tracking −0.03em, lh 1.05  |
| Hero sub         | 1.125rem          | 400    | `--muted`, max-width 30ch     |
| Body             | 0.9375rem         | 400    | lh 1.6                        |
| Section label    | 0.70rem           | 600    | uppercase, ls 0.10em, `--muted` |
| Table header     | 0.70rem           | 600    | uppercase, ls 0.08em          |
| Code / short url | 0.80rem           | 600    | `ui-monospace` stack          |

**Font stack:** `'Inter', system-ui, -apple-system, sans-serif`
**Mono stack:** `'JetBrains Mono', 'Fira Code', ui-monospace, monospace`

---

## Spacing Scale

`0.25 · 0.5 · 0.75 · 1 · 1.25 · 1.5 · 2 · 2.5 · 3 · 4 · 6 rem`

---

## Shape

| Token            | Value     | Applied to                      |
|------------------|-----------|---------------------------------|
| `--radius-pill`  | `9999px`  | Shorten form, CTA button        |
| `--radius-card`  | `1rem`    | All surface cards               |
| `--radius-sm`    | `0.5rem`  | Small inline badges             |

---

## Elevation / Glow

```css
/* Surface card */
box-shadow: 0 8px 32px rgba(0,0,0,0.50);

/* Pill input (focus state) */
box-shadow: 0 0 0 3px rgba(255,107,107,0.15);

/* CTA button hover */
box-shadow: 0 4px 20px rgba(255,107,107,0.45);
```

---

## Element Mapping — Snip

| Snip element        | Design role              | Key tokens / notes                             |
|---------------------|--------------------------|------------------------------------------------|
| `<main>`            | Full-viewport shell      | `--bg`, min-height 100vh                       |
| `.hero`             | Centred hero section     | gradient glow behind, 6rem top pad             |
| `.hero-glow`        | Decorative bloom         | `position:absolute`, radial gradient           |
| `<h1>` "Snip"       | Bold hero headline       | gradient text fill, weight 800                 |
| `.hero-sub`         | Muted subtitle           | `--muted`, 1.125rem                            |
| `.shorten-form`     | Chat-style pill input    | `--surface` pill, gradient CTA, focus ring     |
| `.notice-error`     | Inline error line        | `--danger`, no card                            |
| `.notice-success`   | Inline success line      | `--success`, underlined link                   |
| `.links-card`       | Rounded surface card     | `--surface`, `--radius-card`, deep shadow      |
| `.section-label`    | Card header label        | uppercase, `--muted`, 0.70rem                  |
| `th`                | Table column labels      | same as section label                          |
| `.code-link`        | Short-code accent link   | `--accent`, monospace                          |
| `.original a`       | Long-URL muted link      | `--muted` → `--text` on hover                  |
| `.hits`             | Hit counter cell         | weight 700, right-aligned                      |
| `.date`             | Timestamp cell           | `--muted`, 0.80rem                             |
