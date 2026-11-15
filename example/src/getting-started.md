---
title: Quick Start
description: Set up your Markdown files, preview locally, and build a static bundle with npx @aleygues/mdkb build.
updatedAt: 2026-11-15
previous:
  label: Introduction
  link: /
next:
  label: Guides Overview
  link: /guides
---

Getting started with **mdkb** takes less than two minutes. Create a folder containing a `src/` directory with your Markdown files and `mdkb.config.json`.

## Project Structure

```text
my-docs/
└── src/
    ├── mdkb.config.json      # Branding, base URL, and sidebar menu
    ├── index.md              # Home route ("/")
    ├── getting-started.md    # Route "/getting-started"
    └── guides/
        ├── index.md          # Route "/guides"
        └── configuration.md  # Route "/guides/configuration"
```

## How Routing Works

Every `.md` file inside your source folder is automatically turned into a React Router route:

| File Path | Route |
| --- | --- |
| `src/index.md` | `/` |
| `src/getting-started.md` | `/getting-started` |
| `src/guides/index.md` | `/guides` |
| `src/guides/markdown-features.md` | `/guides/markdown-features` |

:::info[Index Files]
Use `index.md` inside any subdirectory to define the base landing page for that folder route (for example, `src/guides/index.md` serves `/guides`).
:::

## Build & Preview with CLI

Build your static documentation site into `./dist`:

```bash
npx @aleygues/mdkb build
```

You can also customize the source and output directories:

```bash
npx @aleygues/mdkb build --src docs --out public-docs
```

Start a local development server with hot reload, or preview the built `dist/` folder:

```bash
npx @aleygues/mdkb dev
npx @aleygues/mdkb preview
```
