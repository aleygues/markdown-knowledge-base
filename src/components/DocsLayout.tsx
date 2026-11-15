import {
  Box,
  CloseButton,
  Drawer,
  Flex,
  Portal,
  Text,
} from '@chakra-ui/react'
import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import type { ColorScheme } from '../lib/colorScheme.ts'
import type { DocHeading, MdkbConfig, SearchDocument } from '../types/mdkb.ts'
import { Header } from './Header.tsx'
import { SearchDialog } from './SearchDialog.tsx'
import { SidebarNav } from './SidebarNav.tsx'
import { TableOfContents } from './TableOfContents.tsx'

interface DocsLayoutProps {
  config: MdkbConfig
  assetBase: string
  colorScheme: ColorScheme
  onToggleColorScheme: () => void
  searchIndexJson: string
  searchDocs: Record<string, SearchDocument>
  headings: DocHeading[]
  isSearchOpen: boolean
  onSearchOpenChange: (open: boolean) => void
  children: ReactNode
}

export function DocsLayout({
  config,
  assetBase,
  colorScheme,
  onToggleColorScheme,
  searchIndexJson,
  searchDocs,
  headings,
  isSearchOpen,
  onSearchOpenChange,
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
        Skip to main content
      </a>

      <Header
        config={config}
        assetBase={assetBase}
        colorScheme={colorScheme}
        onToggleColorScheme={onToggleColorScheme}
        onOpenSearch={() => onSearchOpenChange(true)}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        isMobileMenuOpen={mobileMenuOpen}
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
          <Box position="sticky" top="88px" maxH="calc(100vh - 110px)" overflowY="auto">
            <SidebarNav menu={config.menu} />
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
          <TableOfContents headings={headings} />
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
          <Text>Built with mdkb &bull; Markdown Knowledge Base</Text>
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
                  <CloseButton size="sm" aria-label="Close navigation menu" />
                </Drawer.CloseTrigger>
              </Drawer.Header>
              <Drawer.Body py={5}>
                <SidebarNav
                  menu={config.menu}
                  onNavigate={() => setMobileMenuOpen(false)}
                />
              </Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>

      {/* Search Modal */}
      <SearchDialog
        open={isSearchOpen}
        onOpenChange={onSearchOpenChange}
        searchIndexJson={searchIndexJson}
        searchDocs={searchDocs}
      />
    </Flex>
  )
}
