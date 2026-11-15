import { ChakraProvider } from '@chakra-ui/react'
import mdkbData from 'virtual:mdkb-data'
import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { DocsLayout } from './components/DocsLayout.tsx'
import { MarkdownRenderer } from './components/MarkdownRenderer.tsx'
import { NotFoundPage } from './components/NotFoundPage.tsx'
import { PageFooterNav } from './components/PageFooterNav.tsx'
import { PageHeader } from './components/PageHeader.tsx'
import { SeoHead } from './components/SeoHead.tsx'
import { parseRuntimeBaseUrl } from './lib/baseUrl.ts'
import { useColorScheme } from './lib/colorScheme.ts'
import { applyBrandCssVariables, createMdkbSystem } from './lib/theme.ts'
import type { DocPage } from './types/mdkb.ts'

function DocPageView({
  page,
  assetBase,
  basename,
  origin,
}: {
  page: DocPage
  assetBase: string
  basename: string
  origin: string
}) {
  return (
    <>
      <SeoHead
        page={page}
        config={mdkbData.config}
        basename={basename}
        origin={origin}
      />
      <article aria-labelledby="page-title">
        <PageHeader page={page} />
        <MarkdownRenderer
          content={page.body}
          currentRoute={page.route}
          assetBase={assetBase}
        />
        <PageFooterNav previous={page.previous} next={page.next} />
      </article>
    </>
  )
}

function DocsRouterContent({
  assetBase,
  basename,
  origin,
  colorScheme,
  toggleColorScheme,
}: {
  assetBase: string
  basename: string
  origin: string
  colorScheme: 'light' | 'dark'
  toggleColorScheme: () => void
}) {
  const [searchOpen, setSearchOpen] = useState(false)

  const pageMap = useMemo(
    () => new Map(mdkbData.pages.map((p) => [p.route, p])),
    []
  )

  return (
    <Routes>
      {mdkbData.pages.map((page) => (
        <Route
          key={page.route}
          path={page.route}
          element={
            <DocsLayout
              config={mdkbData.config}
              assetBase={assetBase}
              colorScheme={colorScheme}
              onToggleColorScheme={toggleColorScheme}
              searchIndexJson={mdkbData.searchIndexJson}
              searchDocs={mdkbData.searchDocs}
              headings={page.headings}
              isSearchOpen={searchOpen}
              onSearchOpenChange={setSearchOpen}
            >
              <DocPageView
                page={page}
                assetBase={assetBase}
                basename={basename}
                origin={origin}
              />
            </DocsLayout>
          }
        />
      ))}
      <Route
        path="*"
        element={
          <DocsLayout
            config={mdkbData.config}
            assetBase={assetBase}
            colorScheme={colorScheme}
            onToggleColorScheme={toggleColorScheme}
            searchIndexJson={mdkbData.searchIndexJson}
            searchDocs={mdkbData.searchDocs}
            headings={pageMap.get('/')?.headings ?? []}
            isSearchOpen={searchOpen}
            onSearchOpenChange={setSearchOpen}
          >
            <SeoHead
              config={mdkbData.config}
              basename={basename}
              origin={origin}
            />
            <NotFoundPage onOpenSearch={() => setSearchOpen(true)} />
          </DocsLayout>
        }
      />
    </Routes>
  )
}

export default function App() {
  const { colorScheme, toggleColorScheme } = useColorScheme()
  const { basename, assetBase, origin } = useMemo(
    () => parseRuntimeBaseUrl(mdkbData.config.baseUrl),
    []
  )

  const system = useMemo(
    () =>
      createMdkbSystem(
        mdkbData.config.primaryColor,
        mdkbData.config.secondaryColor
      ),
    []
  )

  useEffect(() => {
    applyBrandCssVariables(
      mdkbData.config.primaryColor,
      mdkbData.config.secondaryColor
    )
  }, [])

  return (
    <ChakraProvider value={system}>
      <BrowserRouter basename={basename === '/' ? undefined : basename}>
        <DocsRouterContent
          assetBase={assetBase}
          basename={basename}
          origin={origin}
          colorScheme={colorScheme}
          toggleColorScheme={toggleColorScheme}
        />
      </BrowserRouter>
    </ChakraProvider>
  )
}
