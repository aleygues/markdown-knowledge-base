import { Badge, Box, Heading, HStack, Separator, Text } from '@chakra-ui/react'
import { CalendarClock } from 'lucide-react'
import type { DocPage } from '../types/mdkb.ts'

interface PageHeaderProps {
  page: DocPage
}

function formatDisplayDate(raw: string): string {
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function PageHeader({ page }: PageHeaderProps) {
  return (
    <Box mb={6}>
      <HStack gap={2} mb={2.5} flexWrap="wrap">
        {page.category && (
          <Badge
            size="sm"
            variant="subtle"
            px={2.5}
            py={0.5}
            borderRadius="full"
            style={{
              backgroundColor: 'var(--mdkb-primary-soft)',
              color: 'var(--mdkb-primary)',
            }}
          >
            {page.category}
          </Badge>
        )}
        {page.updatedAt && (
          <HStack gap={1.5} fontSize="xs" color="fg.muted">
            <CalendarClock size={14} aria-hidden="true" />
            <span>
              Updated <time dateTime={page.updatedAt}>{formatDisplayDate(page.updatedAt)}</time>
            </span>
          </HStack>
        )}
      </HStack>

      <Heading
        as="h1"
        id="page-title"
        tabIndex={-1}
        size={{ base: '2xl', md: '3xl' }}
        fontWeight="800"
        letterSpacing="tight"
        lineHeight="1.2"
        outline="none"
      >
        {page.title}
      </Heading>

      {page.description && (
        <Text fontSize={{ base: 'md', md: 'lg' }} color="fg.muted" mt={3} lineHeight="1.6">
          {page.description}
        </Text>
      )}

      <Separator mt={6} />
    </Box>
  )
}
