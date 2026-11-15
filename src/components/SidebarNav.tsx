import { Box, HStack, Text, VStack } from '@chakra-ui/react'
import { ExternalLink } from 'lucide-react'
import { NavLink } from 'react-router'
import { isExternalUrl } from '../lib/baseUrl.ts'
import type { MdkbMenuCategory } from '../types/mdkb.ts'

interface SidebarNavProps {
  menu: MdkbMenuCategory[]
  onNavigate?: () => void
}

export function SidebarNav({ menu, onNavigate }: SidebarNavProps) {
  return (
    <Box as="nav" aria-label="Documentation navigation">
      <VStack align="stretch" gap={6}>
        {menu.map((section) => (
          <Box key={section.category}>
            <Text
              fontSize="xs"
              fontWeight="700"
              textTransform="uppercase"
              letterSpacing="wider"
              color="fg.muted"
              px={3}
              mb={2}
            >
              {section.category}
            </Text>
            <Box as="ul" role="list" m={0} p={0} listStyleType="none">
              {section.items.map((item) => {
                const external = isExternalUrl(item.link)
                return (
                <Box as="li" key={`${section.category}-${item.link}`} mb={0.5}>
                  {external ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={onNavigate}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        padding: '0.45rem 0.75rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        textDecoration: 'none',
                        color: 'var(--chakra-colors-fg-muted)',
                      }}
                    >
                      <span>{item.label}</span>
                      <ExternalLink size={14} aria-hidden="true" />
                    </a>
                  ) : (
                    <NavLink
                      to={item.link}
                      end
                      onClick={onNavigate}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.45rem 0.75rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.9rem',
                        textDecoration: 'none',
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? 'var(--mdkb-primary)' : 'var(--chakra-colors-fg)',
                        backgroundColor: isActive ? 'var(--mdkb-primary-soft)' : 'transparent',
                        borderInlineStart: isActive
                          ? '3px solid var(--mdkb-primary)'
                          : '3px solid transparent',
                        transition: 'background-color 0.15s ease, color 0.15s ease',
                      })}
                    >
                      <HStack justify="space-between" w="100%">
                        <Text as="span" truncate>
                          {item.label}
                        </Text>
                      </HStack>
                    </NavLink>
                  )}
                </Box>
                )
              })}
            </Box>
          </Box>
        ))}
      </VStack>
    </Box>
  )
}
