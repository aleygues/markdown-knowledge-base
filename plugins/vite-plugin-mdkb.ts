import fs from 'node:fs'
import path from 'node:path'
import { load as loadYaml } from 'js-yaml'
import MiniSearch from 'minisearch'
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'
import { MINISEARCH_OPTIONS } from '../src/lib/searchConfig.ts'
import { createHeadingSlugger } from '../src/lib/slugger.ts'
import type {
  DocHeading,
  DocPage,
  MdkbConfig,
  MdkbData,
  MdkbMenuCategory,
  MdkbMenuItem,
  PageNavItem,
  SearchDocument,
} from '../src/types/mdkb.ts'

const VIRTUAL_MODULE_ID = 'virtual:mdkb-data'
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

export interface MdkbPluginOptions {
  docsDir?: string
  configPath?: string
  cwd?: string
  userPublicDir?: string
}

interface RawFrontmatterNav {
  label?: unknown
  title?: unknown
  link?: unknown
  to?: unknown
  href?: unknown
}

const DEFAULT_CONFIG: MdkbConfig = {
  title: 'mdkb Documentation',
  description: 'Interactive documentation built from Markdown files.',
  primaryColor: '#0ea5e9',
  secondaryColor: '#6366f1',
  logo: '/logo.svg',
  baseUrl: '/',
  locale: 'en',
  menu: [],
}

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href.trim())
}

export function parseBaseUrl(baseUrl?: string): {
  viteBase: string
  routerBasename: string
  origin: string
} {
  const raw = (baseUrl ?? '/').trim()
  if (!raw || raw === '/') {
    return { viteBase: '/', routerBasename: '/', origin: '' }
  }

  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw)
      const pathname = parsed.pathname.replace(/\/+$/, '') || '/'
      const viteBase = pathname === '/' ? '/' : `${pathname}/`
      return {
        viteBase,
        routerBasename: pathname,
        origin: parsed.origin,
      }
    } catch {
      return { viteBase: '/', routerBasename: '/', origin: '' }
    }
  }

  const normalized = '/' + raw.replace(/^\/+|\/+$/g, '')
  return {
    viteBase: normalized === '/' ? '/' : `${normalized}/`,
    routerBasename: normalized,
    origin: '',
  }
}

function normalizeRoute(routePath: string): string {
  if (!routePath) return '/'
  if (isExternalHref(routePath)) return routePath.trim()
  const cleaned = routePath.trim().replace(/\\/g, '/')
  const withoutExt = cleaned.replace(/\.md$/i, '').replace(/\/index$/i, '')
  const normalized = '/' + withoutExt.replace(/^\/+|\/+$/g, '')
  return normalized === '' ? '/' : normalized
}

function normalizeMenu(rawMenu: unknown): MdkbMenuCategory[] {
  if (!Array.isArray(rawMenu)) return []

  const categories: MdkbMenuCategory[] = []
  const uncategorized: MdkbMenuItem[] = []

  for (const entry of rawMenu) {
    if (!entry || typeof entry !== 'object') continue
    const obj = entry as Record<string, unknown>

    if (Array.isArray(obj.items)) {
      const categoryName =
        typeof obj.category === 'string'
          ? obj.category
          : typeof obj.title === 'string'
            ? obj.title
            : 'Documentation'

      const items: MdkbMenuItem[] = []
      for (const rawItem of obj.items) {
        if (!rawItem || typeof rawItem !== 'object') continue
        const item = rawItem as Record<string, unknown>
        const linkRaw =
          typeof item.link === 'string'
            ? item.link
            : typeof item.href === 'string'
              ? item.href
              : typeof item.to === 'string'
                ? item.to
                : ''
        if (!linkRaw) continue
        const external = isExternalHref(linkRaw)
        const label =
          typeof item.label === 'string'
            ? item.label
            : typeof item.title === 'string'
              ? item.title
              : linkRaw

        items.push({
          label,
          link: external ? linkRaw.trim() : normalizeRoute(linkRaw),
        })
      }

      if (items.length > 0) {
        categories.push({ category: categoryName, items })
      }
    } else {
      const linkRaw =
        typeof obj.link === 'string'
          ? obj.link
          : typeof obj.href === 'string'
            ? obj.href
            : typeof obj.to === 'string'
              ? obj.to
              : ''
      if (!linkRaw) continue
      const external = isExternalHref(linkRaw)
      const label =
        typeof obj.label === 'string'
          ? obj.label
          : typeof obj.title === 'string'
            ? obj.title
            : linkRaw
      uncategorized.push({
        label,
        link: external ? linkRaw.trim() : normalizeRoute(linkRaw),
      })
    }
  }

  if (uncategorized.length > 0) {
    categories.unshift({ category: 'Pages', items: uncategorized })
  }

  return categories
}

export function resolveConfigFile(
  docsDir: string,
  explicitConfigPath?: string,
  fallbackRootDir?: string
): string | null {
  const candidates: string[] = []
  if (explicitConfigPath) {
    candidates.push(explicitConfigPath)
  }
  candidates.push(path.join(docsDir, 'mdkb.config.json'))
  if (fallbackRootDir) {
    candidates.push(path.join(fallbackRootDir, 'mdkb.config.json'))
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate
    }
  }
  return null
}

export function loadMdkbConfig(
  rootDir: string,
  options?: { docsDir?: string; configPath?: string }
): MdkbConfig {
  const docsDir = options?.docsDir ? path.resolve(options.docsDir) : path.join(rootDir, 'src')
  const configPath = resolveConfigFile(docsDir, options?.configPath, rootDir)

  if (configPath) {
    try {
      const raw = fs.readFileSync(configPath, 'utf-8')
      const parsed = JSON.parse(raw) as Record<string, unknown>
      return {
        title:
          typeof parsed.title === 'string' && parsed.title.trim()
            ? parsed.title.trim()
            : DEFAULT_CONFIG.title,
        description:
          typeof parsed.description === 'string' && parsed.description.trim()
            ? parsed.description.trim()
            : DEFAULT_CONFIG.description,
        primaryColor:
          typeof parsed.primaryColor === 'string' && parsed.primaryColor.trim()
            ? parsed.primaryColor.trim()
            : typeof parsed.primary === 'string' && parsed.primary.trim()
              ? parsed.primary.trim()
              : DEFAULT_CONFIG.primaryColor,
        secondaryColor:
          typeof parsed.secondaryColor === 'string' && parsed.secondaryColor.trim()
            ? parsed.secondaryColor.trim()
            : typeof parsed.secondary === 'string' && parsed.secondary.trim()
              ? parsed.secondary.trim()
              : DEFAULT_CONFIG.secondaryColor,
        logo:
          typeof parsed.logo === 'string' && parsed.logo.trim()
            ? parsed.logo.trim()
            : DEFAULT_CONFIG.logo,
        baseUrl:
          typeof parsed.baseUrl === 'string' && parsed.baseUrl.trim()
            ? parsed.baseUrl.trim()
            : typeof parsed.baseURL === 'string' && parsed.baseURL.trim()
              ? parsed.baseURL.trim()
              : DEFAULT_CONFIG.baseUrl,
        locale:
          typeof parsed.locale === 'string' && parsed.locale.trim()
            ? parsed.locale.trim()
            : typeof parsed.lang === 'string' && parsed.lang.trim()
              ? parsed.lang.trim()
              : DEFAULT_CONFIG.locale,
        menu: normalizeMenu(parsed.menu),
      }
    } catch (err) {
      console.warn(`[mdkb] Failed to parse ${configPath}:`, err)
    }
  }

  return DEFAULT_CONFIG
}

function collectMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectMarkdownFiles(fullPath))
    } else if (entry.isFile() && /\.md$/i.test(entry.name)) {
      files.push(fullPath)
    }
  }

  return files.sort()
}

function copyNonMarkdownAssets(
  srcDir: string,
  outDir: string,
  skipNames: Set<string>
): void {
  if (!fs.existsSync(srcDir)) return
  const entries = fs.readdirSync(srcDir, { withFileTypes: true })

  for (const entry of entries) {
    if (skipNames.has(entry.name)) continue
    const srcPath = path.join(srcDir, entry.name)
    const destPath = path.join(outDir, entry.name)

    if (entry.isDirectory()) {
      copyNonMarkdownAssets(srcPath, destPath, new Set())
    } else if (entry.isFile() && !/\.md$/i.test(entry.name)) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true })
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

function filePathToRoute(docsDir: string, filePath: string): string {
  const rel = path.relative(docsDir, filePath).replace(/\\/g, '/')
  const withoutExt = rel.replace(/\.md$/i, '')
  if (withoutExt === 'index') return '/'
  if (withoutExt.endsWith('/index')) {
    return '/' + withoutExt.slice(0, -'/index'.length)
  }
  return '/' + withoutExt
}

function formatFallbackTitle(route: string): string {
  if (route === '/') return 'Home'
  const segment = route.split('/').filter(Boolean).pop() ?? 'Documentation'
  return segment
    .split(/[-_]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function parseFrontmatter(raw: string): {
  data: Record<string, unknown>
  body: string
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) {
    return { data: {}, body: raw }
  }

  try {
    const parsed = loadYaml(match[1])
    const data =
      parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {}
    return { data, body: raw.slice(match[0].length) }
  } catch (err) {
    console.warn('[mdkb] Invalid YAML frontmatter:', err)
    return { data: {}, body: raw.slice(match[0].length) }
  }
}

function stripLeadingH1(body: string): {
  leadingH1?: string
  strippedBody: string
} {
  const match = body.match(/^\s*#\s+([^\n]+)\r?\n+/)
  if (!match) return { strippedBody: body }
  return {
    leadingH1: match[1].trim(),
    strippedBody: body.slice(match[0].length),
  }
}

function extractHeadings(markdownBody: string): DocHeading[] {
  const headings: DocHeading[] = []
  const slugger = createHeadingSlugger()
  const lines = markdownBody.split(/\r?\n/)
  let inFence = false
  let fenceChar = ''

  for (const line of lines) {
    const fenceMatch = line.match(/^\s*(```+|~~~+)/)
    if (fenceMatch) {
      const marker = fenceMatch[1][0]
      if (!inFence) {
        inFence = true
        fenceChar = marker
      } else if (marker === fenceChar) {
        inFence = false
        fenceChar = ''
      }
      continue
    }
    if (inFence) continue

    const headingMatch = line.match(/^(#{2,3})\s+(.+?)\s*#*\s*$/)
    if (headingMatch) {
      const depth = headingMatch[1].length as 2 | 3
      const rawText = headingMatch[2]
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[*_~]/g, '')
        .trim()
      if (rawText) {
        headings.push({
          depth,
          text: rawText,
          id: slugger(rawText),
        })
      }
    }
  }

  return headings
}

function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/^:::\s*\w+(?:\[([^\]]*)\])?/gm, '$1 ')
    .replace(/^:::\s*$/gm, ' ')
    .replace(/```[\s\S]*?```/g, (block) =>
      block.replace(/^```[^\n]*\n?/, '').replace(/```$/, '')
    )
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\[!(INFO|NOTE|TIP|WARNING|CAUTION|DANGER)\]/gi, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/[*_~>-]{2,}/g, ' ')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeFrontmatterNav(
  raw: unknown
): { disabled: true } | { link: string; label?: string } | null {
  if (raw === false) return { disabled: true }
  if (!raw) return null
  if (typeof raw === 'string') {
    const external = isExternalHref(raw)
    return { link: external ? raw.trim() : normalizeRoute(raw) }
  }
  if (typeof raw === 'object') {
    const obj = raw as RawFrontmatterNav
    const linkRaw =
      typeof obj.link === 'string'
        ? obj.link
        : typeof obj.to === 'string'
          ? obj.to
          : typeof obj.href === 'string'
            ? obj.href
            : ''
    if (!linkRaw) return null
    const external = isExternalHref(linkRaw)
    const label =
      typeof obj.label === 'string'
        ? obj.label
        : typeof obj.title === 'string'
          ? obj.title
          : undefined
    return {
      link: external ? linkRaw.trim() : normalizeRoute(linkRaw),
      label,
    }
  }
  return null
}

function formatUpdatedAt(value: unknown): string | undefined {
  if (!value) return undefined
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }
  return undefined
}

function buildMdkbData(
  fallbackRootDir: string,
  docsDir: string,
  configPath?: string
): MdkbData {
  const config = loadMdkbConfig(fallbackRootDir, { docsDir, configPath })
  const files = collectMarkdownFiles(docsDir)

  const routeCategoryMap = new Map<string, string>()
  const flattenedMenu: MdkbMenuItem[] = []
  for (const cat of config.menu) {
    for (const item of cat.items) {
      if (!isExternalHref(item.link)) {
        const norm = normalizeRoute(item.link)
        if (!routeCategoryMap.has(norm)) {
          routeCategoryMap.set(norm, cat.category)
        }
        flattenedMenu.push({ ...item, link: norm })
      }
    }
  }

  interface PendingPage {
    page: DocPage
    rawPrev: ReturnType<typeof normalizeFrontmatterNav>
    rawNext: ReturnType<typeof normalizeFrontmatterNav>
    plainText: string
  }

  const pendingPages: PendingPage[] = []

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const route = filePathToRoute(docsDir, filePath)
    const { data, body } = parseFrontmatter(raw)
    const { leadingH1, strippedBody } = stripLeadingH1(body)

    const frontmatterTitle =
      typeof data.title === 'string' && data.title.trim()
        ? data.title.trim()
        : undefined

    const title = frontmatterTitle ?? leadingH1 ?? formatFallbackTitle(route)
    const effectiveBody =
      frontmatterTitle && leadingH1 && leadingH1.toLowerCase() === frontmatterTitle.toLowerCase()
        ? strippedBody
        : frontmatterTitle
          ? body
          : strippedBody

    const plainText = markdownToPlainText(effectiveBody)
    const description =
      typeof data.description === 'string' && data.description.trim()
        ? data.description.trim()
        : plainText.slice(0, 160).trim() || undefined

    const updatedAt = formatUpdatedAt(
      data.updatedAt ?? data.updated_at ?? data.updated
    )

    const headings = extractHeadings(effectiveBody)
    const category =
      (typeof data.category === 'string' && data.category.trim()) ||
      routeCategoryMap.get(route) ||
      'Documentation'

    pendingPages.push({
      page: {
        route,
        filePath: path.relative(docsDir, filePath).replace(/\\/g, '/'),
        title,
        description,
        updatedAt,
        previous: null,
        next: null,
        body: effectiveBody,
        headings,
        category,
        hasInlineH1: false,
      },
      rawPrev: normalizeFrontmatterNav(data.previous ?? data.prev),
      rawNext: normalizeFrontmatterNav(data.next),
      plainText,
    })
  }

  const pageByRoute = new Map<string, DocPage>(
    pendingPages.map((p) => [p.page.route, p.page])
  )

  const resolveNav = (
    spec: ReturnType<typeof normalizeFrontmatterNav>,
    fallbackItem: MdkbMenuItem | undefined
  ): PageNavItem | null => {
    if (spec && 'disabled' in spec) return null
    if (spec) {
      const target = isExternalHref(spec.link) ? undefined : pageByRoute.get(spec.link)
      return {
        label: spec.label ?? target?.title ?? formatFallbackTitle(spec.link),
        link: spec.link,
      }
    }
    if (fallbackItem) {
      const target = pageByRoute.get(fallbackItem.link)
      return {
        label: fallbackItem.label || target?.title || formatFallbackTitle(fallbackItem.link),
        link: fallbackItem.link,
      }
    }
    return null
  }

  for (const item of pendingPages) {
    const menuIdx = flattenedMenu.findIndex((m) => m.link === item.page.route)
    const prevFallback = menuIdx > 0 ? flattenedMenu[menuIdx - 1] : undefined
    const nextFallback =
      menuIdx >= 0 && menuIdx < flattenedMenu.length - 1
        ? flattenedMenu[menuIdx + 1]
        : undefined

    item.page.previous = resolveNav(item.rawPrev, prevFallback)
    item.page.next = resolveNav(item.rawNext, nextFallback)
  }

  if (config.menu.length === 0 && pendingPages.length > 0) {
    config.menu = [
      {
        category: 'Documentation',
        items: pendingPages.map((p) => ({
          label: p.page.title,
          link: p.page.route,
        })),
      },
    ]
  }

  const searchDocuments: SearchDocument[] = pendingPages.map(({ page, plainText }) => ({
    id: page.route,
    route: page.route,
    title: page.title,
    description: page.description ?? '',
    category: page.category ?? 'Documentation',
    headings: page.headings.map((h) => h.text).join(' '),
    text: plainText,
  }))

  const miniSearch = new MiniSearch<SearchDocument>(MINISEARCH_OPTIONS)
  miniSearch.addAll(searchDocuments)

  const searchDocs: Record<string, SearchDocument> = {}
  for (const doc of searchDocuments) {
    searchDocs[doc.id] = doc
  }

  return {
    config,
    pages: pendingPages.map((p) => p.page),
    searchIndexJson: JSON.stringify(miniSearch),
    searchDocs,
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function injectSeoMeta(
  html: string,
  page: DocPage | undefined,
  config: MdkbConfig,
  origin: string,
  routerBasename: string
): string {
  const pageTitle = page
    ? page.route === '/'
      ? `${page.title} — ${config.title}`
      : `${page.title} | ${config.title}`
    : config.title
  const description = page?.description ?? config.description
  const basePath = routerBasename === '/' ? '' : routerBasename
  const routePath = page ? (page.route === '/' ? '/' : page.route) : '/'
  const canonicalPath = `${basePath}${routePath}`.replace(/\/+/g, '/')
  const canonicalUrl = origin ? `${origin}${canonicalPath}` : canonicalPath

  const htmlLang = config.locale?.trim().toLowerCase().startsWith('fr') ? 'fr' : 'en'
  const ogLocale = htmlLang === 'fr' ? 'fr_FR' : 'en_US'

  const metaBlock = [
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta name="theme-color" content="${escapeHtml(config.primaryColor)}" />`,
    `<meta property="og:type" content="${page && page.route !== '/' ? 'article' : 'website'}" />`,
    `<meta property="og:locale" content="${ogLocale}" />`,
    `<meta property="og:site_name" content="${escapeHtml(config.title)}" />`,
    `<meta property="og:title" content="${escapeHtml(pageTitle)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    origin ? `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />` : '',
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${escapeHtml(pageTitle)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    origin ? `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />` : '',
  ]
    .filter(Boolean)
    .join('\n    ')

  let updated = html.replace(/<html(\s+[^>]*)?>/i, (match, attrs = '') => {
    if (/\blang\s*=/i.test(attrs)) {
      return match.replace(/\blang\s*=\s*"[^"]*"/i, `lang="${htmlLang}"`)
    }
    return `<html lang="${htmlLang}"${attrs}>`
  })
  updated = updated.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(pageTitle)}</title>`)
  updated = updated.replace('</head>', `    ${metaBlock}\n  </head>`)
  return updated
}

const MIME_TYPES: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
}

export function mdkbPlugin(options: MdkbPluginOptions = {}): Plugin {
  let resolvedConfig: ResolvedConfig | null = null
  let rootDir = process.cwd()

  const getDocsDir = () =>
    options.docsDir ? path.resolve(options.docsDir) : path.join(rootDir, 'src')

  const getFallbackConfigRoot = () =>
    options.cwd ? path.resolve(options.cwd) : rootDir

  return {
    name: 'vite-plugin-mdkb',

    config() {
      return {
        build: {
          rolldownOptions: {
            output: {
              codeSplitting: {
                groups: [
                  {
                    name: 'vendor-react',
                    test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/,
                    priority: 30,
                  },
                  {
                    name: 'vendor-chakra',
                    test: /node_modules[\\/](@chakra-ui|@ark-ui|@zag-js|@emotion)[\\/]/,
                    priority: 25,
                  },
                  {
                    name: 'vendor-icons',
                    test: /node_modules[\\/]lucide-react[\\/]/,
                    priority: 20,
                  },
                  {
                    name: 'vendor-markdown',
                    test: /node_modules[\\/](react-markdown|remark|rehype|unified|mdast|hast|micromark|unist|vfile|property-information)[\\/]/,
                    priority: 15,
                  },
                  {
                    name: 'vendor-search',
                    test: /node_modules[\\/]minisearch[\\/]/,
                    priority: 15,
                  },
                ],
              },
            },
          },
        },
      }
    },

    configResolved(config) {
      resolvedConfig = config
      rootDir = config.root
    },

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID
      }
      return null
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        const data = buildMdkbData(getFallbackConfigRoot(), getDocsDir(), options.configPath)
        return `export default ${JSON.stringify(data)};`
      }
      return null
    },

    configureServer(server: ViteDevServer) {
      const docsDir = getDocsDir()
      server.watcher.add(docsDir)
      if (options.configPath) {
        server.watcher.add(path.resolve(options.configPath))
      }

      // Serve user static assets from userPublicDir and non-md assets from docsDir
      const staticDirs = [options.userPublicDir, docsDir].filter(
        (d): d is string => Boolean(d && fs.existsSync(d))
      )
      if (staticDirs.length > 0) {
        server.middlewares.use((req, res, next) => {
          const urlPath = (req.url ?? '').split('?')[0]
          if (!urlPath || urlPath === '/' || /\.md$/i.test(urlPath) || urlPath.endsWith('mdkb.config.json')) {
            return next()
          }

          const relPath = decodeURIComponent(urlPath).replace(/^\/+/, '')
          for (const dir of staticDirs) {
            const candidate = path.resolve(dir, relPath)
            if (
              candidate.startsWith(path.resolve(dir) + path.sep) &&
              fs.existsSync(candidate) &&
              fs.statSync(candidate).isFile()
            ) {
              const ext = path.extname(candidate).toLowerCase()
              res.setHeader('Content-Type', MIME_TYPES[ext] ?? 'application/octet-stream')
              fs.createReadStream(candidate).pipe(res)
              return
            }
          }
          next()
        })
      }

      const reloadDocs = (file: string) => {
        const normalized = path.resolve(file)
        const configMatch =
          options.configPath && normalized === path.resolve(options.configPath)
        if (
          normalized.startsWith(docsDir + path.sep) ||
          normalized.endsWith('mdkb.config.json') ||
          configMatch
        ) {
          const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID)
          if (mod) {
            server.moduleGraph.invalidateModule(mod)
          }
          server.ws.send({ type: 'full-reload' })
        }
      }

      server.watcher.on('add', reloadDocs)
      server.watcher.on('change', reloadDocs)
      server.watcher.on('unlink', reloadDocs)
    },

    closeBundle() {
      if (!resolvedConfig || resolvedConfig.command !== 'build') return

      const outDir = path.resolve(rootDir, resolvedConfig.build.outDir)
      const indexHtmlPath = path.join(outDir, 'index.html')
      if (!fs.existsSync(indexHtmlPath)) return

      const docsDir = getDocsDir()
      const data = buildMdkbData(getFallbackConfigRoot(), docsDir, options.configPath)
      const { origin, routerBasename } = parseBaseUrl(data.config.baseUrl)
      const baseHtml = fs.readFileSync(indexHtmlPath, 'utf-8')

      // Copy user static assets from docsDir (non-md, non-config) and userPublicDir
      copyNonMarkdownAssets(docsDir, outDir, new Set(['mdkb.config.json']))
      if (options.userPublicDir && fs.existsSync(options.userPublicDir)) {
        copyNonMarkdownAssets(options.userPublicDir, outDir, new Set())
      }

      // Enhance root index.html for home route
      const homePage = data.pages.find((p) => p.route === '/') ?? data.pages[0]
      fs.writeFileSync(
        indexHtmlPath,
        injectSeoMeta(baseHtml, homePage, data.config, origin, routerBasename),
        'utf-8'
      )

      // Generate static per-route index.html for SEO crawlers
      for (const page of data.pages) {
        if (page.route === '/') continue
        const routeDir = path.join(outDir, page.route.replace(/^\/+/, ''))
        fs.mkdirSync(routeDir, { recursive: true })
        fs.writeFileSync(
          path.join(routeDir, 'index.html'),
          injectSeoMeta(baseHtml, page, data.config, origin, routerBasename),
          'utf-8'
        )
      }

      // Generate sitemap.xml & robots.txt
      const basePath = routerBasename === '/' ? '' : routerBasename
      const urlPrefix = origin ? `${origin}${basePath}` : basePath
      const urls = data.pages
        .map((page) => {
          const loc = `${urlPrefix}${page.route === '/' ? '/' : page.route}`.replace(
            /(?<!:)\/+/g,
            '/'
          )
          const lastmod = page.updatedAt
            ? `\n    <lastmod>${escapeHtml(page.updatedAt)}</lastmod>`
            : ''
          return `  <url>\n    <loc>${escapeHtml(loc)}</loc>${lastmod}\n  </url>`
        })
        .join('\n')

      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
      fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemapXml, 'utf-8')

      const robotsTxt = origin
        ? `User-agent: *\nAllow: /\nSitemap: ${origin}${basePath}/sitemap.xml\n`
        : `User-agent: *\nAllow: /\n`
      fs.writeFileSync(path.join(outDir, 'robots.txt'), robotsTxt, 'utf-8')
    },
  }
}
