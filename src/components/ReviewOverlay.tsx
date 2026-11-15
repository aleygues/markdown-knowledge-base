import {
  Badge,
  Box,
  Button,
  CloseButton,
  Drawer,
  Flex,
  HStack,
  Portal,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react'
import {
  Check,
  ExternalLink,
  MessageSquare,
  MessageSquarePlus,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'
import type { MdkbTranslations } from '../lib/i18n.ts'
import { MDKB_REVIEW_SELECT_EVENT, type ReviewSelectDetail } from '../lib/reviewEvents.ts'
import {
  buildTextIndex,
  computeReviewHighlightRects,
  extractSelectionInput,
  type HighlightRect,
} from '../lib/reviewSelection.ts'
import type { CreateReviewInput, ReviewComment, ReviewTargetType } from '../types/mdkb.ts'

interface ReviewOverlayProps {
  currentRoute: string
  currentSourceFile: string
  configFile: string
  t: MdkbTranslations
}

interface PositionedHighlight {
  review: ReviewComment
  rects: HighlightRect[]
  orderIndex: number
}

interface FloatingSelectionState {
  input: Omit<CreateReviewInput, 'comment'>
  rect: { left: number; top: number; bottom: number; width: number }
}

type PopoverState =
  | {
      mode: 'create'
      input: Omit<CreateReviewInput, 'comment'>
      anchor: { left: number; top: number }
    }
  | {
      mode: 'view' | 'edit'
      review: ReviewComment
      anchor: { left: number; top: number }
    }

function clampPopoverCoords(rect: { left: number; top: number; bottom?: number; width?: number }): {
  left: number
  top: number
} {
  const width = 360
  const maxLeft = Math.max(12, window.innerWidth - width - 16)
  const left = Math.min(Math.max(12, rect.left), maxLeft)
  const rawTop = (rect.bottom ?? rect.top) + 10
  const maxTop = Math.max(16, window.innerHeight - 280)
  const top = Math.min(Math.max(16, rawTop), maxTop)
  return { left, top }
}

function getTargetLabel(type: ReviewTargetType, t: MdkbTranslations): string {
  switch (type) {
    case 'image':
      return t.review.targetImage
    case 'mermaid':
      return t.review.targetMermaid
    case 'menu-item':
      return t.review.targetMenu
    default:
      return t.review.targetText
  }
}

function ReviewHighlightLayer({
  highlights,
  containerEl,
  onSelectReview,
}: {
  highlights: PositionedHighlight[]
  containerEl: HTMLElement | null
  onSelectReview: (review: ReviewComment, anchor: DOMRect) => void
}) {
  if (!containerEl || highlights.length === 0) return null

  return createPortal(
    <Box
      position="absolute"
      inset={0}
      pointerEvents="none"
      zIndex={15}
      data-review-ui="true"
    >
      {highlights.map(({ review, rects, orderIndex }) => {
        if (rects.length === 0) return null
        const first = rects[0]
        const isBoxTarget = review.targetType !== 'text'

        return (
          <Box key={review.id}>
            {rects.map((rect, idx) => (
              <Box
                key={`${review.id}-${idx}`}
                position="absolute"
                left={`${rect.left}px`}
                top={`${rect.top}px`}
                width={`${rect.width}px`}
                height={`${rect.height}px`}
                borderRadius={isBoxTarget ? 'md' : '2px'}
                bg={isBoxTarget ? 'rgba(250, 204, 21, 0.12)' : 'rgba(250, 204, 21, 0.30)'}
                border={isBoxTarget ? '2px solid #eab308' : undefined}
                borderBottom={!isBoxTarget ? '2px solid #eab308' : undefined}
                pointerEvents="none"
              />
            ))}
            <Box
              as="button"
              position="absolute"
              left={`${Math.max(0, first.left + first.width - 14)}px`}
              top={`${Math.max(0, first.top - 12)}px`}
              pointerEvents="auto"
              cursor="pointer"
              display="inline-flex"
              alignItems="center"
              gap={1}
              px={1.5}
              py={0.5}
              borderRadius="full"
              fontSize="11px"
              fontWeight="700"
              lineHeight="1"
              bg="#eab308"
              color="#18181b"
              boxShadow="sm"
              borderWidth="1px"
              borderColor="blackAlpha.200"
              _hover={{ transform: 'scale(1.06)', bg: '#facc15' }}
              transition="transform 0.12s ease"
              aria-label={`#${orderIndex}: ${review.comment.slice(0, 60)}`}
              onClick={(e) => {
                e.stopPropagation()
                onSelectReview(review, e.currentTarget.getBoundingClientRect())
              }}
            >
              <MessageSquare size={11} aria-hidden="true" />
              <span>{orderIndex}</span>
            </Box>
          </Box>
        )
      })}
    </Box>,
    containerEl
  )
}

export default function ReviewOverlay({
  currentRoute,
  currentSourceFile,
  configFile,
  t,
}: ReviewOverlayProps) {
  const navigate = useNavigate()
  const apiBase = useMemo(() => {
    const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '')
    return `${base}/__mdkb/reviews`
  }, [])

  const [reviews, setReviews] = useState<ReviewComment[]>([])
  const [floatingSelection, setFloatingSelection] = useState<FloatingSelectionState | null>(null)
  const [popover, setPopover] = useState<PopoverState | null>(null)
  const [draftComment, setDraftComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const [pageHighlights, setPageHighlights] = useState<PositionedHighlight[]>([])
  const [menuHighlights, setMenuHighlights] = useState<PositionedHighlight[]>([])
  const [pageLayerEl, setPageLayerEl] = useState<HTMLElement | null>(null)
  const [menuLayerEl, setMenuLayerEl] = useState<HTMLElement | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const rafRef = useRef<number | null>(null)

  // Fetch initial reviews
  useEffect(() => {
    let active = true
    async function load() {
      try {
        const res = await fetch(apiBase)
        if (!res.ok) return
        const payload = (await res.json()) as { reviews?: ReviewComment[] }
        if (active && Array.isArray(payload.reviews)) {
          setReviews(payload.reviews)
        }
      } catch {
        // Ignore transient dev startup errors
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [apiBase])

  // Recompute highlight coordinates inside page & menu scopes
  const recomputeHighlights = useCallback(() => {
    const pageScope = document.querySelector<HTMLElement>('[data-review-scope="page"]')
    const nextPageLayer = document.querySelector<HTMLElement>('[data-review-ui-layer="page"]')
    setPageLayerEl(nextPageLayer)

    if (pageScope) {
      const pageReviews = reviews.filter((r) => r.scope === 'page' && r.route === currentRoute)
      const textIndex = buildTextIndex(pageScope)
      const computed: PositionedHighlight[] = []
      pageReviews.forEach((review, idx) => {
        const rects = computeReviewHighlightRects(pageScope, review, textIndex)
        if (rects.length > 0) {
          computed.push({ review, rects, orderIndex: idx + 1 })
        }
      })
      setPageHighlights(computed)
    } else {
      setPageHighlights([])
    }

    const menuScope = document.querySelector<HTMLElement>('[data-review-scope="menu"]')
    const nextMenuLayer = document.querySelector<HTMLElement>('[data-review-ui-layer="menu"]')
    setMenuLayerEl(nextMenuLayer)

    if (menuScope) {
      const menuReviews = reviews.filter((r) => r.scope === 'menu')
      const menuIndex = buildTextIndex(menuScope)
      const computedMenu: PositionedHighlight[] = []
      menuReviews.forEach((review, idx) => {
        const rects = computeReviewHighlightRects(menuScope, review, menuIndex)
        if (rects.length > 0) {
          computedMenu.push({ review, rects, orderIndex: idx + 1 })
        }
      })
      setMenuHighlights(computedMenu)
    } else {
      setMenuHighlights([])
    }
  }, [currentRoute, reviews])

  const scheduleRecompute = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
    }
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      recomputeHighlights()
    })
  }, [recomputeHighlights])

  useEffect(() => {
    scheduleRecompute()

    const pageScope = document.querySelector<HTMLElement>('[data-review-scope="page"]')
    const menuScope = document.querySelector<HTMLElement>('[data-review-scope="menu"]')

    const resizeObserver = new ResizeObserver(() => scheduleRecompute())
    const mutationObserver = new MutationObserver((mutations) => {
      const relevant = mutations.some((m) => {
        const targetEl =
          m.target.nodeType === Node.ELEMENT_NODE
            ? (m.target as HTMLElement)
            : m.target.parentElement
        return !targetEl?.closest('[data-review-ui="true"]')
      })
      if (relevant) {
        scheduleRecompute()
      }
    })

    for (const el of [pageScope, menuScope]) {
      if (!el) continue
      resizeObserver.observe(el)
      mutationObserver.observe(el, {
        childList: true,
        subtree: true,
        characterData: true,
      })
    }

    const onResize = () => scheduleRecompute()
    window.addEventListener('resize', onResize)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [scheduleRecompute])

  const openExistingPopover = useCallback((review: ReviewComment, anchorRect: DOMRect) => {
    setFloatingSelection(null)
    setErrorMsg(null)
    setConfirmDeleteId(null)
    setDraftComment(review.comment)
    setPopover({
      mode: 'view',
      review,
      anchor: clampPopoverCoords(anchorRect),
    })
  }, [])

  const openCreatePopover = useCallback(
    (input: Omit<CreateReviewInput, 'comment'>, anchorRect: DOMRect) => {
      setFloatingSelection(null)
      setErrorMsg(null)
      setConfirmDeleteId(null)
      setDraftComment('')
      setPopover({
        mode: 'create',
        input,
        anchor: clampPopoverCoords(anchorRect),
      })
    },
    []
  )

  // Handle element clicks (images, Mermaid diagrams, menu buttons)
  useEffect(() => {
    const onCustomSelect = (event: Event) => {
      const custom = event as CustomEvent<ReviewSelectDetail>
      const { input, anchorRect } = custom.detail

      const existing = reviews.find((r) => {
        if (r.scope !== input.scope || r.targetType !== input.targetType) return false
        if (r.scope === 'page' && r.route !== input.route) return false
        if (input.targetSrc && r.targetSrc !== input.targetSrc) return false
        if (input.targetType === 'mermaid') {
          return (
            r.selectedText === input.selectedText &&
            (r.occurrenceIndex ?? 0) === (input.occurrenceIndex ?? 0)
          )
        }
        if (input.targetType === 'image') {
          return (r.occurrenceIndex ?? 0) === (input.occurrenceIndex ?? 0)
        }
        return r.selectedText === input.selectedText
      })

      if (existing) {
        openExistingPopover(existing, anchorRect)
      } else {
        openCreatePopover(input, anchorRect)
      }
    }

    window.addEventListener(MDKB_REVIEW_SELECT_EVENT, onCustomSelect)
    return () => window.removeEventListener(MDKB_REVIEW_SELECT_EVENT, onCustomSelect)
  }, [openCreatePopover, openExistingPopover, reviews])

  // Text selection listener for page & menu scopes
  useEffect(() => {
    let timerId: number | null = null

    const inspectSelection = (eventTarget: EventTarget | null) => {
      if (timerId !== null) window.clearTimeout(timerId)
      timerId = window.setTimeout(() => {
        const targetEl =
          eventTarget instanceof Node
            ? eventTarget.nodeType === Node.ELEMENT_NODE
              ? (eventTarget as HTMLElement)
              : eventTarget.parentElement
            : null

        if (targetEl?.closest('[data-review-ui="true"]')) {
          return
        }

        const sel = window.getSelection()
        if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
          setFloatingSelection(null)
          return
        }

        const range = sel.getRangeAt(0)
        const commonEl =
          range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
            ? (range.commonAncestorContainer as HTMLElement)
            : range.commonAncestorContainer.parentElement

        if (!commonEl || commonEl.closest('[data-review-ui="true"], [data-review-ignore="true"]')) {
          setFloatingSelection(null)
          return
        }

        const pageScope = commonEl.closest<HTMLElement>('[data-review-scope="page"]')
        const menuScope = commonEl.closest<HTMLElement>('[data-review-scope="menu"]')
        const scopeRoot = pageScope ?? menuScope
        if (!scopeRoot) {
          setFloatingSelection(null)
          return
        }

        const scope = pageScope ? 'page' : 'menu'
        const sourceFile = scope === 'menu' ? configFile : currentSourceFile
        const route = scope === 'menu' ? '*' : currentRoute

        const input = extractSelectionInput(range, scopeRoot, scope, route, sourceFile)
        if (!input) {
          setFloatingSelection(null)
          return
        }

        const rect = range.getBoundingClientRect()
        if (rect.width === 0 && rect.height === 0) {
          setFloatingSelection(null)
          return
        }

        setFloatingSelection({
          input,
          rect: {
            left: rect.left,
            top: rect.top,
            bottom: rect.bottom,
            width: rect.width,
          },
        })
      }, 10)
    }

    const onMouseUp = (e: MouseEvent) => inspectSelection(e.target)
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFloatingSelection(null)
        setPopover(null)
        return
      }
      inspectSelection(e.target)
    }

    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('keyup', onKeyUp)
    return () => {
      if (timerId !== null) window.clearTimeout(timerId)
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('keyup', onKeyUp)
    }
  }, [configFile, currentRoute, currentSourceFile])

  // Plain click on highlighted text opens the associated review popover
  useEffect(() => {
    const onDocumentClick = (e: MouseEvent) => {
      const sel = window.getSelection()
      if (sel && !sel.isCollapsed && sel.toString().trim()) return

      const target = e.target as HTMLElement | null
      if (!target || target.closest('[data-review-ui="true"]')) return
      if (target.closest('button, a, input, textarea, [data-review-target]')) return

      const checkScope = (scopeName: 'page' | 'menu', list: PositionedHighlight[]) => {
        const container = document.querySelector<HTMLElement>(`[data-review-scope="${scopeName}"]`)
        if (!container || !container.contains(target)) return false
        const cRect = container.getBoundingClientRect()
        const relX = e.clientX - cRect.left + container.scrollLeft
        const relY = e.clientY - cRect.top + container.scrollTop

        for (const item of list) {
          for (const r of item.rects) {
            if (
              relX >= r.left &&
              relX <= r.left + r.width &&
              relY >= r.top &&
              relY <= r.top + r.height
            ) {
              openExistingPopover(
                item.review,
                new DOMRect(e.clientX, e.clientY, 1, 1)
              )
              return true
            }
          }
        }
        return false
      }

      if (!checkScope('page', pageHighlights)) {
        checkScope('menu', menuHighlights)
      }
    }

    document.addEventListener('click', onDocumentClick)
    return () => document.removeEventListener('click', onDocumentClick)
  }, [menuHighlights, openExistingPopover, pageHighlights])

  // Focus textarea when creating or editing
  useEffect(() => {
    if (popover && (popover.mode === 'create' || popover.mode === 'edit')) {
      window.setTimeout(() => textareaRef.current?.focus(), 20)
    }
  }, [popover])

  const handleSaveNew = async () => {
    if (!popover || popover.mode !== 'create') return
    const comment = draftComment.trim()
    if (!comment) return

    setSaving(true)
    setErrorMsg(null)
    try {
      const res = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...popover.input, comment }),
      })
      if (!res.ok) {
        throw new Error(t.review.saveError)
      }
      const data = (await res.json()) as { review: ReviewComment }
      setReviews((prev) => [...prev, data.review])
      window.getSelection()?.removeAllRanges()
      setPopover(null)
      setDraftComment('')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t.review.saveError)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!popover || popover.mode !== 'edit') return
    const comment = draftComment.trim()
    if (!comment) return

    setSaving(true)
    setErrorMsg(null)
    try {
      const res = await fetch(`${apiBase}/${encodeURIComponent(popover.review.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      })
      if (!res.ok) {
        throw new Error(t.review.saveError)
      }
      const data = (await res.json()) as { review: ReviewComment }
      setReviews((prev) => prev.map((r) => (r.id === data.review.id ? data.review : r)))
      setPopover({
        mode: 'view',
        review: data.review,
        anchor: popover.anchor,
      })
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t.review.saveError)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setSaving(true)
    setErrorMsg(null)
    try {
      const res = await fetch(`${apiBase}/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        throw new Error(t.review.saveError)
      }
      setReviews((prev) => prev.filter((r) => r.id !== id))
      setConfirmDeleteId(null)
      if (popover && popover.mode !== 'create' && popover.review.id === id) {
        setPopover(null)
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t.review.saveError)
    } finally {
      setSaving(false)
    }
  }

  const currentPageReviews = useMemo(
    () => reviews.filter((r) => r.scope === 'page' && r.route === currentRoute),
    [currentRoute, reviews]
  )
  const menuReviews = useMemo(() => reviews.filter((r) => r.scope === 'menu'), [reviews])
  const otherPageReviews = useMemo(
    () => reviews.filter((r) => r.scope === 'page' && r.route !== currentRoute),
    [currentRoute, reviews]
  )

  const renderDrawerCard = (review: ReviewComment, showGoToPage = false) => {
    const isConfirming = confirmDeleteId === review.id
    return (
      <Box
        key={review.id}
        p={3}
        borderRadius="lg"
        borderWidth="1px"
        borderColor="border.muted"
        bg="bg.subtle"
      >
        <HStack justify="space-between" mb={1.5} gap={2} flexWrap="wrap">
          <HStack gap={1.5}>
            <Badge size="xs" colorPalette="yellow" variant="subtle">
              {getTargetLabel(review.targetType, t)}
            </Badge>
            <Text fontSize="xs" fontFamily="mono" color="fg.muted">
              {review.sourceFile || review.route}
            </Text>
          </HStack>
          <Text fontSize="11px" color="fg.muted">
            {review.fileName}
          </Text>
        </HStack>

        <Text
          fontSize="xs"
          color="fg.muted"
          bg="bg"
          px={2}
          py={1}
          borderRadius="md"
          borderStartWidth="3px"
          borderColor="#eab308"
          lineClamp={2}
          mb={2}
        >
          {review.selectedText}
        </Text>

        <Text fontSize="sm" whiteSpace="pre-wrap" mb={2.5}>
          {review.comment}
        </Text>

        <HStack justify="space-between" gap={2} flexWrap="wrap">
          <HStack gap={1.5}>
            {showGoToPage && (
              <Button
                size="2xs"
                variant="outline"
                onClick={() => {
                  setDrawerOpen(false)
                  navigate(review.route)
                }}
              >
                <ExternalLink size={12} aria-hidden="true" />
                {t.review.openRoute}
              </Button>
            )}
            <Button
              size="2xs"
              variant="outline"
              onClick={() => {
                if (review.scope === 'page' && review.route !== currentRoute) {
                  navigate(review.route)
                }
                setDrawerOpen(false)
                setDraftComment(review.comment)
                setConfirmDeleteId(null)
                setPopover({
                  mode: 'edit',
                  review,
                  anchor: {
                    left: Math.max(24, Math.floor(window.innerWidth / 2 - 180)),
                    top: 110,
                  },
                })
              }}
            >
              <Pencil size={12} aria-hidden="true" />
              {t.review.edit}
            </Button>
          </HStack>

          <Button
            size="2xs"
            colorPalette="red"
            variant={isConfirming ? 'solid' : 'ghost'}
            loading={saving && isConfirming}
            onClick={() => {
              if (isConfirming) {
                void handleDelete(review.id)
              } else {
                setConfirmDeleteId(review.id)
              }
            }}
          >
            <Trash2 size={12} aria-hidden="true" />
            {isConfirming ? t.review.confirmDelete : t.review.delete}
          </Button>
        </HStack>
      </Box>
    )
  }

  return (
    <>
      {/* Top Review Mode Banner */}
      <Box
        data-review-ui="true"
        bg={{ base: 'yellow.100', _dark: 'yellow.950' }}
        color={{ base: 'yellow.950', _dark: 'yellow.100' }}
        borderBottomWidth="1px"
        borderColor={{ base: 'yellow.300', _dark: 'yellow.800' }}
        px={{ base: 3, md: 6 }}
        py={1.5}
      >
        <Flex maxW="1440px" mx="auto" align="center" justify="space-between" gap={3} flexWrap="wrap">
          <HStack gap={2.5} minW={0}>
            <Badge colorPalette="yellow" variant="solid" size="sm">
              {t.review.modeBadge}
            </Badge>
            <Text fontSize="xs" fontWeight="500" truncate>
              {t.review.hint}
            </Text>
          </HStack>

          <Button
            size="xs"
            variant="solid"
            colorPalette="yellow"
            onClick={() => setDrawerOpen(true)}
            aria-label={t.review.openPanel}
          >
            <MessageSquare size={14} aria-hidden="true" />
            {t.review.commentsCount(reviews.length)}
          </Button>
        </Flex>
      </Box>

      {/* Highlights Portals */}
      <ReviewHighlightLayer
        highlights={pageHighlights}
        containerEl={pageLayerEl}
        onSelectReview={openExistingPopover}
      />
      <ReviewHighlightLayer
        highlights={menuHighlights}
        containerEl={menuLayerEl}
        onSelectReview={openExistingPopover}
      />

      {/* Floating Add Comment Button on Selection */}
      {floatingSelection && !popover && (
        <Portal>
          <Box
            data-review-ui="true"
            position="fixed"
            left={`${Math.min(
              Math.max(12, floatingSelection.rect.left),
              Math.max(12, window.innerWidth - 210)
            )}px`}
            top={`${Math.max(12, floatingSelection.rect.top - 40)}px`}
            zIndex={1500}
          >
            <Button
              size="xs"
              colorPalette="yellow"
              variant="solid"
              boxShadow="md"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                const { input, rect } = floatingSelection
                openCreatePopover(
                  input,
                  new DOMRect(rect.left, rect.top, rect.width, rect.bottom - rect.top)
                )
              }}
            >
              <MessageSquarePlus size={14} aria-hidden="true" />
              {t.review.addComment}
            </Button>
          </Box>
        </Portal>
      )}

      {/* Create / View / Edit Comment Popover */}
      {popover && (
        <Portal>
          <Box
            data-review-ui="true"
            role="dialog"
            aria-modal="false"
            aria-label={
              popover.mode === 'create'
                ? t.review.addComment
                : popover.mode === 'edit'
                  ? t.review.editComment
                  : t.review.openPanel
            }
            position="fixed"
            left={`${popover.anchor.left}px`}
            top={`${popover.anchor.top}px`}
            w="360px"
            maxW="calc(100vw - 24px)"
            bg="bg"
            color="fg"
            borderWidth="1px"
            borderColor="border.muted"
            borderRadius="xl"
            boxShadow="xl"
            p={3.5}
            zIndex={1600}
          >
            <HStack justify="space-between" mb={2}>
              <HStack gap={1.5} minW={0}>
                <Badge size="xs" colorPalette="yellow" variant="subtle">
                  {getTargetLabel(
                    popover.mode === 'create'
                      ? popover.input.targetType
                      : popover.review.targetType,
                    t
                  )}
                </Badge>
                <Text fontSize="xs" fontFamily="mono" color="fg.muted" truncate>
                  {popover.mode === 'create'
                    ? popover.input.sourceFile
                    : popover.review.sourceFile}
                </Text>
              </HStack>
              <Button
                size="2xs"
                variant="ghost"
                aria-label={t.review.close}
                onClick={() => {
                  setPopover(null)
                  setConfirmDeleteId(null)
                }}
              >
                <X size={14} aria-hidden="true" />
              </Button>
            </HStack>

            <Text
              fontSize="xs"
              color="fg.muted"
              bg="bg.subtle"
              px={2.5}
              py={1.5}
              borderRadius="md"
              borderStartWidth="3px"
              borderColor="#eab308"
              lineClamp={3}
              mb={3}
            >
              {popover.mode === 'create'
                ? popover.input.selectedText
                : popover.review.selectedText}
            </Text>

            {popover.mode === 'view' ? (
              <>
                <Text fontSize="sm" whiteSpace="pre-wrap" mb={3}>
                  {popover.review.comment}
                </Text>
                {errorMsg && (
                  <Text fontSize="xs" color="red.500" mb={2}>
                    {errorMsg}
                  </Text>
                )}
                <HStack justify="space-between" gap={2}>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      setDraftComment(popover.review.comment)
                      setConfirmDeleteId(null)
                      setPopover({
                        mode: 'edit',
                        review: popover.review,
                        anchor: popover.anchor,
                      })
                    }}
                  >
                    <Pencil size={13} aria-hidden="true" />
                    {t.review.edit}
                  </Button>
                  <Button
                    size="xs"
                    colorPalette="red"
                    variant={confirmDeleteId === popover.review.id ? 'solid' : 'ghost'}
                    loading={saving}
                    onClick={() => {
                      if (confirmDeleteId === popover.review.id) {
                        void handleDelete(popover.review.id)
                      } else {
                        setConfirmDeleteId(popover.review.id)
                      }
                    }}
                  >
                    <Trash2 size={13} aria-hidden="true" />
                    {confirmDeleteId === popover.review.id
                      ? t.review.confirmDelete
                      : t.review.delete}
                  </Button>
                </HStack>
              </>
            ) : (
              <>
                <Textarea
                  ref={textareaRef}
                  size="sm"
                  rows={3}
                  value={draftComment}
                  onChange={(e) => setDraftComment(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      e.preventDefault()
                      if (popover.mode === 'create') {
                        void handleSaveNew()
                      } else {
                        void handleSaveEdit()
                      }
                    }
                  }}
                  placeholder={t.review.commentPlaceholder}
                  mb={2.5}
                />
                {errorMsg && (
                  <Text fontSize="xs" color="red.500" mb={2}>
                    {errorMsg}
                  </Text>
                )}
                <HStack justify="flex-end" gap={2}>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      if (popover.mode === 'edit') {
                        setPopover({
                          mode: 'view',
                          review: popover.review,
                          anchor: popover.anchor,
                        })
                      } else {
                        setPopover(null)
                      }
                    }}
                  >
                    {t.review.cancel}
                  </Button>
                  <Button
                    size="xs"
                    colorPalette="yellow"
                    variant="solid"
                    disabled={!draftComment.trim()}
                    loading={saving}
                    onClick={() => {
                      if (popover.mode === 'create') {
                        void handleSaveNew()
                      } else {
                        void handleSaveEdit()
                      }
                    }}
                  >
                    <Check size={13} aria-hidden="true" />
                    {saving ? t.review.saving : t.review.save}
                  </Button>
                </HStack>
              </>
            )}
          </Box>
        </Portal>
      )}

      {/* All Review Comments Drawer */}
      <Drawer.Root
        open={drawerOpen}
        onOpenChange={(e) => setDrawerOpen(e.open)}
        placement="end"
        size="md"
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content bg="bg" color="fg" data-review-ui="true">
              <Drawer.Header borderBottomWidth="1px" borderColor="border.subtle">
                <Drawer.Title fontSize="md" fontWeight="700">
                  {t.review.panelTitle} ({reviews.length})
                </Drawer.Title>
                <Drawer.CloseTrigger asChild>
                  <CloseButton size="sm" aria-label={t.review.close} />
                </Drawer.CloseTrigger>
              </Drawer.Header>

              <Drawer.Body py={4}>
                {reviews.length === 0 ? (
                  <Text fontSize="sm" color="fg.muted">
                    {t.review.noCommentsYet}
                  </Text>
                ) : (
                  <VStack align="stretch" gap={5}>
                    {currentPageReviews.length > 0 && (
                      <Box>
                        <Text
                          fontSize="xs"
                          fontWeight="700"
                          textTransform="uppercase"
                          letterSpacing="wider"
                          color="fg.muted"
                          mb={2}
                        >
                          {t.review.currentPageSection} ({currentPageReviews.length})
                        </Text>
                        <VStack align="stretch" gap={2.5}>
                          {currentPageReviews.map((r) => renderDrawerCard(r, false))}
                        </VStack>
                      </Box>
                    )}

                    {menuReviews.length > 0 && (
                      <Box>
                        <Text
                          fontSize="xs"
                          fontWeight="700"
                          textTransform="uppercase"
                          letterSpacing="wider"
                          color="fg.muted"
                          mb={2}
                        >
                          {t.review.menuSection} ({menuReviews.length})
                        </Text>
                        <VStack align="stretch" gap={2.5}>
                          {menuReviews.map((r) => renderDrawerCard(r, false))}
                        </VStack>
                      </Box>
                    )}

                    {otherPageReviews.length > 0 && (
                      <Box>
                        <Text
                          fontSize="xs"
                          fontWeight="700"
                          textTransform="uppercase"
                          letterSpacing="wider"
                          color="fg.muted"
                          mb={2}
                        >
                          {t.review.otherPagesSection} ({otherPageReviews.length})
                        </Text>
                        <VStack align="stretch" gap={2.5}>
                          {otherPageReviews.map((r) => renderDrawerCard(r, true))}
                        </VStack>
                      </Box>
                    )}
                  </VStack>
                )}
              </Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    </>
  )
}
