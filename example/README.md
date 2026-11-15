# mdkb Example Documentation

This folder contains a self-contained example documentation project using the standard `@aleygues/mdkb` directory layout:

```text
example/
└── src/
    ├── mdkb.config.json
    ├── index.md
    ├── getting-started.md
    └── guides/
        ├── index.md
        ├── configuration.md
        ├── markdown-features.md
        ├── search-and-seo.md
        └── deployment.md
```

## Compile using `@aleygues/mdkb`

From inside `example/` (uses default `--src src` and `--out dist`):

```bash
cd example
npx @aleygues/mdkb build
```

Or run the development / preview server:

```bash
cd example
npx @aleygues/mdkb dev
# or after building:
npx @aleygues/mdkb preview
```

From the repository root, you can also target `example/src` explicitly:

```bash
npx @aleygues/mdkb build --src example/src --out example/dist
```

Or use the repository's root Vite scripts (which are wired to `example/src`):

```bash
yarn dev      # Vite dev server
yarn build    # Builds CLI + static site into dist/
yarn preview  # Preview dist/
```
