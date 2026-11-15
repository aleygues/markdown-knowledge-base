import { Box, Dialog, IconButton, Image, Portal, Text, VisuallyHidden } from '@chakra-ui/react'
import { X } from 'lucide-react'
import type { MdkbTranslations } from '../lib/i18n.ts'

export interface LightboxImage {
  src: string
  alt: string
}

interface ImageLightboxProps {
  image: LightboxImage | null
  onClose: () => void
  t: MdkbTranslations
}

export function ImageLightbox({ image, onClose, t }: ImageLightboxProps) {
  return (
    <Dialog.Root
      open={image !== null}
      onOpenChange={(e) => {
        if (!e.open) onClose()
      }}
      size="cover"
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.800" backdropFilter="blur(4px)" />
        <Dialog.Positioner
          p={{ base: 3, md: 8 }}
          onClick={onClose}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Dialog.Content
            bg="transparent"
            boxShadow="none"
            maxW="95vw"
            maxH="92vh"
            w="auto"
            onClick={(e) => e.stopPropagation()}
            position="relative"
          >
            <VisuallyHidden>
              <Dialog.Title>{image?.alt || t.lightboxTitle}</Dialog.Title>
            </VisuallyHidden>

            <IconButton
              aria-label={t.closeLightbox}
              onClick={onClose}
              size="sm"
              variant="solid"
              borderRadius="full"
              bg="blackAlpha.700"
              color="white"
              _hover={{ bg: 'blackAlpha.900' }}
              position="absolute"
              top={2}
              right={2}
              zIndex={2}
            >
              <X size={18} aria-hidden="true" />
            </IconButton>

            {image && (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={3}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  maxW="92vw"
                  maxH="82vh"
                  objectFit="contain"
                  borderRadius="lg"
                  bg={{ base: 'white', _dark: 'gray.900' }}
                  boxShadow="2xl"
                  cursor="zoom-out"
                  onClick={onClose}
                />
                {image.alt && (
                  <Text
                    fontSize="sm"
                    color="whiteAlpha.900"
                    bg="blackAlpha.700"
                    px={3}
                    py={1}
                    borderRadius="md"
                    textAlign="center"
                    maxW="80vw"
                  >
                    {image.alt}
                  </Text>
                )}
              </Box>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
