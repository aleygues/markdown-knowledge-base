import MiniSearch, { type SearchResult } from 'minisearch'
import { MINISEARCH_OPTIONS } from './searchConfig.ts'
import type { SearchDocument } from '../types/mdkb.ts'

export interface SearchHit {
  route: string
  title: string
  description: string
  category: string
  snippet: string
  terms: string[]
  score: number
}

let cachedIndex: MiniSearch<SearchDocument> | null = null
let cachedJson: string | null = null

export function getSearchIndex(searchIndexJson: string): MiniSearch<SearchDocument> {
  if (!cachedIndex || cachedJson !== searchIndexJson) {
    cachedIndex = MiniSearch.loadJSON<SearchDocument>(searchIndexJson, MINISEARCH_OPTIONS)
    cachedJson = searchIndexJson
  }
  return cachedIndex
}

function buildSnippet(text: string, terms: string[], maxLength = 140): string {
  if (!text) return ''
  const lower = text.toLowerCase()
  let firstMatch = -1

  for (const term of terms) {
    const idx = lower.indexOf(term.toLowerCase())
    if (idx !== -1 && (firstMatch === -1 || idx < firstMatch)) {
      firstMatch = idx
    }
  }

  if (firstMatch === -1) {
    return text.length > maxLength ? text.slice(0, maxLength).trimEnd() + '…' : text
  }

  const start = Math.max(0, firstMatch - 40)
  const end = Math.min(text.length, start + maxLength)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < text.length ? '…' : ''
  return `${prefix}${text.slice(start, end).trim()}${suffix}`
}

export function executeSearch(
  query: string,
  searchIndexJson: string,
  searchDocs: Record<string, SearchDocument>,
  limit = 10
): SearchHit[] {
  const trimmed = query.trim()
  if (!trimmed) return []

  const index = getSearchIndex(searchIndexJson)
  const results: SearchResult[] = index.search(trimmed, {
    boost: { title: 4, headings: 2.5, description: 2, text: 1 },
    fuzzy: 0.2,
    prefix: true,
  })

  return results.slice(0, limit).map((res) => {
    const doc = searchDocs[String(res.id)]
    const title = String(res.title ?? doc?.title ?? '')
    const description = String(res.description ?? doc?.description ?? '')
    const category = String(res.category ?? doc?.category ?? 'Documentation')
    const route = String(res.route ?? doc?.route ?? '/')
    const fullText = doc?.text ?? description
    const terms = Array.isArray(res.terms) ? res.terms.map(String) : [trimmed]

    return {
      route,
      title,
      description,
      category,
      snippet: buildSnippet(fullText, terms),
      terms,
      score: res.score,
    }
  })
}
