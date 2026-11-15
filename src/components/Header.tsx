import { Box, Button, Flex, HStack, IconButton, Image, Kbd, Text } from '@chakra-ui/react'
import { Menu, Moon, Search, Sun } from 'lucide-react'
import { Link as RouterLink } from 'react-router'
import { resolveAssetUrl } from '../lib/baseUrl.ts'
import type { ColorScheme } from '../lib/colorScheme.ts'
import type { MdkbConfig } from '../types/mdkb.ts'

interface HeaderProps {
  config: MdkbConfig
  assetBase: string
  colorScheme: ColorScheme
  onToggleColorScheme: () => void
  onOpenSearch: () => void
  onOpenMobileMenu: () => void
  isMobileMenuOpen: boolean
}

export function Header({
  config,
  assetBase,
  colorScheme,
  onToggleColorScheme,
  onOpenSearch,
  onOpenMobileMenu,
  isMobileMenuOpen,
}: HeaderProps) {
  const logoSrc = resolveAssetUrl(config.logo, assetBase)

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={40}
      bg="bg/90"
      backdropFilter="blur(10px)"
      borderBottomWidth="1px"
      borderColor="border.subtle"
    >
      <Flex
        maxW="1440px"
        mx="auto"
        px={{ base: 4, md: 6 }}
        h="64px"
        align="center"
        justify="space-between"
        gap={3}
      >
        <HStack gap={3} minW={0}>
          <IconButton
            display={{ base: 'inline-flex', lg: 'none' }}
            variant="ghost"
            size="sm"
            aria-label="Open navigation menu"
            aria-expanded={isMobileMenuOpen}
            onClick={onOpenMobileMenu}
          >
            <Menu size={20} aria-hidden="true" />
          </IconButton>

          <RouterLink
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.65rem',
              textDecoration: 'none',
              color: 'inherit',
              minWidth: 0,
            }}
          >
            {logoSrc && (
              <Image
                src={logoSrc}
                alt={`${config.title} logo`}
                boxSize="30px"
                borderRadius="md"
                objectFit="contain"
                flexShrink={0}
              />
            )}
            <Text
              fontWeight="700"
              fontSize={{ base: 'md', md: 'lg' }}
              letterSpacing="tight"
              truncate
            >
              {config.title}
            </Text>
          </RouterLink>
        </HStack>

        <HStack gap={2.5} flexShrink={0}>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSearch}
            aria-label="Search documentation"
            px={{ base: 2.5, sm: 3.5 }}
            minW={{ base: 'auto', sm: '210px', md: '250px' }}
            justifyContent="space-between"
            color="fg.muted"
            borderColor="border.muted"
            bg="bg.subtle"
            _hover={{ borderColor: 'var(--mdkb-primary)', color: 'fg' }}
          >
            <HStack gap={2}>
              <Search size={15} aria-hidden="true" />
              <Text display={{ base: 'none', sm: 'inline' }} fontSize="sm" fontWeight="400">
                Search docs…
              </Text>
            </HStack>
            <HStack display={{ base: 'none', md: 'flex' }} gap={1}>
              <Kbd size="sm">Ctrl</Kbd>
              <Kbd size="sm">K</Kbd>
            </HStack>
          </Button>

          <IconButton
            variant="ghost"
            size="sm"
            onClick={onToggleColorScheme}
            aria-label={colorScheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={colorScheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {colorScheme === 'dark' ? (
              <Sun size={18} aria-hidden="true" />
            ) : (
              <Moon size={18} aria-hidden="true" />
            )}
          </IconButton>
        </HStack>
      </Flex>
    </Box>
  )
}
