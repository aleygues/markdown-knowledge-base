import { Box, HStack, IconButton, Text, VStack } from '@chakra-ui/react'
import { ExternalLink, MessageSquarePlus } from 'lucide-react'
import type { MouseEvent } from 'react'
import { NavLink } from 'react-router'
import { isExternalUrl } from '../lib/baseUrl.ts'
import type { MdkbTranslations } from '../lib/i18n.ts'
import { dispatchReviewSelect } from '../lib/reviewEvents.ts'
import type { MdkbMenuCategory } from '../types/mdkb.ts'

interface SidebarNavProps {
  menu: MdkbMenuCategory[]
  t: MdkbTranslations
  onNavigate?: () => void
  reviewMode?: boolean
  configFile?: string
}

export function SidebarNav({ menu, t, onNavigate, reviewMode, configFile }: SidebarNavProps) {
  const handleLinkClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (reviewMode) {
      const selected = window.getSelection()?.toString().trim()
      if (selected) {
        e.preventDefault()
        return
      }
    }
    onNavigate?.()
  }

  const triggerMenuReview = (
    targetEl: HTMLElement | null,
    label: string,
    link?: string
  ) => {
    if (!targetEl) return
    dispatchReviewSelect({
      input: {
        route: '*',
        sourceFile: configFile || 'mdkb.config.json',
        scope: 'menu',
        targetType: 'menu-item',
        selectedText: label,
        targetSrc: link,
        elementTag: link ? 'a' : 'p',
        occurrenceIndex: 0,
      },
      anchorRect: targetEl.getBoundingClientRect(),
    })
  }

  return (
    <Box as="nav" aria-label={t.navAriaLabel}>
      <VStack align="stretch" gap={6}>
        {menu.map((section) => (
          <Box key={section.category}>
            <HStack
              justify="space-between"
              px={3}
              mb={2}
              css={
                reviewMode
                  ? {
                      '&:hover .mdkb-menu-review-btn, &:focus-within .mdkb-menu-review-btn': {
                        opacity: 1,
                      },
                    }
                  : undefined
              }
            >
              <Text
                data-review-menu-category={section.category}
                fontSize="xs"
                fontWeight="700"
                textTransform="uppercase"
                letterSpacing="wider"
                color="fg.muted"
              >
                {section.category}
              </Text>
              {reviewMode && (
                <IconButton
                  className="mdkb-menu-review-btn"
                  data-review-ignore="true"
                  size="2xs"
                  variant="ghost"
                  colorPalette="yellow"
                  opacity={0.45}
                  aria-label={`${t.review.commentMenuItem}: ${section.category}`}
                  title={t.review.commentMenuItem}
                  onClick={(e) => {
                    const catEl = e.currentTarget
                      .parentElement
                      ?.querySelector<HTMLElement>('[data-review-menu-category]')
                    triggerMenuReview(catEl ?? null, section.category)
                  }}
                >
                  <MessageSquarePlus size={12} aria-hidden="true" />
                </IconButton>
              )}
            </HStack>
            <Box as="ul" role="list" m={0} p={0} listStyleType="none">
              {section.items.map((item) => {
                const external = isExternalUrl(item.link)
                return (
                  <Box
                    as="li"
                    key={`${section.category}-${item.link}`}
                    mb={0.5}
                    display="flex"
                    alignItems="center"
                    gap={1}
                    css={
                      reviewMode
                        ? {
                            '&:hover .mdkb-menu-review-btn, &:focus-within .mdkb-menu-review-btn': {
                              opacity: 1,
                            },
                          }
                        : undefined
                    }
                  >
                    <Box flex="1" minW={0}>
                      {external ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          draggable={reviewMode ? false : undefined}
                          onClick={handleLinkClick}
                          data-review-menu-item={item.link}
                          data-review-menu-label={item.label}
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
                            userSelect: reviewMode ? 'text' : undefined,
                          }}
                        >
                          <span>{item.label}</span>
                          <ExternalLink size={14} aria-hidden="true" />
                        </a>
                      ) : (
                        <NavLink
                          to={item.link}
                          end
                          draggable={reviewMode ? false : undefined}
                          onClick={handleLinkClick}
                          data-review-menu-item={item.link}
                          data-review-menu-label={item.label}
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
                            userSelect: reviewMode ? 'text' : undefined,
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
                    {reviewMode && (
                      <IconButton
                        className="mdkb-menu-review-btn"
                        data-review-ignore="true"
                        size="2xs"
                        variant="ghost"
                        colorPalette="yellow"
                        opacity={0.35}
                        flexShrink={0}
                        aria-label={`${t.review.commentMenuItem}: ${item.label}`}
                        title={t.review.commentMenuItem}
                        onClick={(e) => {
                          const linkEl = e.currentTarget
                            .closest('li')
                            ?.querySelector<HTMLElement>('[data-review-menu-item]')
                          triggerMenuReview(linkEl ?? null, item.label, item.link)
                        }}
                      >
                        <MessageSquarePlus size={13} aria-hidden="true" />
                      </IconButton>
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
