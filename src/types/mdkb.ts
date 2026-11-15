export interface MdkbMenuItem {
  label: string
  link: string
}

export interface MdkbMenuCategory {
  category: string
  items: MdkbMenuItem[]
}

export interface MdkbConfig {
  title: string
  description: string
  primaryColor: string
  secondaryColor: string
  logo?: string
  baseUrl?: string
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

export interface DocPage {
  route: string
  filePath: string
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
  pages: DocPage[]
  searchIndexJson: string
  searchDocs: Record<string, SearchDocument>
}
