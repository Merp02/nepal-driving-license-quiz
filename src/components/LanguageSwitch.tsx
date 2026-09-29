import { useLang } from '../lib/lang'
import type { Lang } from '../lib/types'
import { FlagNepal, FlagUK } from './Icons'

const OPTIONS: { lang: Lang; label: string; Flag: typeof FlagNepal }[] = [
  { lang: 'ne', label: 'नेपाली', Flag: FlagNepal },
  { lang: 'en', label: 'English', Flag: FlagUK },
]

export default function LanguageSwitch() {
  const { lang, setLang, t } = useLang()
  return (
    <div role="radiogroup" aria-label={t('langLabel')} className="inline-flex rounded-full bg-mist p-1">
      {OPTIONS.map(({ lang: value, label, Flag }) => {
        const active = value === lang
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            lang={value}
            onClick={() => setLang(value)}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 sm:px-3 text-[0.95rem] leading-none font-semibold transition-colors ${
              active ? 'bg-white text-ink shadow-[0_1px_2px_rgba(28,32,57,0.18)]' : 'text-ink-2 hover:text-ink'
            }`}
          >
            <Flag className={`${value === 'ne' ? 'h-[1.15rem]' : 'h-3.5'} w-auto shrink-0 max-[379px]:hidden`} />
            <span className="pt-0.5">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
