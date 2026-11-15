---
title: Guides Overview
description: Explore all guides covering configuration, extended Markdown syntax, search, SEO, and Docker deployment.
updatedAt: 2026-11-13
previous:
  label: Quick Start
  link: /getting-started
next:
  label: Configuration (mdkb.config.json)
  link: /guides/configuration
---

This page is served from `src/guides/index.md`, demonstrating how `index.md` acts as the base route (`/guides`) for a folder in **mdkb**.

## Available Guides

- [Configuration (`mdkb.config.json`)](/guides/configuration) — Customize colors, logo, base URL, and sidebar categories.
- [Markdown Features](/guides/markdown-features) — Configure page metadata, pagination buttons, and callout boxes.
- [Search & SEO](/guides/search-and-seo) — Learn how MiniSearch pre-indexing and per-route SEO metadata work.
- [Docker & Nginx Deployment](/guides/deployment) — Build and serve your static documentation using the included 2-stage Dockerfile.
- [Interactive Review Mode](/guides/review-mode) — Annotate text, images, Mermaid diagrams, and menu items into `reviews/review_*.md`.

:::warning[Relative Links]
You can link between documentation pages using either absolute in-app routes like `/guides/configuration` or relative paths like `./configuration.md`. Both use React Router for instant client-side navigation.
:::
