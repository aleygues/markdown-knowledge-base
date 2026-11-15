---
title: Welcome to mdkb
description: Turn a folder of Markdown files and a single mdkb.config.json into a fast, searchable, SEO-ready static documentation site.
updatedAt: 2026-11-13
previous: false
next:
  label: Quick Start
  link: /getting-started
---

**mdkb** (Markdown Knowledge Base) is a lightweight documentation generator built with **React**, **TypeScript**, **Vite**, **React Router**, **Chakra UI**, and **MiniSearch**.

Write your documentation in plain `.md` files, configure branding and navigation in `mdkb.config.json`, and run `yarn build` to output a completely static web application ready for any CDN or Nginx container.

:::info[Why mdkb?]
All routes, page metadata, and the full-text MiniSearch index are generated **at build time**. Visitors get instant client-side navigation, keyboard-accessible search, and zero backend dependencies.
:::

## Key Features

- **File-system Routing**: Routes mirror your `src/` folder structure automatically (`index.md` maps to the folder base route).
- **Pre-indexed Local Search**: Press `Ctrl+K` (or `Cmd+K` / `/`) to search across titles, headings, descriptions, and page content using a pre-built MiniSearch index.
- **Customizable via `mdkb.config.json`**: Set primary & secondary colors, logo, base URL, and structured sidebar categories with internal or external links.
- **Extended Markdown**: Supports YAML frontmatter (`title`, `description`, `previous`, `next`, `updatedAt`), callout boxes (`info`, `warning`, `danger`), GFM tables, and copyable code blocks.
- **Light & Dark Mode**: Automatically follows system preferences with a persistent manual toggle and zero flash of unstyled content.
- **Responsive & SEO-Optimized**: Mobile navigation drawer, per-route static HTML metadata, `sitemap.xml`, `robots.txt`, OpenGraph tags, and JSON-LD structured data.

## Next Steps

Head over to the [Quick Start](/getting-started) guide to learn how to organize your Markdown files and build your documentation site.
