import { useEffect } from 'react'
import type { MdkbTranslations } from '../lib/i18n.ts'
import type { DocPage, MdkbConfig } from '../types/mdkb.ts'

interface SeoHeadProps {
  page?: DocPage
  config: MdkbConfig
  basename: string
  origin: string
  t: MdkbTranslations
}

function upsertMeta(selector: string, attrs: Record<string, string>, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value)
    }
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export function SeoHead({ page, config, basename, origin, t }: SeoHeadProps) {
  useEffect(() => {
    const title = page
      ? page.route === '/'
        ? `${page.title} — ${config.title}`
        : `${page.title} | ${config.title}`
      : `${t.notFoundSeoTitle} | ${config.title}`

    const description = page?.description ?? config.description
    const runtimeOrigin = origin || window.location.origin
    const prefix = basename === '/' ? '' : basename
    const routePath = page ? page.route : window.location.pathname
    const canonicalPath = `${prefix}${routePath === '/' ? '/' : routePath}`.replace(/\/+/g, '/')
    const canonicalUrl = `${runtimeOrigin}${canonicalPath}`

    document.documentElement.lang = t.htmlLang
    document.title = title

    upsertMeta('meta[name="description"]', { name: 'description' }, description)
    upsertMeta('meta[name="theme-color"]', { name: 'theme-color' }, config.primaryColor)
    upsertMeta(
      'meta[property="og:type"]',
      { property: 'og:type' },
      page && page.route !== '/' ? 'article' : 'website'
    )
    upsertMeta(
      'meta[property="og:locale"]',
      { property: 'og:locale' },
      t.locale === 'fr' ? 'fr_FR' : 'en_US'
    )
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name' }, config.title)
    upsertMeta('meta[property="og:title"]', { property: 'og:title' }, title)
    upsertMeta('meta[property="og:description"]', { property: 'og:description' }, description)
    upsertMeta('meta[property="og:url"]', { property: 'og:url' }, canonicalUrl)
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary')
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, title)
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, description)
    upsertLink('canonical', canonicalUrl)

    let ldScript = document.head.querySelector<HTMLScriptElement>('script[data-mdkb-ld]')
    if (!ldScript) {
      ldScript = document.createElement('script')
      ldScript.type = 'application/ld+json'
      ldScript.setAttribute('data-mdkb-ld', 'true')
      document.head.appendChild(ldScript)
    }

    const structuredData = page
      ? {
          '@context': 'https://schema.org',
          '@type': 'TechArticle',
          headline: page.title,
          description,
          url: canonicalUrl,
          dateModified: page.updatedAt,
          isPartOf: {
            '@type': 'WebSite',
            name: config.title,
            url: `${runtimeOrigin}${prefix || '/'}`,
          },
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: config.title,
          description: config.description,
        }

    ldScript.textContent = JSON.stringify(structuredData)
  }, [basename, config, origin, page, t])

  return null
}
