import { Box, HStack, SimpleGrid, Text } from '@chakra-ui/react'
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react'
import { Link as RouterLink } from 'react-router'
import { isExternalUrl } from '../lib/baseUrl.ts'
import type { PageNavItem } from '../types/mdkb.ts'

interface PageFooterNavProps {
  previous: PageNavItem | null
  next: PageNavItem | null
}

function NavCard({ item, direction }: { item: PageNavItem; direction: 'previous' | 'next' }) {
  const isPrev = direction === 'previous'
  const external = isExternalUrl(item.link)
  const content = (
    <Box
      p={4}
      borderRadius="lg"
      borderWidth="1px"
      borderColor="border.muted"
      bg="bg.subtle"
      _hover={{
        borderColor: 'var(--mdkb-primary)',
        bg: 'var(--mdkb-primary-soft)',
      }}
      transition="all 0.15s ease"
      textAlign={isPrev ? 'left' : 'right'}
      h="100%"
    >
      <HStack
        justify={isPrev ? 'flex-start' : 'flex-end'}
        gap={1.5}
        fontSize="xs"
        color="fg.muted"
        mb={1}
        fontWeight="600"
        textTransform="uppercase"
        letterSpacing="wider"
      >
        {isPrev && <ArrowLeft size={14} aria-hidden="true" />}
        <span>{isPrev ? 'Previous' : 'Next'}</span>
        {!isPrev &&
          (external ? (
            <ExternalLink size={14} aria-hidden="true" />
          ) : (
            <ArrowRight size={14} aria-hidden="true" />
          ))}
      </HStack>
      <Text fontWeight="600" fontSize="md" color="fg">
        {item.label}
      </Text>
    </Box>
  )

  if (external) {
    return (
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: 'none', display: 'block', height: '100%' }}
      >
        {content}
      </a>
    )
  }

  return (
    <RouterLink
      to={item.link}
      style={{ textDecoration: 'none', display: 'block', height: '100%' }}
    >
      {content}
    </RouterLink>
  )
}

export function PageFooterNav({ previous, next }: PageFooterNavProps) {
  if (!previous && !next) return null

  return (
    <Box as="nav" aria-label="Page pagination" mt={12} pt={6} borderTopWidth="1px" borderColor="border.subtle">
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
        <Box>{previous && <NavCard item={previous} direction="previous" />}</Box>
        <Box>{next && <NavCard item={next} direction="next" />}</Box>
      </SimpleGrid>
    </Box>
  )
}
