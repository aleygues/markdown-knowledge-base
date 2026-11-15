import {
  Badge,
  Box,
  chakra,
  Dialog,
  HStack,
  IconButton,
  Input,
  Kbd,
  Portal,
  Text,
  VisuallyHidden,
  VStack,
} from '@chakra-ui/react'
import { ArrowRight, FileText, Search, X } from 'lucide-react'
import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router'
import { executeSearch } from '../lib/search.ts'
import type { MdkbTranslations } from '../lib/i18n.ts'
import type { SearchDocument } from '../types/mdkb.ts'

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  searchIndexJson: string
  searchDocs: Record<string, SearchDocument>
  t: MdkbTranslations
}

function HighlightedText({ text, terms }: { text: string; terms: string[] }) {
  if (!text || terms.length === 0) return <>{text}</>

  const escaped = terms
    .filter((t) => t.trim().length > 0)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  if (escaped.length === 0) return <>{text}</>

  const regex = new RegExp(`(${escaped.join('|')})`, 'gi')
  const parts = text.split(regex)

  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="mdkb-search-hit">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

export function SearchDialog({
  open,
  onOpenChange,
  searchIndexJson,
  searchDocs,
  t,
}: SearchDialogProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const navigate = useNavigate()

  const hits = useMemo(
    () => executeSearch(query, searchIndexJson, searchDocs, 10),
    [query, searchIndexJson, searchDocs]
  )

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setQuery('')
      setSelectedIndex(0)
    }
    onOpenChange(nextOpen)
  }

  const selectResult = (route: string) => {
    handleOpenChange(false)
    navigate(route)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) {
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelectedIndex((prev) => (hits.length > 0 ? (prev + 1) % hits.length : 0))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelectedIndex((prev) => (hits.length > 0 ? (prev - 1 + hits.length) % hits.length : 0))
    } else if (event.key === 'Enter' && hits.length > 0) {
      event.preventDefault()
      const target = hits[selectedIndex] ?? hits[0]
      if (target) {
        selectResult(target.route)
      }
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => handleOpenChange(e.open)}
      initialFocusEl={() => inputRef.current}
      size="lg"
      placement="top"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner pt={{ base: 4, md: 16 }} px={3}>
          <Dialog.Content
            borderRadius="xl"
            overflow="hidden"
            borderWidth="1px"
            borderColor="border.muted"
            bg="bg"
          >
            <Dialog.Header p={0}>
              <VisuallyHidden>
                <Dialog.Title>{t.searchTitle}</Dialog.Title>
              </VisuallyHidden>
              <HStack
                px={4}
                py={3}
                gap={3}
                borderBottomWidth="1px"
                borderColor="border.subtle"
              >
                <Search size={18} aria-hidden="true" color="var(--mdkb-primary)" />
                <label htmlFor={inputId}>
                  <VisuallyHidden>{t.searchQueryLabel}</VisuallyHidden>
                </label>
                <Input
                  id={inputId}
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setSelectedIndex(0)
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={t.searchInputPlaceholder}
                  variant="flushed"
                  border="none"
                  _focus={{ boxShadow: 'none', outline: 'none' }}
                  fontSize="md"
                  autoComplete="off"
                />
                <IconButton
                  size="xs"
                  variant="ghost"
                  aria-label={t.closeSearch}
                  onClick={() => handleOpenChange(false)}
                >
                  <X size={16} aria-hidden="true" />
                </IconButton>
              </HStack>
            </Dialog.Header>

            <Dialog.Body p={3} maxH="60vh" overflowY="auto">
              {!query.trim() ? (
                <Box py={8} textAlign="center" color="fg.muted">
                  <Text fontSize="sm">{t.searchEmptyPrompt}</Text>
                </Box>
              ) : hits.length === 0 ? (
                <Box py={8} textAlign="center" color="fg.muted">
                  <Text fontSize="sm" fontWeight="medium">
                    {t.noResultsFor(query)}
                  </Text>
                  <Text fontSize="xs" mt={1}>
                    {t.noResultsHint}
                  </Text>
                </Box>
              ) : (
                <VStack align="stretch" gap={1.5} role="listbox" aria-label={t.searchResultsLabel}>
                  {hits.map((hit, idx) => {
                    const isSelected = idx === selectedIndex
                    return (
                      <chakra.button
                        key={hit.route}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => selectResult(hit.route)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        textAlign="left"
                        w="100%"
                        p={3}
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor={isSelected ? 'var(--mdkb-primary-border)' : 'transparent'}
                        bg={isSelected ? 'var(--mdkb-primary-soft)' : 'bg.subtle'}
                        _hover={{ bg: 'var(--mdkb-primary-soft)' }}
                        cursor="pointer"
                      >
                        <HStack justify="space-between" align="center" mb={1}>
                          <HStack gap={2} minW={0}>
                            <FileText
                              size={15}
                              aria-hidden="true"
                              color="var(--mdkb-primary)"
                            />
                            <Text fontWeight="600" fontSize="sm" truncate>
                              <HighlightedText text={hit.title} terms={hit.terms} />
                            </Text>
                          </HStack>
                          <HStack gap={2} flexShrink={0}>
                            <Badge size="xs" variant="subtle">
                              {hit.category}
                            </Badge>
                            <ArrowRight size={14} aria-hidden="true" />
                          </HStack>
                        </HStack>
                        {hit.snippet && (
                          <Text fontSize="xs" color="fg.muted" lineClamp={2}>
                            <HighlightedText text={hit.snippet} terms={hit.terms} />
                          </Text>
                        )}
                      </chakra.button>
                    )
                  })}
                </VStack>
              )}
            </Dialog.Body>

            <Dialog.Footer
              px={4}
              py={2.5}
              borderTopWidth="1px"
              borderColor="border.subtle"
              bg="bg.subtle"
              justifyContent="space-between"
            >
              <HStack gap={3} fontSize="xs" color="fg.muted">
                <HStack gap={1}>
                  <Kbd size="sm">↑</Kbd>
                  <Kbd size="sm">↓</Kbd>
                  <span>{t.kbdNavigate}</span>
                </HStack>
                <HStack gap={1}>
                  <Kbd size="sm">Enter</Kbd>
                  <span>{t.kbdOpen}</span>
                </HStack>
                <HStack gap={1}>
                  <Kbd size="sm">Esc</Kbd>
                  <span>{t.kbdClose}</span>
                </HStack>
              </HStack>
              <Text fontSize="xs" color="fg.muted">
                {t.poweredBy}
              </Text>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
