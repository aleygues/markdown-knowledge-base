import { Box, Button, Heading, HStack, Text } from '@chakra-ui/react'
import { Home, Search } from 'lucide-react'
import { Link as RouterLink } from 'react-router'
import type { MdkbTranslations } from '../lib/i18n.ts'

interface NotFoundPageProps {
  onOpenSearch: () => void
  t: MdkbTranslations
}

export function NotFoundPage({ onOpenSearch, t }: NotFoundPageProps) {
  return (
    <Box py={16} textAlign="center">
      <Text
        fontSize="sm"
        fontWeight="700"
        textTransform="uppercase"
        letterSpacing="wider"
        color="var(--mdkb-primary)"
        mb={2}
      >
        404
      </Text>
      <Heading as="h1" size="2xl" mb={3}>
        {t.notFoundTitle}
      </Heading>
      <Text color="fg.muted" maxW="md" mx="auto" mb={8}>
        {t.notFoundDescription}
      </Text>
      <HStack justify="center" gap={3} flexWrap="wrap">
        <RouterLink to="/" style={{ textDecoration: 'none' }}>
          <Button
            style={{
              backgroundColor: 'var(--mdkb-primary)',
              color: '#ffffff',
            }}
          >
            <Home size={16} aria-hidden="true" />
            {t.backToHome}
          </Button>
        </RouterLink>
        <Button variant="outline" onClick={onOpenSearch}>
          <Search size={16} aria-hidden="true" />
          {t.searchDocs}
        </Button>
      </HStack>
    </Box>
  )
}
