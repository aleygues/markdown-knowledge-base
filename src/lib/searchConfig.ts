import type { Options } from 'minisearch'
import type { SearchDocument } from '../types/mdkb.ts'

export const MINISEARCH_OPTIONS: Options<SearchDocument> = {
  fields: ['title', 'description', 'headings', 'text'],
  storeFields: ['id', 'route', 'title', 'description', 'category', 'text'],
  searchOptions: {
    boost: {
      title: 4,
      headings: 2.5,
      description: 2,
      text: 1,
    },
    fuzzy: 0.2,
    prefix: true,
  },
}
