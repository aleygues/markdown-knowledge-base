---
title: Configuration (mdkb.config.json)
description: Customize site branding, colors, logo, base URL, and sidebar menu categories in mdkb.config.json.
updatedAt: 2026-11-15
previous:
  label: Guides Overview
  link: /guides
next:
  label: Markdown Features
  link: /guides/markdown-features
---

Place `mdkb.config.json` alongside your Markdown files (for example in `src/mdkb.config.json`) to customize your documentation site.

## Configuration Options

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | `"mdkb Documentation"` | Site title shown in the header, browser `<title>`, and OpenGraph metadata. |
| `description` | `string` | Default summary | Default site-wide SEO description when a page omits its own `description`. |
| `primaryColor` | `string` | `"#0ea5e9"` | Primary accent color (hex or CSS color) used for active nav items, links, and highlights. |
| `secondaryColor` | `string` | `"#6366f1"` | Secondary accent color used for quotes and supporting accents. |
| `logo` | `string` | `"/logo.svg"` | Path to a static asset or external image URL displayed in the top bar. |
| `baseUrl` | `string` | `"/"` | Deployment subpath (e.g. `"/docs/"`) or full canonical origin + path (e.g. `"https://example.com/docs"`). |
| `locale` | `string` | `"en"` | UI language (`"en"` or `"fr"`). Translates UI controls, date formatting, `<html lang>`, and `og:locale`. |
| `menu` | `array` | Auto-generated | Ordered sidebar categories containing internal routes or `http://` / `https://` external links. |

## Example `mdkb.config.json`

```json
{
  "title": "Acme API Docs",
  "description": "Developer documentation for Acme Platform",
  "primaryColor": "#0ea5e9",
  "secondaryColor": "#6366f1",
  "logo": "/logo.svg",
  "baseUrl": "/",
  "locale": "en",
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
        { "label": "GitHub Repo", "link": "https://github.com/example/acme" }
      ]
    }
  ]
}
```

:::info[Automatic External Link Detection]
Any `link` starting with `http://` or `https://` is automatically treated as an external link (opens in a new tab with `rel="noopener noreferrer"` and an external-link icon). No extra `external` property is needed.
:::

## Subpath Hosting with `baseUrl`

If you host your documentation under a subpath such as `https://example.com/docs`, set `"baseUrl": "/docs/"` (or `"https://example.com/docs"`). **mdkb** automatically configures both Vite's `base` option and React Router's `basename`.

:::warning[Static Asset Paths]
When referencing custom local assets like `/my-logo.svg` in `mdkb.config.json` or Markdown images, place them inside your `src/` folder (or `public/`) and start paths with `/`. **mdkb** automatically copies them into `dist/` and prefixes them with `baseUrl` at runtime.
:::
