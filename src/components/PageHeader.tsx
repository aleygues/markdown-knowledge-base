import { Badge, Box, Heading, HStack, Separator, Text } from '@chakra-ui/react'
import { CalendarClock } from 'lucide-react'
import { formatLocalizedDate, type MdkbTranslations } from '../lib/i18n.ts'
import type { DocPage } from '../types/mdkb.ts'

interface PageHeaderProps {
  page: DocPage
  t: MdkbTranslations
}

export function PageHeader({ page, t }: PageHeaderProps) {
  const updatedTemplate = page.updatedAt
    ? t.updatedOn('__DATE__').split('__DATE__')
    : null

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
        {page.updatedAt && updatedTemplate && (
          <HStack gap={1.5} fontSize="xs" color="fg.muted">
            <CalendarClock size={14} aria-hidden="true" />
            <span>
              {updatedTemplate[0]}
              <time dateTime={page.updatedAt}>
                {formatLocalizedDate(page.updatedAt, t.locale)}
              </time>
              {updatedTemplate[1] ?? ''}
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
