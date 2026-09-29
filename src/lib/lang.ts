import { createContext, useContext } from 'react'
import type { TKey } from './i18n'
import type { Lang } from './types'

export interface LangState {
  lang: Lang
  setLang: (lang: Lang) => void
  showTranslation: boolean
  setShowTranslation: (value: boolean) => void
  /** Translate a UI string. */
  t: (key: TKey, vars?: Record<string, string | number>) => string
  /** Format a number in the reader's script. */
  n: (value: number | string) => string
  /** Pick the Nepali or English variant of a piece of content. */
  pick: (nepali: string, english: string) => string
}

export const LangContext = createContext<LangState | null>(null)

export function useLang(): LangState {
  const value = useContext(LangContext)
  if (!value) throw new Error('useLang must be used inside <LangProvider>')
  return value
}
