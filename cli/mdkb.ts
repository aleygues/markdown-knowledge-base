#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import react from '@vitejs/plugin-react'
import { build, createServer, preview, type InlineConfig } from 'vite'
import { loadMdkbConfig, mdkbPlugin, parseBaseUrl } from '../plugins/vite-plugin-mdkb.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PACKAGE_ROOT = path.resolve(__dirname, '..', '..')

function readPackageVersion(): string {
  try {
    const pkgPath = path.join(PACKAGE_ROOT, 'package.json')
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { version?: string }
    return pkg.version ?? '0.0.0'
  } catch {
    return '0.0.0'
  }
}

function printHelp(): void {
  console.log(`mdkb v${readPackageVersion()} — Markdown Knowledge Base generator

Usage:
  mdkb <command> [options]

Commands:
  build                 Build the static documentation site
  dev                   Start the local development server with HMR
  review                Start the documentation in interactive review mode
  preview               Preview the built static site locally

Options:
  -s, --src <dir>       Source folder containing Markdown files & mdkb.config.json (default: "src")
  -o, --out <dir>       Output directory for the built site (default: "dist")
      --out-dir <dir>   Alias for --out
  -r, --reviews <dir>   Directory where review_*.md files are stored (default: "reviews")
  -c, --config <file>   Path to mdkb.config.json (default: "<src>/mdkb.config.json")
  -p, --port <port>     Port for dev, review, or preview server
      --host <host>     Host to bind dev, review, or preview server
  -h, --help            Show this help message
  -v, --version         Show version number

Examples:
  npx @aleygues/mdkb build
  npx @aleygues/mdkb build --src docs --out build
  npx @aleygues/mdkb dev --src src --port 3000
  npx @aleygues/mdkb review --src src --reviews reviews
`)
}

function normalizeCliArgs(argv: string[]): string[] {
  // Support bare `--host` without value by turning it into `--host=0.0.0.0`
  const out: string[] = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--host' && (i + 1 >= argv.length || argv[i + 1].startsWith('-'))) {
      out.push('--host=0.0.0.0')
    } else {
      out.push(arg)
    }
  }
  return out
}

async function run(): Promise<void> {
  const { values, positionals } = parseArgs({
    args: normalizeCliArgs(process.argv.slice(2)),
    allowPositionals: true,
    options: {
      src: { type: 'string', short: 's' },
      out: { type: 'string', short: 'o' },
      'out-dir': { type: 'string' },
      outDir: { type: 'string' },
      reviews: { type: 'string', short: 'r' },
      config: { type: 'string', short: 'c' },
      port: { type: 'string', short: 'p' },
      host: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
    },
  })

  if (values.version) {
    console.log(readPackageVersion())
    return
  }

  const command = positionals[0]
  if (values.help || !command) {
    printHelp()
    if (!command && !values.help) {
      process.exitCode = 1
    }
    return
  }

  if (command !== 'build' && command !== 'dev' && command !== 'review' && command !== 'preview') {
    console.error(`Unknown command: "${command}"\n`)
    printHelp()
    process.exit(1)
  }

  const cwd = process.cwd()
  const srcArg = values.src ?? 'src'
  const outArg = values.out ?? values['out-dir'] ?? values.outDir ?? 'dist'
  const reviewsArg = values.reviews ?? 'reviews'

  const docsDir = path.resolve(cwd, srcArg)
  const outDir = path.resolve(cwd, outArg)
  const reviewsDir = path.resolve(cwd, reviewsArg)
  const configPath = values.config ? path.resolve(cwd, values.config) : undefined
  const userPublicPath = path.join(cwd, 'public')
  const userPublicDir =
    userPublicPath !== path.join(PACKAGE_ROOT, 'public') && fs.existsSync(userPublicPath)
      ? userPublicPath
      : undefined

  if ((command === 'build' || command === 'dev' || command === 'review') && !fs.existsSync(docsDir)) {
    console.error(
      `Error: Source directory not found: ${docsDir}\nCreate a "${srcArg}" directory with your Markdown files and mdkb.config.json, or pass --src <dir>.`
    )
    process.exit(1)
  }

  if (configPath && !fs.existsSync(configPath)) {
    console.error(`Error: Config file not found: ${configPath}`)
    process.exit(1)
  }

  const mdkbConfig = loadMdkbConfig(cwd, { docsDir, configPath })
  const { viteBase } = parseBaseUrl(mdkbConfig.baseUrl)
  const parsedPort = values.port ? Number.parseInt(values.port, 10) : undefined
  if (values.port && (!parsedPort || Number.isNaN(parsedPort))) {
    console.error(`Error: Invalid port "${values.port}"`)
    process.exit(1)
  }

  const viteConfig: InlineConfig = {
    root: PACKAGE_ROOT,
    configFile: false,
    base: viteBase,
    publicDir: path.join(PACKAGE_ROOT, 'public'),
    plugins: [
      react(),
      mdkbPlugin({
        docsDir,
        configPath,
        cwd,
        userPublicDir,
        reviewMode: command === 'review',
        reviewsDir,
      }),
    ],
    build: {
      outDir,
      emptyOutDir: true,
    },
    server: {
      port: parsedPort,
      host: values.host,
    },
    preview: {
      port: parsedPort,
      host: values.host,
    },
  }

  if (command === 'build') {
    console.log(`[mdkb] Building documentation from ${docsDir} -> ${outDir}`)
    await build(viteConfig)
    console.log(`[mdkb] Static documentation built successfully in ${outDir}`)
    return
  }

  if (command === 'dev' || command === 'review') {
    if (command === 'review') {
      console.log(`[mdkb] Starting review mode (docs: ${docsDir}, reviews: ${reviewsDir})`)
    }
    const server = await createServer(viteConfig)
    await server.listen()
    server.printUrls()
    server.bindCLIShortcuts({ print: true })
    return
  }

  if (command === 'preview') {
    if (!fs.existsSync(outDir)) {
      console.error(
        `Error: Output directory not found: ${outDir}\nRun "mdkb build" first or pass --out <dir>.`
      )
      process.exit(1)
    }
    const previewServer = await preview(viteConfig)
    previewServer.printUrls()
    previewServer.bindCLIShortcuts({ print: true })
  }
}

run().catch((err) => {
  console.error('[mdkb] Error:', err)
  process.exit(1)
})
