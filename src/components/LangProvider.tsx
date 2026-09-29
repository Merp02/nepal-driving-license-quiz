import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { num, translate } from '../lib/i18n'
import { LangContext, type LangState } from '../lib/lang'
import { loadPrefs, savePrefs } from '../lib/storage'
import type { Lang } from '../lib/types'

export default function LangProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState(loadPrefs)

  useEffect(() => {
    savePrefs(prefs)
    document.documentElement.lang = prefs.lang === 'ne' ? 'ne' : 'en'
  }, [prefs])

  const setLang = useCallback((lang: Lang) => setPrefs((p) => ({ ...p, lang })), [])
  const setShowTranslation = useCallback((showTranslation: boolean) => setPrefs((p) => ({ ...p, showTranslation })), [])

  const value = useMemo<LangState>(() => {
    const { lang } = prefs
    return {
      lang,
      setLang,
      showTranslation: prefs.showTranslation,
      setShowTranslation,
      t: (key, vars) => translate(lang, key, vars),
      n: (v) => num(v, lang),
      pick: (nepali, english) => (lang === 'ne' ? nepali : english),
    }
  }, [prefs, setLang, setShowTranslation])

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}
