export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim())
}

export function parseRuntimeBaseUrl(baseUrl?: string): {
  basename: string
  assetBase: string
  origin: string
} {
  const raw = (baseUrl ?? '/').trim()
  if (!raw || raw === '/') {
    return { basename: '/', assetBase: '/', origin: '' }
  }

  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw)
      const pathname = parsed.pathname.replace(/\/+$/, '') || '/'
      const assetBase = pathname === '/' ? '/' : `${pathname}/`
      return { basename: pathname, assetBase, origin: parsed.origin }
    } catch {
      return { basename: '/', assetBase: '/', origin: '' }
    }
  }

  const normalized = '/' + raw.replace(/^\/+|\/+$/g, '')
  return {
    basename: normalized,
    assetBase: normalized === '/' ? '/' : `${normalized}/`,
    origin: '',
  }
}

export function resolveAssetUrl(assetPath: string | undefined, assetBase: string): string | undefined {
  if (!assetPath) return undefined
  if (/^(https?:\/\/|data:|blob:)/i.test(assetPath)) return assetPath
  const cleanAsset = assetPath.replace(/^\/+/, '')
  const cleanBase = assetBase.endsWith('/') ? assetBase : `${assetBase}/`
  return `${cleanBase}${cleanAsset}`
}
