import fs from 'node:fs'
import path from 'node:path'
import { dump as dumpYaml, load as loadYaml } from 'js-yaml'
import type {
  CreateReviewInput,
  ReviewComment,
  ReviewScope,
  ReviewTargetType,
} from '../src/types/mdkb.ts'

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function formatReviewDateTimeStamp(date = new Date()): string {
  const yyyy = date.getFullYear()
  const mm = pad2(date.getMonth() + 1)
  const dd = pad2(date.getDate())
  const hh = pad2(date.getHours())
  const min = pad2(date.getMinutes())
  const ss = pad2(date.getSeconds())
  return `${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}`
}

export function sanitizeReviewId(id: string): string | null {
  const cleaned = id.trim().replace(/\.md$/i, '')
  if (!/^[a-zA-Z0-9_-]+$/.test(cleaned)) {
    return null
  }
  return cleaned
}

function allocateReviewFile(reviewsDir: string, now = new Date()): { id: string; fileName: string } {
  const base = `review_${formatReviewDateTimeStamp(now)}`
  let candidateId = base
  let counter = 2

  while (fs.existsSync(path.join(reviewsDir, `${candidateId}.md`))) {
    candidateId = `${base}_${counter}`
    counter += 1
  }

  return {
    id: candidateId,
    fileName: `${candidateId}.md`,
  }
}

function formatBlockquote(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return '  > (empty)'
  return trimmed
    .split(/\r?\n/)
    .map((line) => `  > ${line}`)
    .join('\n')
}

export function serializeReviewMarkdown(review: ReviewComment): string {
  const frontmatterObj: Record<string, unknown> = {
    id: review.id,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    route: review.route,
    sourceFile: review.sourceFile,
    scope: review.scope,
    targetType: review.targetType,
    selectedText: review.selectedText,
  }

  if (review.targetSrc) frontmatterObj.targetSrc = review.targetSrc
  if (review.elementTag) frontmatterObj.elementTag = review.elementTag
  if (review.contextBefore) frontmatterObj.contextBefore = review.contextBefore
  if (review.contextAfter) frontmatterObj.contextAfter = review.contextAfter
  if (typeof review.occurrenceIndex === 'number') {
    frontmatterObj.occurrenceIndex = review.occurrenceIndex
  }

  const yamlText = dumpYaml(frontmatterObj, {
    lineWidth: 120,
    noRefs: true,
  }).trimEnd()

  const details = [
    `- **File**: \`${review.sourceFile}\``,
    `- **Route**: \`${review.route}\``,
    `- **Scope**: \`${review.scope}\` (\`${review.targetType}\`)`,
    review.elementTag ? `- **Element**: \`<${review.elementTag}>\`` : '',
    review.targetSrc ? `- **Asset / Link**: \`${review.targetSrc}\`` : '',
    `- **Target**:\n${formatBlockquote(review.selectedText)}`,
  ]
    .filter(Boolean)
    .join('\n')

  return `---\n${yamlText}\n---\n\n# Review Comment\n\n${details}\n\n## Comment\n\n${review.comment.trim()}\n`
}

export function parseReviewMarkdown(fileName: string, raw: string): ReviewComment | null {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return null

  let meta: Record<string, unknown> = {}
  try {
    const parsed = loadYaml(match[1])
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      meta = parsed as Record<string, unknown>
    }
  } catch {
    return null
  }

  const body = match[2] ?? ''
  const commentMatch = body.match(/##\s+Comment\s*\r?\n+([\s\S]*)$/i)
  const comment = (commentMatch ? commentMatch[1] : body).trim()

  const id =
    typeof meta.id === 'string' && meta.id.trim()
      ? meta.id.trim()
      : fileName.replace(/\.md$/i, '')

  const scope: ReviewScope = meta.scope === 'menu' ? 'menu' : 'page'
  const rawType = typeof meta.targetType === 'string' ? meta.targetType : 'text'
  const targetType: ReviewTargetType =
    rawType === 'image' || rawType === 'mermaid' || rawType === 'menu-item' ? rawType : 'text'

  return {
    id,
    fileName,
    createdAt:
      typeof meta.createdAt === 'string' && meta.createdAt
        ? meta.createdAt
        : new Date().toISOString(),
    updatedAt:
      typeof meta.updatedAt === 'string' && meta.updatedAt
        ? meta.updatedAt
        : new Date().toISOString(),
    route: typeof meta.route === 'string' && meta.route ? meta.route : '/',
    sourceFile: typeof meta.sourceFile === 'string' ? meta.sourceFile : '',
    scope,
    targetType,
    selectedText: typeof meta.selectedText === 'string' ? meta.selectedText : '',
    targetSrc: typeof meta.targetSrc === 'string' ? meta.targetSrc : undefined,
    elementTag: typeof meta.elementTag === 'string' ? meta.elementTag : undefined,
    contextBefore: typeof meta.contextBefore === 'string' ? meta.contextBefore : undefined,
    contextAfter: typeof meta.contextAfter === 'string' ? meta.contextAfter : undefined,
    occurrenceIndex:
      typeof meta.occurrenceIndex === 'number' ? meta.occurrenceIndex : undefined,
    comment,
  }
}

export function listReviews(reviewsDir: string): ReviewComment[] {
  if (!fs.existsSync(reviewsDir)) return []

  const entries = fs.readdirSync(reviewsDir, { withFileTypes: true })
  const reviews: ReviewComment[] = []

  for (const entry of entries) {
    if (!entry.isFile() || !/\.md$/i.test(entry.name)) continue
    const fullPath = path.join(reviewsDir, entry.name)
    try {
      const raw = fs.readFileSync(fullPath, 'utf-8')
      const parsed = parseReviewMarkdown(entry.name, raw)
      if (parsed) {
        reviews.push(parsed)
      }
    } catch {
      // Skip unreadable file
    }
  }

  reviews.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  return reviews
}

export function createReview(reviewsDir: string, input: CreateReviewInput): ReviewComment {
  fs.mkdirSync(reviewsDir, { recursive: true })
  const now = new Date()
  const iso = now.toISOString()
  const { id, fileName } = allocateReviewFile(reviewsDir, now)

  const review: ReviewComment = {
    id,
    fileName,
    createdAt: iso,
    updatedAt: iso,
    route: input.route || '/',
    sourceFile: input.sourceFile || '',
    scope: input.scope === 'menu' ? 'menu' : 'page',
    targetType: input.targetType || 'text',
    selectedText: input.selectedText,
    targetSrc: input.targetSrc,
    elementTag: input.elementTag,
    contextBefore: input.contextBefore,
    contextAfter: input.contextAfter,
    occurrenceIndex: input.occurrenceIndex,
    comment: input.comment.trim(),
  }

  fs.writeFileSync(path.join(reviewsDir, fileName), serializeReviewMarkdown(review), 'utf-8')
  return review
}

export function updateReview(
  reviewsDir: string,
  id: string,
  commentText: string
): ReviewComment | null {
  const safeId = sanitizeReviewId(id)
  if (!safeId) return null

  const fileName = `${safeId}.md`
  const filePath = path.join(reviewsDir, fileName)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  const existing = parseReviewMarkdown(fileName, raw)
  if (!existing) return null

  const updated: ReviewComment = {
    ...existing,
    updatedAt: new Date().toISOString(),
    comment: commentText.trim(),
  }

  fs.writeFileSync(filePath, serializeReviewMarkdown(updated), 'utf-8')
  return updated
}

export function deleteReview(reviewsDir: string, id: string): boolean {
  const safeId = sanitizeReviewId(id)
  if (!safeId) return false

  const filePath = path.join(reviewsDir, `${safeId}.md`)
  if (!fs.existsSync(filePath)) return false

  fs.unlinkSync(filePath)
  return true
}
