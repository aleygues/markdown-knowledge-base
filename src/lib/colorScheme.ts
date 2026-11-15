import { useCallback, useEffect, useState } from 'react'

export type ColorScheme = 'light' | 'dark'
export type ColorSchemeOverride = ColorScheme | null

const STORAGE_KEY = 'color-scheme'

function readStoredOverride(): ColorSchemeOverride {
  try {
    const val = window.localStorage.getItem(STORAGE_KEY)
    return val === 'light' || val === 'dark' ? val : null
  } catch {
    return null
  }
}

function getSystemIsDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
}

function applySchemeToDocument(override: ColorSchemeOverride, systemDark: boolean): ColorScheme {
  const resolved: ColorScheme = override ?? (systemDark ? 'dark' : 'light')
  const meta = document.querySelector('meta[name="color-scheme"]')
  if (meta) {
    meta.setAttribute('content', override ?? 'light dark')
  }
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(resolved)
  return resolved
}

export function useColorScheme(): {
  colorScheme: ColorScheme
  isOverridden: boolean
  toggleColorScheme: () => void
} {
  const [override, setOverride] = useState<ColorSchemeOverride>(() => readStoredOverride())
  const [systemDark, setSystemDark] = useState<boolean>(() => getSystemIsDark())

  const colorScheme: ColorScheme = override ?? (systemDark ? 'dark' : 'light')

  useEffect(() => {
    applySchemeToDocument(override, systemDark)
  }, [override, systemDark])

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onMediaChange = (e: MediaQueryListEvent) => {
      setSystemDark(e.matches)
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) {
        setOverride(readStoredOverride())
      }
    }

    mql.addEventListener('change', onMediaChange)
    window.addEventListener('storage', onStorage)
    return () => {
      mql.removeEventListener('change', onMediaChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const toggleColorScheme = useCallback(() => {
    const currentSystem: ColorScheme = getSystemIsDark() ? 'dark' : 'light'
    const currentRendered: ColorScheme = override ?? currentSystem
    const target: ColorScheme = currentRendered === 'dark' ? 'light' : 'dark'

    if (target === currentSystem) {
      try {
        window.localStorage.removeItem(STORAGE_KEY)
      } catch {
        // Ignore storage errors when blocked
      }
      setOverride(null)
    } else {
      try {
        window.localStorage.setItem(STORAGE_KEY, target)
      } catch {
        // Ignore storage errors when blocked
      }
      setOverride(target)
    }
  }, [override])

  return {
    colorScheme,
    isOverridden: override !== null,
    toggleColorScheme,
  }
}
