import { Box, Button, Heading, HStack, Text } from '@chakra-ui/react'
import { Home, Search } from 'lucide-react'
import { Link as RouterLink } from 'react-router'

interface NotFoundPageProps {
  onOpenSearch: () => void
}

export function NotFoundPage({ onOpenSearch }: NotFoundPageProps) {
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
        Page not found
      </Heading>
      <Text color="fg.muted" maxW="md" mx="auto" mb={8}>
        The documentation page you requested does not exist or may have been moved.
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
            Back to Home
          </Button>
        </RouterLink>
        <Button variant="outline" onClick={onOpenSearch}>
          <Search size={16} aria-hidden="true" />
          Search docs
        </Button>
      </HStack>
    </Box>
  )
}
