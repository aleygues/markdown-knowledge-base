---
title: Interactive Review Mode
description: Launch your documentation in interactive review mode to annotate text, images, Mermaid diagrams, and sidebar menu items into structured Markdown files.
updatedAt: 2026-11-15
previous:
  label: Docker & Nginx Deployment
  link: /guides/deployment
next: false
---

**mdkb** includes a built-in interactive **Review Mode** so reviewers can annotate documentation directly in the browser without modifying source files prematurely.

## Starting Review Mode

Run the `review` command in your documentation project folder:

```bash
npx @aleygues/mdkb review
```

You can also customize the source directory or where review files are written:

```bash
npx @aleygues/mdkb review --src src --reviews reviews --port 4173
```

## How to Review Content

When Review Mode is active, a yellow **Review Mode** bar appears at the top of the interface:

- **Highlight any text**: Drag to select any text on the page (title, headings, paragraphs, tables, callouts, code blocks, pagination) or inside the sidebar menu, then click **Add comment**.
- **Select an image or Mermaid diagram**: Click any standalone image or Mermaid diagram (or its **Comment** button) to attach feedback directly to that visual element.
- **Select a menu item**: Highlight a menu label or click the comment icon next to a menu category/item in the sidebar.

:::info[View, Edit, and Delete Existing Comments]
Existing comments appear highlighted directly on the page and navigation menu with numbered yellow badges (`1`, `2`, …). Click any highlight or open the **Review comments** drawer from the top banner to inspect, edit, or delete comments at any time.
:::

## Generated `reviews/` Files

Every comment is saved immediately as an individual Markdown file in `reviews/`:

```text
reviews/
└── review_2026-11-15_17-55-08.md
```

Each file contains YAML metadata (source file path, route, scope, target type, exact quoted text/element context) and the reviewer's comment body under `## Comment`.

:::warning[Never Indexed in Documentation]
Any `reviews/` directory (and the configured `--reviews` directory) is automatically excluded from Markdown routing, MiniSearch indexing, and static asset copying during `build`, `dev`, and `review`.
:::
