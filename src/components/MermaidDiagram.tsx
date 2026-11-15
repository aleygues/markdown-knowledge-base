import { Alert, Box, Button, HStack, Text } from '@chakra-ui/react'
import { AlertTriangle, Check, Copy } from 'lucide-react'
import mermaid from 'mermaid'
import { useEffect, useId, useRef, useState } from 'react'
import type { ColorScheme } from '../lib/colorScheme.ts'
import type { MdkbTranslations } from '../lib/i18n.ts'

export interface MermaidDiagramProps {
  code: string
  colorScheme: ColorScheme
  t: MdkbTranslations
}

export default function MermaidDiagram({ code, colorScheme, t }: MermaidDiagramProps) {
  const reactId = useId()
  const renderSeqRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    renderSeqRef.current += 1
    const renderId = `mdkb-mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}-${renderSeqRef.current}`

    async function renderDiagram() {
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: colorScheme === 'dark' ? 'dark' : 'default',
          securityLevel: 'strict',
        })
        const result = await mermaid.render(renderId, code)
        if (cancelled) return

        setError(null)
        setSvg(result.svg)

        // Wait one frame for containerRef to receive the updated SVG before bindFunctions
        requestAnimationFrame(() => {
          if (!cancelled && containerRef.current && result.bindFunctions) {
            result.bindFunctions(containerRef.current)
          }
        })
      } catch (err) {
        if (cancelled) return
        setSvg('')
        setError(err instanceof Error ? err.message : String(err))
      }
    }

    void renderDiagram()

    return () => {
      cancelled = true
    }
  }, [code, colorScheme, reactId])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard API unavailable
    }
  }

  if (error) {
    return (
      <Box my={5}>
        <Alert.Root status="error" variant="subtle" borderRadius="lg" borderWidth="1px" mb={2}>
          <Alert.Indicator>
            <AlertTriangle size={18} aria-hidden="true" />
          </Alert.Indicator>
          <Alert.Content>
            <Alert.Title fontWeight="600" fontSize="sm">
              {t.mermaidRenderError}
            </Alert.Title>
            <Alert.Description fontSize="xs">{error}</Alert.Description>
          </Alert.Content>
        </Alert.Root>
        <Box
          as="pre"
          p={4}
          borderRadius="lg"
          borderWidth="1px"
          borderColor="border.muted"
          bg={{ base: 'gray.900', _dark: 'gray.950' }}
          color="gray.100"
          overflowX="auto"
          fontSize="sm"
          fontFamily="mono"
        >
          <code>{code}</code>
        </Box>
      </Box>
    )
  }

  return (
    <Box
      my={5}
      borderRadius="lg"
      borderWidth="1px"
      borderColor="border.muted"
      overflow="hidden"
      bg={{ base: 'white', _dark: 'gray.900' }}
    >
      <HStack
        justify="space-between"
        px={4}
        py={2}
        bg="bg.subtle"
        borderBottomWidth="1px"
        borderColor="border.subtle"
      >
        <Text fontSize="xs" fontFamily="mono" color="fg.muted">
          mermaid
        </Text>
        <Button
          size="xs"
          variant="ghost"
          color="fg.muted"
          _hover={{ color: 'fg', bg: 'bg.muted' }}
          onClick={handleCopy}
          aria-label={copied ? t.copiedCodeAriaLabel : t.copyCodeAriaLabel}
        >
          {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          {copied ? t.copiedCode : t.copyCode}
        </Button>
      </HStack>

      <Box p={4} overflowX="auto" minH="80px">
        {svg ? (
          <Box
            ref={containerRef}
            className="mdkb-mermaid-diagram"
            display="flex"
            justifyContent="center"
            css={{
              '& svg': {
                maxWidth: '100%',
                height: 'auto',
              },
            }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <Text fontSize="xs" color="fg.muted" textAlign="center" py={4}>
            {t.mermaidLoading}
          </Text>
        )}
      </Box>
    </Box>
  )
}
