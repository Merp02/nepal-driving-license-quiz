import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useLang } from '../lib/lang'
import { BrandMark } from './Icons'
import LanguageSwitch from './LanguageSwitch'

export default function Layout({ children }: { children: ReactNode }) {
  const { t } = useLang()
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        {t('skipToContent')}
      </a>
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2.5 rounded-md text-ink no-underline">
            <BrandMark className="h-8 w-auto shrink-0" />
            <span className="truncate pt-1 text-lg leading-none font-extrabold tracking-tight sm:text-xl">
              <span className="sm:hidden">{t('appNameShort')}</span>
              <span className="hidden sm:inline">{t('appName')}</span>
            </span>
          </Link>
          <LanguageSwitch />
        </div>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className="mt-16 border-t border-line bg-mist">
        <div className="mx-auto max-w-5xl space-y-2 px-4 py-8 text-[0.95rem] leading-relaxed text-ink-2 sm:px-6">
          <p className="max-w-[70ch]">{t('footerSource')}</p>
          <p className="max-w-[70ch]">{t('footerDataNote')}</p>
        </div>
      </footer>
    </div>
  )
}
