import type { MdkbLocale } from '../types/mdkb.ts'

export interface MdkbTranslations {
  locale: MdkbLocale
  htmlLang: string
  dateLocale: string
  skipToContent: string
  footerBuiltWith: string
  openNavMenu: string
  closeNavMenu: string
  navAriaLabel: string
  logoAlt: (title: string) => string
  searchLabel: string
  searchButtonPlaceholder: string
  switchToLight: string
  switchToDark: string
  onThisPage: string
  updatedOn: (formattedDate: string) => string
  paginationAriaLabel: string
  previous: string
  next: string
  searchTitle: string
  searchQueryLabel: string
  searchInputPlaceholder: string
  closeSearch: string
  searchEmptyPrompt: string
  noResultsFor: (query: string) => string
  noResultsHint: string
  searchResultsLabel: string
  kbdNavigate: string
  kbdOpen: string
  kbdClose: string
  poweredBy: string
  copyCode: string
  copiedCode: string
  copyCodeAriaLabel: string
  copiedCodeAriaLabel: string
  linkToSection: (section: string) => string
  zoomImage: string
  closeLightbox: string
  lightboxTitle: string
  mermaidLoading: string
  mermaidRenderError: string
  callout: {
    info: string
    warning: string
    danger: string
  }
  notFoundTitle: string
  notFoundDescription: string
  backToHome: string
  searchDocs: string
  notFoundSeoTitle: string
}

const TRANSLATIONS: Record<MdkbLocale, MdkbTranslations> = {
  en: {
    locale: 'en',
    htmlLang: 'en',
    dateLocale: 'en-US',
    skipToContent: 'Skip to main content',
    footerBuiltWith: 'Built with mdkb • Markdown Knowledge Base',
    openNavMenu: 'Open navigation menu',
    closeNavMenu: 'Close navigation menu',
    navAriaLabel: 'Documentation navigation',
    logoAlt: (title) => `${title} logo`,
    searchLabel: 'Search documentation',
    searchButtonPlaceholder: 'Search docs…',
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode',
    onThisPage: 'On this page',
    updatedOn: (formattedDate) => `Updated ${formattedDate}`,
    paginationAriaLabel: 'Page pagination',
    previous: 'Previous',
    next: 'Next',
    searchTitle: 'Search documentation',
    searchQueryLabel: 'Search documentation query',
    searchInputPlaceholder: 'Search pages, headings, and content…',
    closeSearch: 'Close search',
    searchEmptyPrompt: 'Type keywords to search across all pre-indexed Markdown pages.',
    noResultsFor: (query) => `No results found for “${query}”`,
    noResultsHint: 'Try a different keyword or check spelling.',
    searchResultsLabel: 'Search results',
    kbdNavigate: 'Navigate',
    kbdOpen: 'Open',
    kbdClose: 'Close',
    poweredBy: 'Powered by MiniSearch',
    copyCode: 'Copy',
    copiedCode: 'Copied',
    copyCodeAriaLabel: 'Copy code to clipboard',
    copiedCodeAriaLabel: 'Copied code to clipboard',
    linkToSection: (section) => `Link to section ${section}`,
    zoomImage: 'Click to enlarge image',
    closeLightbox: 'Close image preview',
    lightboxTitle: 'Image preview',
    mermaidLoading: 'Rendering diagram…',
    mermaidRenderError: 'Failed to render Mermaid diagram',
    callout: {
      info: 'Info',
      warning: 'Warning',
      danger: 'Danger',
    },
    notFoundTitle: 'Page not found',
    notFoundDescription: 'The documentation page you requested does not exist or may have been moved.',
    backToHome: 'Back to Home',
    searchDocs: 'Search docs',
    notFoundSeoTitle: 'Page Not Found',
  },
  fr: {
    locale: 'fr',
    htmlLang: 'fr',
    dateLocale: 'fr-FR',
    skipToContent: 'Aller au contenu principal',
    footerBuiltWith: 'Propulsé par mdkb • Base de connaissances Markdown',
    openNavMenu: 'Ouvrir le menu de navigation',
    closeNavMenu: 'Fermer le menu de navigation',
    navAriaLabel: 'Navigation de la documentation',
    logoAlt: (title) => `Logo ${title}`,
    searchLabel: 'Rechercher dans la documentation',
    searchButtonPlaceholder: 'Rechercher…',
    switchToLight: 'Passer en mode clair',
    switchToDark: 'Passer en mode sombre',
    onThisPage: 'Sur cette page',
    updatedOn: (formattedDate) => `Mis à jour le ${formattedDate}`,
    paginationAriaLabel: 'Pagination de la page',
    previous: 'Précédent',
    next: 'Suivant',
    searchTitle: 'Rechercher dans la documentation',
    searchQueryLabel: 'Requête de recherche',
    searchInputPlaceholder: 'Rechercher des pages, titres et contenus…',
    closeSearch: 'Fermer la recherche',
    searchEmptyPrompt:
      'Saisissez des mots-clés pour rechercher dans toutes les pages Markdown pré-indexées.',
    noResultsFor: (query) => `Aucun résultat trouvé pour « ${query} »`,
    noResultsHint: 'Essayez un autre mot-clé ou vérifiez l’orthographe.',
    searchResultsLabel: 'Résultats de recherche',
    kbdNavigate: 'Naviguer',
    kbdOpen: 'Ouvrir',
    kbdClose: 'Fermer',
    poweredBy: 'Propulsé par MiniSearch',
    copyCode: 'Copier',
    copiedCode: 'Copié',
    copyCodeAriaLabel: 'Copier le code dans le presse-papiers',
    copiedCodeAriaLabel: 'Code copié dans le presse-papiers',
    linkToSection: (section) => `Lien vers la section ${section}`,
    zoomImage: 'Cliquer pour agrandir l’image',
    closeLightbox: 'Fermer l’aperçu de l’image',
    lightboxTitle: 'Aperçu de l’image',
    mermaidLoading: 'Génération du diagramme…',
    mermaidRenderError: 'Impossible d’afficher le diagramme Mermaid',
    callout: {
      info: 'Info',
      warning: 'Avertissement',
      danger: 'Danger',
    },
    notFoundTitle: 'Page introuvable',
    notFoundDescription:
      'La page de documentation demandée n’existe pas ou a été déplacée.',
    backToHome: 'Retour à l’accueil',
    searchDocs: 'Rechercher',
    notFoundSeoTitle: 'Page introuvable',
  },
}

export function resolveLocale(rawLocale?: string): MdkbLocale {
  if (!rawLocale) return 'en'
  const normalized = rawLocale.trim().toLowerCase()
  if (normalized === 'fr' || normalized.startsWith('fr-') || normalized.startsWith('fr_')) {
    return 'fr'
  }
  return 'en'
}

export function getTranslations(rawLocale?: string): MdkbTranslations {
  return TRANSLATIONS[resolveLocale(rawLocale)]
}

export function formatLocalizedDate(raw: string, rawLocale?: string): string {
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw
  const t = getTranslations(rawLocale)
  return parsed.toLocaleDateString(t.dateLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
