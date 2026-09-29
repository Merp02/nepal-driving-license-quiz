import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router'
import Layout from './components/Layout'
import LangProvider from './components/LangProvider'
import { useLang } from './lib/lang'
import { useDocumentTitle } from './lib/useDocumentTitle'
import Home from './pages/Home'

// The question bank only loads with the pages that need it.
const Quiz = lazy(() => import('./pages/Quiz'))
const Results = lazy(() => import('./pages/Results'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function Loading() {
  const { t } = useLang()
  return (
    <p className="mx-auto max-w-3xl px-4 pt-12 text-lg text-ink-2 sm:px-6" role="status">
      {t('loading')}
    </p>
  )
}

function NotFound() {
  const { t } = useLang()
  useDocumentTitle(t('notFoundTitle'))
  return (
    <div className="mx-auto max-w-3xl px-4 pt-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">{t('notFoundTitle')}</h1>
      <p className="mt-3 text-lg text-ink-2">{t('notFoundBody')}</p>
      <Link to="/" className="btn-primary mt-8">
        {t('backHome')}
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <LangProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Layout>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/practice" element={<Quiz mode="practice" />} />
              <Route path="/practice/:scope" element={<Quiz mode="practice" />} />
              <Route path="/exam" element={<Quiz mode="exam" />} />
              <Route path="/results/:id" element={<Results />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </LangProvider>
  )
}
