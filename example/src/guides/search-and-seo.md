---
title: Search & SEO
description: Instant full-text search pre-indexed at build time with MiniSearch and comprehensive static + dynamic SEO optimization.
updatedAt: 2026-11-13
previous:
  label: Markdown Features
  link: /guides/markdown-features
next:
  label: Docker & Nginx Deployment
  link: /guides/deployment
---

**mdkb** prioritizes fast client-side discovery and search engine visibility without requiring a server-side search backend.

## Pre-indexed Local Search (MiniSearch)

During `yarn build` (and Vite dev startup), the custom Vite plugin:

1. Parses every `.md` file in your source folder (`src/` by default) and extracts its title, description, category, headings, and plain text.
2. Indexes all documents into **MiniSearch** at build time.
3. Serializes the index JSON into the bundle so the browser loads it immediately via `MiniSearch.loadJSON(...)`.

### Search Shortcuts & Behavior

- Press `Ctrl+K` (Windows/Linux), `Cmd+K` (macOS), or `/` anywhere outside an input to open the search modal.
- Supports **fuzzy matching** (`0.2` edit tolerance) and **prefix matching**, with weighted boosts for titles and headings.
- Navigate results with `↑` / `↓` arrow keys and press `Enter` (IME-safe) to jump directly to the matching route.

## SEO Optimization

**mdkb** optimizes SEO both **at build time** and **at runtime**:

- **Per-Route Static HTML**: `yarn build` emits a dedicated `index.html` inside each route directory (for example `dist/guides/search-and-seo/index.html`) containing that page's exact `<title>`, `<meta name="description">`, OpenGraph (`og:*`), Twitter card tags, and canonical `<link>`.
- **Automatic `sitemap.xml` & `robots.txt`**: Generated in `dist/` from all discovered Markdown routes and their `updatedAt` timestamps.
- **Dynamic Client-Side `<head>` Updates**: Navigating between pages updates `<title>`, meta descriptions, canonical URLs, and JSON-LD `TechArticle` structured data immediately.

:::info[Canonical Domain]
To include absolute canonical URLs and an absolute `Sitemap:` directive in `robots.txt`, set `baseUrl` in `mdkb.config.json` to your full production URL (for example `"https://docs.example.com"` or `"https://example.com/docs"`).
:::
