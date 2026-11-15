import type { CreateReviewInput, ReviewComment, ReviewScope } from '../types/mdkb.ts'

export interface HighlightRect {
  left: number
  top: number
  width: number
  height: number
}

export interface TextNodeEntry {
  node: Text
  start: number
  end: number
}

export interface TextIndex {
  fullText: string
  entries: TextNodeEntry[]
}

export function buildTextIndex(root: HTMLElement): TextIndex {
  const entries: TextNodeEntry[] = []
  const chunks: string[] = []
  let offset = 0

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement
      if (!parent) return NodeFilter.FILTER_REJECT
      if (parent.closest('[data-review-ui="true"], [data-review-ignore="true"]')) {
        return NodeFilter.FILTER_REJECT
      }
      if (!node.nodeValue) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    },
  })

  let current = walker.nextNode()
  while (current) {
    const textNode = current as Text
    const val = textNode.nodeValue ?? ''
    if (val.length > 0) {
      entries.push({
        node: textNode,
        start: offset,
        end: offset + val.length,
      })
      chunks.push(val)
      offset += val.length
    }
    current = walker.nextNode()
  }

  return {
    fullText: chunks.join(''),
    entries,
  }
}

function getOffsetForPoint(index: TextIndex, targetNode: Node, targetOffset: number): number | null {
  if (targetNode.nodeType === Node.TEXT_NODE) {
    const entry = index.entries.find((e) => e.node === targetNode)
    if (!entry) return null
    return entry.start + Math.min(targetOffset, entry.end - entry.start)
  }

  // Element node: resolve relative to first text node at or after childNodes[targetOffset]
  const child = targetNode.childNodes[targetOffset] ?? targetNode
  const walker = document.createTreeWalker(child, NodeFilter.SHOW_TEXT)
  const firstText = walker.nextNode() as Text | null
  if (firstText) {
    const entry = index.entries.find((e) => e.node === firstText)
    if (entry) return entry.start
  }
  return null
}

function countOccurrencesBefore(haystack: string, needle: string, position: number): number {
  if (!needle) return 0
  let count = 0
  let idx = 0
  while (idx < position) {
    const found = haystack.indexOf(needle, idx)
    if (found === -1 || found >= position) break
    count += 1
    idx = found + Math.max(1, needle.length)
  }
  return count
}

export function extractSelectionInput(
  range: Range,
  scopeRoot: HTMLElement,
  scope: ReviewScope,
  route: string,
  sourceFile: string
): Omit<CreateReviewInput, 'comment'> | null {
  const selectedText = range.toString()
  if (!selectedText.trim()) return null

  const index = buildTextIndex(scopeRoot)
  const startPos = getOffsetForPoint(index, range.startContainer, range.startOffset)
  const endPos = getOffsetForPoint(index, range.endContainer, range.endOffset)

  let contextBefore = ''
  let contextAfter = ''
  let occurrenceIndex = 0

  if (startPos !== null && endPos !== null && endPos >= startPos) {
    contextBefore = index.fullText.slice(Math.max(0, startPos - 40), startPos)
    contextAfter = index.fullText.slice(endPos, Math.min(index.fullText.length, endPos + 40))
    occurrenceIndex = countOccurrencesBefore(index.fullText, selectedText, startPos)
  } else {
    const fallbackIdx = index.fullText.indexOf(selectedText)
    if (fallbackIdx !== -1) {
      contextBefore = index.fullText.slice(Math.max(0, fallbackIdx - 40), fallbackIdx)
      contextAfter = index.fullText.slice(
        fallbackIdx + selectedText.length,
        Math.min(index.fullText.length, fallbackIdx + selectedText.length + 40)
      )
    }
  }

  const startEl =
    range.startContainer.nodeType === Node.ELEMENT_NODE
      ? (range.startContainer as HTMLElement)
      : range.startContainer.parentElement
  const nearestBlock = startEl?.closest('h1,h2,h3,h4,p,li,td,th,blockquote,pre,code,a,span')
  const elementTag = (nearestBlock ?? startEl)?.tagName.toLowerCase()

  const menuLink = startEl?.closest<HTMLElement>('[data-review-menu-item]')
  const targetSrc = menuLink?.getAttribute('data-review-menu-item') ?? undefined

  return {
    route,
    sourceFile,
    scope,
    targetType: 'text',
    selectedText,
    targetSrc,
    elementTag,
    contextBefore,
    contextAfter,
    occurrenceIndex,
  }
}

function scoreCandidate(
  fullText: string,
  matchStart: number,
  matchLength: number,
  before?: string,
  after?: string
): number {
  let score = 0
  if (before) {
    const actualBefore = fullText.slice(Math.max(0, matchStart - before.length), matchStart)
    if (actualBefore === before) score += 100
    else if (actualBefore.endsWith(before.slice(-15))) score += 40
  }
  if (after) {
    const actualAfter = fullText.slice(
      matchStart + matchLength,
      Math.min(fullText.length, matchStart + matchLength + after.length)
    )
    if (actualAfter === after) score += 100
    else if (actualAfter.startsWith(after.slice(0, 15))) score += 40
  }
  return score
}

function findMatchingRange(index: TextIndex, review: ReviewComment): Range | null {
  const needle = review.selectedText
  if (!needle) return null

  const positions: number[] = []
  let searchFrom = 0
  while (searchFrom <= index.fullText.length - needle.length) {
    const pos = index.fullText.indexOf(needle, searchFrom)
    if (pos === -1) break
    positions.push(pos)
    searchFrom = pos + Math.max(1, needle.length)
  }

  // Fallback with trimmed search if exact whitespace did not match
  let matchLen = needle.length
  if (positions.length === 0 && needle.trim() && needle.trim() !== needle) {
    const trimmed = needle.trim()
    matchLen = trimmed.length
    let idx = 0
    while (idx <= index.fullText.length - trimmed.length) {
      const pos = index.fullText.indexOf(trimmed, idx)
      if (pos === -1) break
      positions.push(pos)
      idx = pos + Math.max(1, trimmed.length)
    }
  }

  if (positions.length === 0) return null

  let chosenPos = positions[Math.min(review.occurrenceIndex ?? 0, positions.length - 1)]
  if (positions.length > 1 && (review.contextBefore || review.contextAfter)) {
    let bestScore = -1
    for (const pos of positions) {
      const score = scoreCandidate(
        index.fullText,
        pos,
        matchLen,
        review.contextBefore,
        review.contextAfter
      )
      if (score > bestScore) {
        bestScore = score
        chosenPos = pos
      }
    }
  }

  const endPos = chosenPos + matchLen
  const startEntry = index.entries.find((e) => chosenPos >= e.start && chosenPos < e.end)
  const endEntry = index.entries.find((e) => endPos > e.start && endPos <= e.end)
  if (!startEntry || !endEntry) return null

  const range = document.createRange()
  range.setStart(startEntry.node, chosenPos - startEntry.start)
  range.setEnd(endEntry.node, endPos - endEntry.start)
  return range
}

function toContainerRects(clientRects: DOMRectList | DOMRect[], container: HTMLElement): HighlightRect[] {
  const cRect = container.getBoundingClientRect()
  const scrollLeft = container.scrollLeft
  const scrollTop = container.scrollTop
  const rects: HighlightRect[] = []

  for (const r of Array.from(clientRects)) {
    if (r.width < 2 || r.height < 2) continue
    rects.push({
      left: r.left - cRect.left + scrollLeft,
      top: r.top - cRect.top + scrollTop,
      width: r.width,
      height: r.height,
    })
  }
  return rects
}

export function findTargetElement(container: HTMLElement, review: ReviewComment): HTMLElement | null {
  if (review.targetType === 'image') {
    const images = Array.from(container.querySelectorAll<HTMLElement>('[data-review-target="image"]'))
    const matching = images.filter(
      (el) => !review.targetSrc || el.getAttribute('data-review-src') === review.targetSrc
    )
    if (matching.length === 0) return null
    return matching[Math.min(review.occurrenceIndex ?? 0, matching.length - 1)]
  }

  if (review.targetType === 'mermaid') {
    const diagrams = Array.from(
      container.querySelectorAll<HTMLElement>('[data-review-target="mermaid"]')
    )
    const matching = diagrams.filter(
      (el) =>
        !review.selectedText ||
        el.getAttribute('data-review-mermaid') === review.selectedText.slice(0, 200)
    )
    const pool = matching.length > 0 ? matching : diagrams
    if (pool.length === 0) return null
    return pool[Math.min(review.occurrenceIndex ?? 0, pool.length - 1)]
  }

  if (review.targetType === 'menu-item') {
    if (review.targetSrc) {
      const escaped = CSS.escape(review.targetSrc)
      const byLink = container.querySelector<HTMLElement>(`[data-review-menu-item="${escaped}"]`)
      if (byLink) return byLink
    }
    if (review.selectedText) {
      const escaped = CSS.escape(review.selectedText)
      const byCategory = container.querySelector<HTMLElement>(
        `[data-review-menu-category="${escaped}"]`
      )
      if (byCategory) return byCategory
    }
  }

  return null
}

export function computeReviewHighlightRects(
  container: HTMLElement,
  review: ReviewComment,
  cachedTextIndex?: TextIndex
): HighlightRect[] {
  if (review.targetType === 'text') {
    const index = cachedTextIndex ?? buildTextIndex(container)
    const range = findMatchingRange(index, review)
    if (!range) return []
    return toContainerRects(range.getClientRects(), container)
  }

  const targetEl = findTargetElement(container, review)
  if (!targetEl) return []
  return toContainerRects([targetEl.getBoundingClientRect()], container)
}
