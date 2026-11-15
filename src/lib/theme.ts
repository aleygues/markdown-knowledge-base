import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

const NAMED_COLORS: Record<string, string> = {
  blue: '#2563eb',
  teal: '#0d9488',
  cyan: '#0ea5e9',
  indigo: '#6366f1',
  purple: '#9333ea',
  pink: '#db2777',
  red: '#dc2626',
  orange: '#ea580c',
  amber: '#d97706',
  green: '#16a34a',
  emerald: '#059669',
}

export function resolveColorValue(input: string | undefined, fallback: string): string {
  if (!input) return fallback
  const trimmed = input.trim()
  return NAMED_COLORS[trimmed.toLowerCase()] ?? trimmed
}

export function applyBrandCssVariables(primaryColor?: string, secondaryColor?: string): void {
  const primary = resolveColorValue(primaryColor, '#0ea5e9')
  const secondary = resolveColorValue(secondaryColor, '#6366f1')
  const root = document.documentElement
  root.style.setProperty('--mdkb-primary', primary)
  root.style.setProperty('--mdkb-secondary', secondary)
}

export function createMdkbSystem(primaryColor?: string, secondaryColor?: string) {
  const primary = resolveColorValue(primaryColor, '#0ea5e9')
  const secondary = resolveColorValue(secondaryColor, '#6366f1')

  const config = defineConfig({
    theme: {
      tokens: {
        colors: {
          brand: {
            primary: { value: primary },
            secondary: { value: secondary },
          },
        },
      },
    },
  })

  return createSystem(defaultConfig, config)
}
