import {
  Alert,
  Box,
  Button,
  Code,
  Heading,
  HStack,
  Image,
  Separator,
  Text,
} from '@chakra-ui/react'
import { AlertTriangle, Check, Copy, ExternalLink, Info, ShieldAlert } from 'lucide-react'
import { isValidElement, useMemo, useState, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import { Link as RouterLink } from 'react-router'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import { visit } from 'unist-util-visit'
import { resolveAssetUrl } from '../lib/baseUrl.ts'
import { createHeadingSlugger } from '../lib/slugger.ts'

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

const CALLOUT_DEFAULT_TITLES: Record<CalloutVariant, string> = {
  info: 'Info',
  warning: 'Warning',
  danger: 'Danger',
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
          'data-title': customTitle || CALLOUT_DEFAULT_TITLES[variant],
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
          'data-title': customTitle || CALLOUT_DEFAULT_TITLES[variant],
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

function CodeBlock({ language, codeText }: { language: string; codeText: string }) {
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
          aria-label={copied ? 'Copied code to clipboard' : 'Copy code to clipboard'}
        >
          {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </HStack>
      <Box as="pre" p={4} m={0} overflowX="auto" fontSize="sm" lineHeight="1.65" fontFamily="mono">
        <code>{codeText}</code>
      </Box>
    </Box>
  )
}

interface MarkdownRendererProps {
  content: string
  currentRoute: string
  assetBase: string
}

export function MarkdownRenderer({ content, currentRoute, assetBase }: MarkdownRendererProps) {
  const components = useMemo(() => {
    const customComponents = {
      'mdkb-callout': (props: {
        'data-variant'?: CalloutVariant
        'data-title'?: string
        children?: ReactNode
      }) => {
        const variant = props['data-variant'] ?? 'info'
        const title = props['data-title'] ?? CALLOUT_DEFAULT_TITLES[variant]
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
              aria-label={`Link to section ${typeof children === 'string' ? children : id}`}
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
              aria-label={`Link to section ${typeof children === 'string' ? children : id}`}
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

        const isExternal = /^(https?:\/\/|mailto:|tel:)/i.test(href)
        if (isExternal) {
          return (
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
          return (
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
        return (
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
          return <CodeBlock language={language} codeText={rawCode} />
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
      img: ({ src, alt }: { src?: string; alt?: string }) => (
        <Image
          src={src?.startsWith('/') ? resolveAssetUrl(src, assetBase) : src}
          alt={alt ?? ''}
          maxW="100%"
          borderRadius="lg"
          borderWidth="1px"
          borderColor="border.subtle"
          my={5}
        />
      ),
    }

    return customComponents as unknown as Components
  }, [assetBase, currentRoute])

  return (
    <Box className="mdkb-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkDirective, remarkCallouts, remarkHeadingIds]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </Box>
  )
}
