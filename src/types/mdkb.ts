export interface MdkbMenuItem {
  label: string
  link: string
}

export interface MdkbMenuCategory {
  category: string
  items: MdkbMenuItem[]
}

export type MdkbLocale = 'en' | 'fr'

export interface MdkbConfig {
  title: string
  description: string
  primaryColor: string
  secondaryColor: string
  logo?: string
  baseUrl?: string
  locale?: string
  menu: MdkbMenuCategory[]
}

export interface PageNavItem {
  label: string
  link: string
}

export interface DocHeading {
  depth: 2 | 3
  text: string
  id: string
}

export type ReviewScope = 'page' | 'menu'
export type ReviewTargetType = 'text' | 'image' | 'mermaid' | 'menu-item'

export interface ReviewComment {
  id: string
  fileName: string
  createdAt: string
  updatedAt: string
  route: string
  sourceFile: string
  scope: ReviewScope
  targetType: ReviewTargetType
  selectedText: string
  targetSrc?: string
  elementTag?: string
  contextBefore?: string
  contextAfter?: string
  occurrenceIndex?: number
  comment: string
}

export interface CreateReviewInput {
  route: string
  sourceFile: string
  scope: ReviewScope
  targetType: ReviewTargetType
  selectedText: string
  targetSrc?: string
  elementTag?: string
  contextBefore?: string
  contextAfter?: string
  occurrenceIndex?: number
  comment: string
}

export interface DocPage {
  route: string
  filePath: string
  sourceFile?: string
  title: string
  description?: string
  updatedAt?: string
  previous: PageNavItem | null
  next: PageNavItem | null
  body: string
  headings: DocHeading[]
  category?: string
  hasInlineH1: boolean
}

export interface SearchDocument {
  id: string
  route: string
  title: string
  description: string
  category: string
  headings: string
  text: string
}

export interface MdkbData {
  config: MdkbConfig
  configFile?: string
  reviewMode?: boolean
  pages: DocPage[]
  searchIndexJson: string
  searchDocs: Record<string, SearchDocument>
}
