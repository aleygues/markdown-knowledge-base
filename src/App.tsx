import { Box, ChakraProvider } from '@chakra-ui/react'
import mdkbData from 'virtual:mdkb-data'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { getTranslations, type MdkbTranslations } from './lib/i18n.ts'
import type { ColorScheme } from './lib/colorScheme.ts'
import type { DocPage } from './types/mdkb.ts'

function DocPageView({
  page,
  assetBase,
  basename,
  origin,
  colorScheme,
  t,
  reviewMode,
}: {
  page: DocPage
  assetBase: string
  basename: string
  origin: string
  colorScheme: ColorScheme
  t: MdkbTranslations
  reviewMode?: boolean
}) {
  return (
    <>
      <SeoHead
        page={page}
        config={mdkbData.config}
        basename={basename}
        origin={origin}
        t={t}
      />
      <Box position="relative" data-review-scope="page">
        <article aria-labelledby="page-title">
          <PageHeader page={page} t={t} />
          <MarkdownRenderer
            content={page.body}
            currentRoute={page.route}
            assetBase={assetBase}
            colorScheme={colorScheme}
            t={t}
            reviewMode={reviewMode}
            sourceFile={page.sourceFile ?? page.filePath}
          />
          <PageFooterNav previous={page.previous} next={page.next} t={t} />
        </article>
        {reviewMode && <Box data-review-ui-layer="page" />}
      </Box>
    </>
  )
}

function DocsRouterContent({
  assetBase,
  basename,
  origin,
  colorScheme,
  toggleColorScheme,
  t,
}: {
  assetBase: string
  basename: string
  origin: string
  colorScheme: ColorScheme
  toggleColorScheme: () => void
  t: MdkbTranslations
}) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchMounted, setSearchMounted] = useState(false)

  const handleSearchOpenChange = useCallback((open: boolean) => {
    if (open) setSearchMounted(true)
    setSearchOpen(open)
  }, [])

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
              configFile={mdkbData.configFile}
              reviewMode={mdkbData.reviewMode}
              currentPage={page}
              assetBase={assetBase}
              colorScheme={colorScheme}
              onToggleColorScheme={toggleColorScheme}
              searchIndexJson={mdkbData.searchIndexJson}
              searchDocs={mdkbData.searchDocs}
              headings={page.headings}
              isSearchOpen={searchOpen}
              isSearchMounted={searchMounted}
              onSearchOpenChange={handleSearchOpenChange}
              t={t}
            >
              <DocPageView
                page={page}
                assetBase={assetBase}
                basename={basename}
                origin={origin}
                colorScheme={colorScheme}
                t={t}
                reviewMode={mdkbData.reviewMode}
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
            configFile={mdkbData.configFile}
            reviewMode={mdkbData.reviewMode}
            assetBase={assetBase}
            colorScheme={colorScheme}
            onToggleColorScheme={toggleColorScheme}
            searchIndexJson={mdkbData.searchIndexJson}
            searchDocs={mdkbData.searchDocs}
            headings={pageMap.get('/')?.headings ?? []}
            isSearchOpen={searchOpen}
            isSearchMounted={searchMounted}
            onSearchOpenChange={handleSearchOpenChange}
            t={t}
          >
            <SeoHead
              config={mdkbData.config}
              basename={basename}
              origin={origin}
              t={t}
            />
            <NotFoundPage onOpenSearch={() => handleSearchOpenChange(true)} t={t} />
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
  const t = useMemo(() => getTranslations(mdkbData.config.locale), [])

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
          t={t}
        />
      </BrowserRouter>
    </ChakraProvider>
  )
}
