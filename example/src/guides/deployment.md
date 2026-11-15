---
title: Docker & Nginx Deployment
description: Build and serve your static mdkb documentation site with the included two-stage Node Alpine and Nginx Dockerfile.
updatedAt: 2026-11-13
previous:
  label: Search & SEO
  link: /guides/search-and-seo
next:
  label: Interactive Review Mode
  link: /guides/review-mode
---

Because `yarn build` produces pure static files in `dist/`, **mdkb** can be deployed to any static host, CDN, or containerized Nginx server.

## Two-Stage Dockerfile

The repository includes a production-ready `Dockerfile` with two stages:

1. **Builder Stage (`node:24-alpine`)**: Installs dependencies with `yarn install --frozen-lockfile`, copies the project and `example/src/`, and runs `yarn build`.
2. **Runner Stage (`nginx:alpine`)**: Copies only the compiled `/app/dist` static output and `nginx.conf` into a minimal Nginx image.

### Build and Run Locally

```bash
docker build -t mdkb-docs .
docker run --rm -p 8080:80 mdkb-docs
```

Then visit `http://localhost:8080` to browse the production static bundle served by Nginx.

## Nginx SPA & Static Route Routing

The included `nginx.conf` uses:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

This serves pre-generated per-route SEO HTML files (`/guides/index.html`) when matching directories exist, and gracefully falls back to `/index.html` for client-side React Router routes and the 404 page.

:::danger[Production Cache Tip]
Make sure `index.html` is served with short or no caching (`Cache-Control: no-cache`) while hashed assets under `/assets/` are cached long-term (`immutable`). The provided `nginx.conf` already configures this for you.
:::
