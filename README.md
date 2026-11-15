# @aleygues/mdkb

A static documentation generator built with **React**, **TypeScript**, **Vite**, **React Router**, **Chakra UI**, and **MiniSearch**. Point it at a folder of Markdown files and an `mdkb.config.json` file to generate a fast, searchable, SEO-optimized static documentation site.

## Features

- **File-system Routing**: Routes mirror your Markdown folder structure (`index.md` maps to the folder base route, e.g. `guides/index.md` -> `/guides`).
- **Pre-indexed Local Search**: Full-text search powered by **MiniSearch**, pre-indexed at build time (`Ctrl+K` / `Cmd+K` / `/`).
- **Customizable Theme & Navigation**: Configure `primaryColor`, `secondaryColor`, `logo`, `baseUrl`, and sidebar `menu` entries in `mdkb.config.json`. Links starting with `http://` or `https://` are automatically treated as external links.
- **Extended Markdown**: YAML frontmatter (`title`, `description`, `previous`, `next`, `updatedAt`), GFM, copyable code blocks, and callout boxes (`:::info`, `:::warning`, `:::danger`).
- **Light & Dark Mode**: Automatic system preference detection with a persistent manual toggle.
- **SEO Ready**: Per-route static HTML metadata, OpenGraph tags, JSON-LD structured data, `sitemap.xml`, and `robots.txt`.

## Using `@aleygues/mdkb` in Your Project

Create a project directory with a `src/` folder containing your Markdown files and `mdkb.config.json`:

```text
my-docs/
└── src/
    ├── mdkb.config.json
    ├── index.md
    ├── getting-started.md
    └── guides/
        ├── index.md
        └── configuration.md
```

Build the static site into `dist/`:

```bash
npx @aleygues/mdkb build
```

You can also install it as a project devDependency:

```bash
npm install -D @aleygues/mdkb
# or
yarn add -D @aleygues/mdkb
```

### CLI Commands & Options

```text
mdkb <command> [options]
```

**Commands:**
- `build` — Compile the static documentation site
- `dev` — Start a local development server with HMR
- `preview` — Serve the compiled static output locally

**Options:**
- `-s, --src <dir>` — Source folder containing `.md` files and `mdkb.config.json` (default: `src`)
- `-o, --out <dir>` / `--out-dir <dir>` — Output directory for the static build (default: `dist`)
- `-c, --config <file>` — Explicit path to `mdkb.config.json` (default: `<src>/mdkb.config.json`)
- `-p, --port <port>` — Port for `dev` or `preview`
- `--host <host>` — Host to bind `dev` or `preview` (pass bare `--host` for `0.0.0.0`)
- `-h, --help` — Show CLI help
- `-v, --version` — Show package version

**Examples:**

```bash
# Default: reads ./src and outputs ./dist
npx @aleygues/mdkb build

# Custom source and output folders
npx @aleygues/mdkb build --src docs --out build

# Start dev server on a custom port
npx @aleygues/mdkb dev --src src --port 3000

# Preview the compiled dist/ folder
npx @aleygues/mdkb preview --out dist --port 4173
```

## Configuration (`mdkb.config.json`)

Place `mdkb.config.json` inside your `--src` folder (or pass `--config`):

```json
{
  "title": "My Docs",
  "description": "Documentation for my project.",
  "primaryColor": "#0ea5e9",
  "secondaryColor": "#6366f1",
  "logo": "/logo.svg",
  "baseUrl": "/",
  "menu": [
    {
      "category": "Getting Started",
      "items": [
        { "label": "Introduction", "link": "/" },
        { "label": "Quick Start", "link": "/getting-started" }
      ]
    },
    {
      "category": "Resources",
      "items": [
        { "label": "Guides", "link": "/guides" },
        { "label": "GitHub", "link": "https://github.com/example/repo" }
      ]
    }
  ]
}
```

- Any menu item `link` starting with `http://` or `https://` is automatically rendered as an external link (`target="_blank"` with `rel="noopener noreferrer"`).
- `baseUrl` supports either a subpath (e.g. `"/docs/"`) or a full canonical URL (e.g. `"https://example.com/docs"`).

## Extended Markdown

### Frontmatter

```markdown
---
title: Configuration
description: Configure theme colors, navigation, and base URL.
updatedAt: 2026-11-15
previous:
  label: Quick Start
  link: /getting-started
next:
  label: Deployment
  link: /guides/deployment
---
```

### Callout Boxes

```markdown
:::info[Tip]
Helpful information block.
:::

:::warning[Heads up]
Important warning block.
:::

:::danger[Breaking Change]
Critical danger block.
:::
```

## Example Project

This repository includes a runnable example in [`example/`](./example/README.md) with sample documentation under `example/src/`.

```bash
cd example
npx @aleygues/mdkb build
```

Or from the repository root during local development:

```bash
yarn install
yarn dev      # Runs Vite dev server against example/src
yarn build    # Builds TypeScript, CLI (dist-cli/), and example static site (dist/)
yarn preview  # Previews dist/
```

## Docker Deployment

The repository includes a two-stage `Dockerfile` (`node:24-alpine` builder + `nginx:alpine` runner) and `nginx.conf`:

```bash
docker build -t mdkb-docs .
docker run --rm -p 8080:80 mdkb-docs
```
