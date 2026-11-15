import {
  Box,
  CloseButton,
  Drawer,
  Flex,
  Portal,
  Text,
} from '@chakra-ui/react'
import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import type { ColorScheme } from '../lib/colorScheme.ts'
import type { MdkbTranslations } from '../lib/i18n.ts'
import type { DocHeading, DocPage, MdkbConfig, SearchDocument } from '../types/mdkb.ts'
import { Header } from './Header.tsx'
import { SidebarNav } from './SidebarNav.tsx'
import { TableOfContents } from './TableOfContents.tsx'

const LazySearchDialog = lazy(() =>
  import('./SearchDialog.tsx').then((m) => ({ default: m.SearchDialog }))
)
const LazyReviewOverlay = lazy(() => import('./ReviewOverlay.tsx'))

interface DocsLayoutProps {
  config: MdkbConfig
  configFile?: string
  reviewMode?: boolean
  currentPage?: DocPage
  assetBase: string
  colorScheme: ColorScheme
  onToggleColorScheme: () => void
  searchIndexJson: string
  searchDocs: Record<string, SearchDocument>
  headings: DocHeading[]
  isSearchOpen: boolean
  isSearchMounted: boolean
  onSearchOpenChange: (open: boolean) => void
  t: MdkbTranslations
  children: ReactNode
}

export function DocsLayout({
  config,
  configFile,
  reviewMode,
  currentPage,
  assetBase,
  colorScheme,
  onToggleColorScheme,
  searchIndexJson,
  searchDocs,
  headings,
  isSearchOpen,
  isSearchMounted,
  onSearchOpenChange,
  t,
  children,
}: DocsLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.slice(1)
      const el = document.getElementById(targetId)
      if (el) {
        el.scrollIntoView()
        return
      }
    }
    window.scrollTo({ top: 0 })
  }, [location.pathname, location.hash])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        onSearchOpenChange(!isSearchOpen)
        return
      }

      if (event.key === '/' && !isSearchOpen) {
        const activeTag = document.activeElement?.tagName.toLowerCase()
        const isEditable =
          activeTag === 'input' ||
          activeTag === 'textarea' ||
          document.activeElement?.getAttribute('contenteditable') === 'true'
        if (!isEditable) {
          event.preventDefault()
          onSearchOpenChange(true)
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isSearchOpen, onSearchOpenChange])

  return (
    <Flex direction="column" minH="100dvh" bg="bg" color="fg">
      <a href="#main-content" className="skip-link">
        {t.skipToContent}
      </a>

      {reviewMode && (
        <Suspense fallback={null}>
          <LazyReviewOverlay
            currentRoute={currentPage?.route ?? location.pathname}
            currentSourceFile={currentPage?.sourceFile ?? currentPage?.filePath ?? ''}
            configFile={configFile ?? 'mdkb.config.json'}
            t={t}
          />
        </Suspense>
      )}

      <Header
        config={config}
        assetBase={assetBase}
        colorScheme={colorScheme}
        onToggleColorScheme={onToggleColorScheme}
        onOpenSearch={() => onSearchOpenChange(true)}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        isMobileMenuOpen={mobileMenuOpen}
        t={t}
      />

      <Flex
        maxW="1440px"
        w="100%"
        mx="auto"
        px={{ base: 4, md: 6 }}
        flex="1"
        gap={{ base: 0, lg: 8 }}
      >
        {/* Desktop Sidebar */}
        <Box
          display={{ base: 'none', lg: 'block' }}
          w="270px"
          flexShrink={0}
          borderEndWidth="1px"
          borderColor="border.subtle"
          py={8}
          pe={4}
        >
          <Box
            position="sticky"
            top="88px"
            maxH="calc(100vh - 110px)"
            overflowY="auto"
            data-review-scope="menu"
          >
            <SidebarNav
              menu={config.menu}
              t={t}
              reviewMode={reviewMode}
              configFile={configFile}
            />
            {reviewMode && <Box data-review-ui-layer="menu" />}
          </Box>
        </Box>

        {/* Main Content */}
        <Box as="main" id="main-content" flex="1" minW={0} py={{ base: 6, md: 8 }}>
          <Box maxW="780px" mx="auto">
            {children}
          </Box>
        </Box>

        {/* Table of Contents */}
        <Box py={{ base: 6, md: 8 }}>
          <TableOfContents headings={headings} t={t} />
        </Box>
      </Flex>

      <Box
        as="footer"
        borderTopWidth="1px"
        borderColor="border.subtle"
        py={5}
        px={{ base: 4, md: 6 }}
      >
        <Flex
          maxW="1440px"
          mx="auto"
          justify="space-between"
          align="center"
          flexWrap="wrap"
          gap={2}
          fontSize="xs"
          color="fg.muted"
        >
          <Text>{config.title}</Text>
          <Text>{t.footerBuiltWith}</Text>
        </Flex>
      </Box>

      {/* Mobile Navigation Drawer */}
      <Drawer.Root
        open={mobileMenuOpen}
        onOpenChange={(e) => setMobileMenuOpen(e.open)}
        placement="start"
        size="xs"
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content bg="bg" color="fg">
              <Drawer.Header borderBottomWidth="1px" borderColor="border.subtle">
                <Drawer.Title fontSize="md" fontWeight="700">
                  {config.title}
                </Drawer.Title>
                <Drawer.CloseTrigger asChild>
                  <CloseButton size="sm" aria-label={t.closeNavMenu} />
                </Drawer.CloseTrigger>
              </Drawer.Header>
              <Drawer.Body py={5}>
                <SidebarNav
                  menu={config.menu}
                  t={t}
                  reviewMode={reviewMode}
                  configFile={configFile}
                  onNavigate={() => setMobileMenuOpen(false)}
                />
              </Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>

      {/* Search Modal (lazy-loaded on first open) */}
      {(isSearchOpen || isSearchMounted) && (
        <Suspense fallback={null}>
          <LazySearchDialog
            open={isSearchOpen}
            onOpenChange={onSearchOpenChange}
            searchIndexJson={searchIndexJson}
            searchDocs={searchDocs}
            t={t}
          />
        </Suspense>
      )}
    </Flex>
  )
}
