import { Box, Text } from '@chakra-ui/react'
import type { MdkbTranslations } from '../lib/i18n.ts'
import type { DocHeading } from '../types/mdkb.ts'

interface TableOfContentsProps {
  headings: DocHeading[]
  t: MdkbTranslations
}

export function TableOfContents({ headings, t }: TableOfContentsProps) {
  if (headings.length === 0) return null

  return (
    <Box
      as="aside"
      aria-label={t.onThisPage}
      display={{ base: 'none', xl: 'block' }}
      w="230px"
      flexShrink={0}
    >
      <Box position="sticky" top="88px" maxH="calc(100vh - 110px)" overflowY="auto" pl={4}>
        <Text
          fontSize="xs"
          fontWeight="700"
          textTransform="uppercase"
          letterSpacing="wider"
          color="fg.muted"
          mb={3}
        >
          {t.onThisPage}
        </Text>
        <Box as="ul" role="list" m={0} p={0} listStyleType="none">
          {headings.map((heading) => (
            <Box
              as="li"
              key={heading.id}
              pl={heading.depth === 3 ? 3 : 0}
              mb={1.5}
              borderStartWidth="2px"
              borderColor="border.subtle"
            >
              <a
                href={`#${heading.id}`}
                style={{
                  display: 'block',
                  paddingLeft: '0.65rem',
                  fontSize: '0.825rem',
                  lineHeight: 1.45,
                  color: 'var(--chakra-colors-fg-muted)',
                  textDecoration: 'none',
                }}
              >
                {heading.text}
              </a>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}
