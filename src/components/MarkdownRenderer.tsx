import {
  Alert,
  Box,
  Button,
  chakra,
  Code,
  Heading,
  HStack,
  Image,
  Separator,
  Text,
} from '@chakra-ui/react'
import { AlertTriangle, Check, Copy, ExternalLink, Info, ShieldAlert, ZoomIn } from 'lucide-react'
import {
  createContext,
  isValidElement,
  lazy,
  Suspense,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import { Link as RouterLink } from 'react-router'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import { visit } from 'unist-util-visit'
import { resolveAssetUrl } from '../lib/baseUrl.ts'
import type { ColorScheme } from '../lib/colorScheme.ts'
import type { MdkbTranslations } from '../lib/i18n.ts'
import { createHeadingSlugger } from '../lib/slugger.ts'
import { ImageLightbox, type LightboxImage } from './ImageLightbox.tsx'

const LazyMermaidDiagram = lazy(() => import('./MermaidDiagram.tsx'))
const InsideLinkContext = createContext(false)

type CalloutVariant = 'info' | 'warning' | 'danger'

interface MarkdownNode {
  type: string
  name?: string
  depth?: number
  value?: string
  children?: MarkdownNode[]
  data?: {
    directiveLabel?: boolean
    hName?: string
    hProperties?: Record<string, unknown>
  }
}

const CALLOUT_VARIANT_MAP: Record<string, CalloutVariant> = {
  info: 'info',
  note: 'info',
  tip: 'info',
  warning: 'warning',
  caution: 'warning',
  danger: 'danger',
  error: 'danger',
}

function extractNodeText(node: MarkdownNode | undefined): string {
  if (!node) return ''
  if (typeof node.value === 'string') return node.value
  if (!Array.isArray(node.children)) return ''
  return node.children.map(extractNodeText).join('')
}

function remarkCallouts() {
  return (tree: MarkdownNode) => {
    visit(tree, (node: MarkdownNode) => {
      if (node.type === 'containerDirective' && node.name) {
        const variant = CALLOUT_VARIANT_MAP[node.name.toLowerCase()]
        if (!variant) return

        let customTitle = ''
        if (Array.isArray(node.children) && node.children.length > 0) {
          const first = node.children[0]
          if (first.data?.directiveLabel) {
            customTitle = extractNodeText(first).trim()
            node.children.shift()
          }
        }

        node.data = node.data ?? {}
        node.data.hName = 'mdkb-callout'
        node.data.hProperties = {
          'data-variant': variant,
          'data-title': customTitle,
        }
        return
      }

      if (node.type === 'blockquote' && Array.isArray(node.children) && node.children.length > 0) {
        const firstPara = node.children[0]
        if (firstPara.type !== 'paragraph' || !Array.isArray(firstPara.children)) return
        const firstTextNode = firstPara.children[0]
        if (!firstTextNode || firstTextNode.type !== 'text' || typeof firstTextNode.value !== 'string') {
          return
        }

        const match = firstTextNode.value.match(
          /^\[!(INFO|NOTE|TIP|WARNING|CAUTION|DANGER)\](?:[ \t]+([^\n]+))?(?:\r?\n|$)/i
        )
        if (!match) return

        const variant = CALLOUT_VARIANT_MAP[match[1].toLowerCase()] ?? 'info'
        const customTitle = match[2]?.trim() ?? ''
        const remainder = firstTextNode.value.slice(match[0].length)

        if (remainder) {
          firstTextNode.value = remainder
        } else {
          firstPara.children.shift()
          if (firstPara.children.length === 0) {
            node.children.shift()
          }
        }

        node.data = node.data ?? {}
        node.data.hName = 'mdkb-callout'
        node.data.hProperties = {
          'data-variant': variant,
          'data-title': customTitle,
        }
      }
    })
  }
}

function remarkHeadingIds() {
  return (tree: MarkdownNode) => {
    const slugger = createHeadingSlugger()
    visit(tree, 'heading', (node: MarkdownNode) => {
      if (node.depth === 2 || node.depth === 3) {
        const text = extractNodeText(node).trim()
        if (!text) return
        const id = slugger(text)
        node.data = node.data ?? {}
        node.data.hProperties = {
          ...(node.data.hProperties ?? {}),
          id,
        }
      }
    })
  }
}

function resolveInternalMarkdownHref(href: string, currentRoute: string): string {
  const [rawPath, hashPart] = href.split('#')
  const hash = hashPart ? `#${hashPart}` : ''

  if (!rawPath) return hash || '#'

  let resolved: string
  if (rawPath.startsWith('/')) {
    resolved = rawPath
  } else {
    const baseSegments =
      currentRoute === '/' ? [] : currentRoute.replace(/^\/+|\/+$/g, '').split('/')
    // Relative links in markdown file resolve from current directory
    const baseDir = baseSegments.join('/')
    const combined = baseDir ? `/${baseDir}/${rawPath}` : `/${rawPath}`
    const stack: string[] = []
    for (const part of combined.split('/')) {
      if (!part || part === '.') continue
      if (part === '..') {
        stack.pop()
      } else {
        stack.push(part)
      }
    }
    resolved = '/' + stack.join('/')
  }

  const normalized = resolved
    .replace(/\.md$/i, '')
    .replace(/\/index$/i, '')
    .replace(/\/+$/, '')

  return (normalized || '/') + hash
}

function CalloutBox({
  variant,
  title,
  children,
}: {
  variant: CalloutVariant
  title: string
  children: ReactNode
}) {
  const statusMap: Record<CalloutVariant, 'info' | 'warning' | 'error'> = {
    info: 'info',
    warning: 'warning',
    danger: 'error',
  }

  const iconMap: Record<CalloutVariant, ReactNode> = {
    info: <Info size={18} aria-hidden="true" />,
    warning: <AlertTriangle size={18} aria-hidden="true" />,
    danger: <ShieldAlert size={18} aria-hidden="true" />,
  }

  return (
    <Alert.Root
      status={statusMap[variant]}
      variant="subtle"
      my={5}
      borderRadius="lg"
      borderWidth="1px"
      borderStartWidth="4px"
      px={4}
      py={3.5}
      alignItems="flex-start"
    >
      <Alert.Indicator mt="2px">{iconMap[variant]}</Alert.Indicator>
      <Alert.Content>
        <Alert.Title fontWeight="600" fontSize="sm" mb={1}>
          {title}
        </Alert.Title>
        <Alert.Description
          fontSize="sm"
          css={{
            '& > p:last-child': { marginBottom: 0 },
            '& > p:first-of-type': { marginTop: 0 },
          }}
        >
          {children}
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  )
}

function CodeBlock({
  language,
  codeText,
  t,
}: {
  language: string
  codeText: string
  t: MdkbTranslations
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard API unavailable
    }
  }

  return (
    <Box
      my={5}
      borderRadius="lg"
      borderWidth="1px"
      borderColor="border.muted"
      overflow="hidden"
      bg={{ base: 'gray.900', _dark: 'gray.950' }}
      color="gray.100"
    >
      <HStack
        justify="space-between"
        px={4}
        py={2}
        bg={{ base: 'gray.800', _dark: 'gray.900' }}
        borderBottomWidth="1px"
        borderColor="whiteAlpha.200"
      >
        <Text fontSize="xs" fontFamily="mono" color="gray.300" textTransform="lowercase">
          {language || 'text'}
        </Text>
        <Button
          size="xs"
          variant="ghost"
          color="gray.200"
          _hover={{ bg: 'whiteAlpha.200', color: 'white' }}
          onClick={handleCopy}
          aria-label={copied ? t.copiedCodeAriaLabel : t.copyCodeAriaLabel}
        >
          {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          {copied ? t.copiedCode : t.copyCode}
        </Button>
      </HStack>
      <Box as="pre" p={4} m={0} overflowX="auto" fontSize="sm" lineHeight="1.65" fontFamily="mono">
        <code>{codeText}</code>
      </Box>
    </Box>
  )
}

function ZoomableImage({
  src,
  alt,
  t,
  onZoom,
}: {
  src?: string
  alt?: string
  t: MdkbTranslations
  onZoom: (img: LightboxImage) => void
}) {
  const insideLink = useContext(InsideLinkContext)

  if (!src) return null

  const imageElement = (
    <Image
      src={src}
      alt={alt ?? ''}
      maxW="100%"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="border.subtle"
      display="block"
    />
  )

  if (insideLink) {
    return <Box my={5}>{imageElement}</Box>
  }

  return (
    <Box my={5}>
      <chakra.button
        type="button"
        onClick={() => onZoom({ src, alt: alt ?? '' })}
        aria-label={alt ? `${alt} — ${t.zoomImage}` : t.zoomImage}
        title={t.zoomImage}
        cursor="zoom-in"
        position="relative"
        display="inline-block"
        maxW="100%"
        p={0}
        border="none"
        bg="transparent"
        borderRadius="lg"
        className="group"
        _focusVisible={{
          outline: '2px solid var(--mdkb-primary)',
          outlineOffset: '3px',
        }}
        css={{
          '&:hover .mdkb-zoom-badge, &:focus-visible .mdkb-zoom-badge': {
            opacity: 1,
          },
        }}
      >
        {imageElement}
        <Box
          className="mdkb-zoom-badge"
          position="absolute"
          top={2.5}
          right={2.5}
          p={1.5}
          borderRadius="md"
          bg="blackAlpha.700"
          color="white"
          opacity={0}
          transition="opacity 0.15s ease"
          pointerEvents="none"
          aria-hidden="true"
        >
          <ZoomIn size={16} />
        </Box>
      </chakra.button>
    </Box>
  )
}

interface MarkdownRendererProps {
  content: string
  currentRoute: string
  assetBase: string
  colorScheme: ColorScheme
  t: MdkbTranslations
}

export function MarkdownRenderer({
  content,
  currentRoute,
  assetBase,
  colorScheme,
  t,
}: MarkdownRendererProps) {
  const [lightboxImage, setLightboxImage] = useState<LightboxImage | null>(null)

  const components = useMemo(() => {
    const customComponents = {
      'mdkb-callout': (props: {
        'data-variant'?: CalloutVariant
        'data-title'?: string
        children?: ReactNode
      }) => {
        const variant = props['data-variant'] ?? 'info'
        const title = props['data-title']?.trim() || t.callout[variant]
        return (
          <CalloutBox variant={variant} title={title}>
            {props.children}
          </CalloutBox>
        )
      },
      h1: ({ children }: { children?: ReactNode }) => (
        <Heading as="h1" size="2xl" mt={8} mb={4} fontWeight="bold" letterSpacing="tight">
          {children}
        </Heading>
      ),
      h2: ({ id, children }: { id?: string; children?: ReactNode }) => (
        <Heading
          as="h2"
          id={id}
          size="xl"
          mt={10}
          mb={3.5}
          pb={2}
          borderBottomWidth="1px"
          borderColor="border.subtle"
          fontWeight="semibold"
          letterSpacing="tight"
        >
          {children}
          {id && (
            <a
              href={`#${id}`}
              className="mdkb-heading-anchor"
              aria-label={t.linkToSection(typeof children === 'string' ? children : id)}
            >
              #
            </a>
          )}
        </Heading>
      ),
      h3: ({ id, children }: { id?: string; children?: ReactNode }) => (
        <Heading as="h3" id={id} size="lg" mt={7} mb={2.5} fontWeight="semibold">
          {children}
          {id && (
            <a
              href={`#${id}`}
              className="mdkb-heading-anchor"
              aria-label={t.linkToSection(typeof children === 'string' ? children : id)}
            >
              #
            </a>
          )}
        </Heading>
      ),
      h4: ({ children }: { children?: ReactNode }) => (
        <Heading as="h4" size="md" mt={6} mb={2} fontWeight="semibold">
          {children}
        </Heading>
      ),
      p: ({ children }: { children?: ReactNode }) => (
        <Text my={3.5} lineHeight="1.75" color="fg">
          {children}
        </Text>
      ),
      a: ({ href, children }: { href?: string; children?: ReactNode }) => {
        if (!href) return <>{children}</>

        const wrapLink = (node: ReactNode) => (
          <InsideLinkContext.Provider value={true}>{node}</InsideLinkContext.Provider>
        )

        const isExternal = /^(https?:\/\/|mailto:|tel:)/i.test(href)
        if (isExternal) {
          return wrapLink(
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--mdkb-primary)',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
              }}
            >
              <span>{children}</span>
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          )
        }

        if (href.startsWith('#')) {
          return wrapLink(
            <a
              href={href}
              style={{
                color: 'var(--mdkb-primary)',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
                fontWeight: 500,
              }}
            >
              {children}
            </a>
          )
        }

        const resolved = resolveInternalMarkdownHref(href, currentRoute)
        return wrapLink(
          <RouterLink
            to={resolved}
            style={{
              color: 'var(--mdkb-primary)',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
              fontWeight: 500,
            }}
          >
            {children}
          </RouterLink>
        )
      },
      ul: ({ children }: { children?: ReactNode }) => (
        <Box as="ul" pl={6} my={3.5} listStyleType="disc" css={{ '& li': { marginBlock: '0.35rem' } }}>
          {children}
        </Box>
      ),
      ol: ({ children }: { children?: ReactNode }) => (
        <Box
          as="ol"
          pl={6}
          my={3.5}
          listStyleType="decimal"
          css={{ '& li': { marginBlock: '0.35rem' } }}
        >
          {children}
        </Box>
      ),
      li: ({ children }: { children?: ReactNode }) => (
        <Box as="li" lineHeight="1.7" color="fg">
          {children}
        </Box>
      ),
      blockquote: ({ children }: { children?: ReactNode }) => (
        <Box
          as="blockquote"
          my={5}
          pl={4}
          py={1}
          borderStartWidth="3px"
          borderColor="var(--mdkb-secondary)"
          bg="bg.subtle"
          borderEndRadius="md"
          color="fg.muted"
          fontStyle="italic"
        >
          {children}
        </Box>
      ),
      pre: ({ children }: { children?: ReactNode }) => {
        if (isValidElement<{ className?: string; children?: ReactNode }>(children)) {
          const className = children.props.className ?? ''
          const langMatch = className.match(/language-([\w-]+)/)
          const language = langMatch ? langMatch[1] : ''
          const rawCode = String(children.props.children ?? '').replace(/\n$/, '')
          if (language.toLowerCase() === 'mermaid') {
            return (
              <Suspense
                fallback={
                  <Box
                    my={5}
                    p={6}
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor="border.muted"
                    bg="bg.subtle"
                    textAlign="center"
                  >
                    <Text fontSize="xs" color="fg.muted">
                      {t.mermaidLoading}
                    </Text>
                  </Box>
                }
              >
                <LazyMermaidDiagram code={rawCode} colorScheme={colorScheme} t={t} />
              </Suspense>
            )
          }
          return <CodeBlock language={language} codeText={rawCode} t={t} />
        }
        return (
          <Box as="pre" my={5} p={4} borderRadius="lg" bg="bg.muted" overflowX="auto">
            {children}
          </Box>
        )
      },
      code: ({ className, children }: { className?: string; children?: ReactNode }) => {
        if (className?.startsWith('language-')) {
          return <code className={className}>{children}</code>
        }
        return (
          <Code
            variant="subtle"
            fontSize="0.875em"
            px={1.5}
            py={0.5}
            borderRadius="sm"
            fontFamily="mono"
          >
            {children}
          </Code>
        )
      },
      table: ({ children }: { children?: ReactNode }) => (
        <Box
          my={5}
          overflowX="auto"
          borderWidth="1px"
          borderColor="border.muted"
          borderRadius="lg"
        >
          <Box
            as="table"
            w="100%"
            fontSize="sm"
            css={{
              borderCollapse: 'collapse',
              '& th, & td': {
                padding: '0.65rem 0.9rem',
                textAlign: 'left',
                borderBottomWidth: '1px',
                borderBottomStyle: 'solid',
                borderColor: 'var(--chakra-colors-border-subtle)',
              },
              '& th': {
                fontWeight: 600,
                backgroundColor: 'var(--chakra-colors-bg-subtle)',
              },
              '& tbody tr:last-child td': {
                borderBottomWidth: 0,
              },
            }}
          >
            {children}
          </Box>
        </Box>
      ),
      hr: () => <Separator my={7} />,
      img: ({ src, alt }: { src?: string; alt?: string }) => {
        const resolvedSrc = src?.startsWith('/') ? resolveAssetUrl(src, assetBase) : src
        return (
          <ZoomableImage
            src={resolvedSrc}
            alt={alt}
            t={t}
            onZoom={setLightboxImage}
          />
        )
      },
    }

    return customComponents as unknown as Components
  }, [assetBase, colorScheme, currentRoute, t])

  return (
    <Box className="mdkb-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkDirective, remarkCallouts, remarkHeadingIds]}
        components={components}
      >
        {content}
      </ReactMarkdown>
      <ImageLightbox
        image={lightboxImage}
        onClose={() => setLightboxImage(null)}
        t={t}
      />
    </Box>
  )
}
