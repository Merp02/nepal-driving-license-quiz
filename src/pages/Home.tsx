import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { CategoryIcon, ChevronRight, ClockIcon } from '../components/Icons'
import ProgressBar from '../components/ProgressBar'
import { CATEGORIES, EXAM, getCategory, isCategoryId } from '../lib/config'
import { formatClock } from '../lib/exam'
import { formatDateTime } from '../lib/i18n'
import { useLang } from '../lib/lang'
import {
  clearExam,
  listPractice,
  loadExam,
  loadResults,
  loadStats,
  mistakeIds,
  resetAllProgress,
} from '../lib/storage'
import type { PracticeScope } from '../lib/types'
import { useDocumentTitle } from '../lib/useDocumentTitle'

const SCOPES: PracticeScope[] = ['all', 'mistakes', ...CATEGORIES.map((c) => c.id)]

export default function Home() {
  const { t, n, pick, lang } = useLang()
  useDocumentTitle()

  // Everything on this page comes from localStorage; re-read on each visit.
  const [version, setVersion] = useState(0)
  const data = useMemo(() => {
    void version
    const stats = loadStats()
    const mastered = new Map<string, number>()
    for (const [id, s] of Object.entries(stats)) {
      if (s.last !== 'correct') continue
      const qid = Number(id)
      const cat = CATEGORIES.find((c) => qid >= c.questionRange[0] && qid <= c.questionRange[1])
      if (cat) mastered.set(cat.id, (mastered.get(cat.id) ?? 0) + 1)
    }
    return {
      mastered,
      masteredTotal: [...mastered.values()].reduce((a, b) => a + b, 0),
      mistakes: mistakeIds(stats).length,
      exam: loadExam(),
      practice: listPractice(SCOPES).slice(0, 3),
      results: loadResults()
        .filter((r) => r.kind === 'exam')
        .slice(0, 5),
    }
  }, [version])

  const scopeName = (scope: PracticeScope) => {
    if (scope === 'all') return t('allTopicsName')
    if (scope === 'mistakes') return t('mistakesName')
    if (isCategoryId(scope)) {
      const c = getCategory(scope)
      return pick(c.nameNepali, c.nameEnglish)
    }
    return scope
  }


  const facts: { label: string; value: string; note?: string }[] = [
    { label: t('factBank'), value: n(EXAM.totalQuestionBankSize) },
    { label: t('factPerExam'), value: n(EXAM.questionsPerExam) },
    { label: t('factMarksEach'), value: n(EXAM.marksPerQuestion), note: t('factMarksEachNote') },
    { label: t('factTotal'), value: n(EXAM.totalMarks) },
    { label: t('factPass'), value: n(EXAM.passingMarks), note: t('factPassNote', { pct: EXAM.passingPercentage }) },
    { label: t('factTime'), value: t('factTimeValue', { min: EXAM.durationMinutes }) },
  ]

  const hasResume = data.exam !== null || data.practice.length > 0

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      {/* Hero ---------------------------------------------------------- */}
      <section className="pt-10 sm:pt-16" aria-labelledby="home-title">
        <h1 id="home-title" className="max-w-[18ch] text-[2.5rem] leading-[1.05] font-extrabold tracking-[-0.025em] text-ink sm:text-6xl">
          {t('homeTitle')}
        </h1>
        <p className="mt-5 max-w-[62ch] text-lg leading-relaxed text-ink-2 sm:text-xl">{t('homeLede')}</p>

        <div className="mt-9 grid gap-4 md:grid-cols-2">
          <div className="flex flex-col rounded-3xl bg-mist p-6 sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight">{t('practiceMode')}</h2>
            <p className="mt-2 flex-1 text-lg leading-relaxed text-ink-2">{t('practiceModeDesc')}</p>
            <Link to="/practice/all" className="btn-primary mt-6 self-start">
              {t('startPractice')}
            </Link>
          </div>
          <div className="flex flex-col rounded-3xl bg-ink p-6 text-white sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight">{t('examMode')}</h2>
            <p className="mt-2 flex-1 text-lg leading-relaxed text-white/80">
              {t('examModeDesc', { q: EXAM.questionsPerExam, min: EXAM.durationMinutes, pass: EXAM.passingMarks })}
            </p>
            <Link to="/exam" className="btn-inverse mt-6 self-start">
              {data.exam ? t('resumeExam') : t('startExam')}
            </Link>
          </div>
        </div>
      </section>

      {/* Resume ---------------------------------------------------------- */}
      {hasResume && (
        <section className="mt-12" aria-labelledby="resume-title">
          <h2 id="resume-title" className="text-2xl font-bold tracking-tight">
            {t('resumeTitle')}
          </h2>
          <ul className="mt-4 space-y-3">
            {data.exam && (
              <li className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border-2 border-ink p-4 sm:p-5">
                <ClockIcon className="size-7 shrink-0 text-ink" />
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold">{t('examMode')}</p>
                  <p className="text-ink-2">
                    {t('resumeExamMeta', {
                      answered: Object.keys(data.exam.answers).length,
                      total: data.exam.questionIds.length,
                      time: n(formatClock(data.exam.remainingSeconds)),
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    className="link-underline text-ink-2"
                    onClick={() => {
                      clearExam()
                      setVersion((v) => v + 1)
                    }}
                  >
                    {t('discardExam')}
                  </button>
                  <Link to="/exam" className="btn-primary py-2.5!">
                    {t('resumeExam')}
                  </Link>
                </div>
              </li>
            )}
            {data.practice.map((s) => (
              <li key={s.scope}>
                <Link
                  to={`/practice/${s.scope}`}
                  className="flex items-center gap-4 rounded-2xl border border-line p-4 transition-colors hover:border-ink-3 hover:bg-mist/60 sm:p-5"
                >
                  <CategoryIcon id={s.scope} className="size-10 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-bold">{scopeName(s.scope)}</p>
                    <p className="text-ink-2">{t('resumePracticeMeta', { i: s.index + 1, n: s.questionIds.length })}</p>
                  </div>
                  <span className="hidden font-semibold text-ink sm:block">{t('resumePractice')}</span>
                  <ChevronRight className="size-5 shrink-0 text-ink-2" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Exam rules ---------------------------------------------------------- */}
      <section className="mt-14" aria-labelledby="facts-title">
        <h2 id="facts-title" className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">
          {t('factsTitle')}
        </h2>
        <dl className="mt-5 grid border-t-2 border-ink sm:grid-cols-2 sm:gap-x-10">
          {facts.map((f) => (
            <div key={f.label} className="flex items-baseline justify-between gap-6 border-b border-line py-3.5">
              <dt className="text-lg text-ink-2">
                {f.label}
                {f.note && <span className="block text-[0.95rem] text-ink-3">{f.note}</span>}
              </dt>
              <dd className="shrink-0 text-2xl font-bold tabular-nums text-ink">{f.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 max-w-[70ch] text-[0.95rem] leading-relaxed text-ink-3">{t('factsSource')}</p>
      </section>

      {/* Topics ---------------------------------------------------------- */}
      <section className="mt-14" aria-labelledby="topics-title">
        <h2 id="topics-title" className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">
          {t('topicsTitle')}
        </h2>
        <p className="mt-2 text-lg text-ink-2">{t('topicsLede')}</p>
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {CATEGORIES.map((c) => {
            const done = data.mastered.get(c.id) ?? 0
            return (
              <li key={c.id}>
                <Link
                  to={`/practice/${c.id}`}
                  className="flex h-full items-center gap-4 rounded-2xl border border-line p-4 transition-colors hover:border-ink-3 hover:bg-mist/60 sm:p-5"
                >
                  <CategoryIcon id={c.id} className="size-11 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-lg leading-snug font-bold">{pick(c.nameNepali, c.nameEnglish)}</p>
                    <p className="text-[0.95rem] text-ink-2">{t('topicMeta', { pool: c.poolSize, exam: c.questionsInExam })}</p>
                    <div className="mt-2.5">
                      <ProgressBar label="" value={done} max={c.poolSize} tone="go" size="sm" />
                      <p className="mt-1 text-[0.9rem] text-ink-3">{t('topicProgress', { n: done, pool: c.poolSize })}</p>
                    </div>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-ink-2" />
                </Link>
              </li>
            )
          })}
          <li>
            <Link
              to="/practice/all"
              className="flex h-full items-center gap-4 rounded-2xl border border-line p-4 transition-colors hover:border-ink-3 hover:bg-mist/60 sm:p-5"
            >
              <CategoryIcon id="all" className="size-11 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-lg leading-snug font-bold">{t('allTopicsName')}</p>
                <p className="text-[0.95rem] text-ink-2">{t('allTopicsMeta', { n: EXAM.totalQuestionBankSize })}</p>
                <div className="mt-2.5">
                  <ProgressBar label="" value={data.masteredTotal} max={EXAM.totalQuestionBankSize} tone="go" size="sm" />
                  <p className="mt-1 text-[0.9rem] text-ink-3">{t('topicProgress', { n: data.masteredTotal, pool: EXAM.totalQuestionBankSize })}</p>
                </div>
              </div>
              <ChevronRight className="size-5 shrink-0 text-ink-2" />
            </Link>
          </li>
          <li>
            {data.mistakes > 0 ? (
              <Link
                to="/practice/mistakes"
                className="flex h-full items-center gap-4 rounded-2xl border border-line p-4 transition-colors hover:border-ink-3 hover:bg-mist/60 sm:p-5"
              >
                <CategoryIcon id="mistakes" className="size-11 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-lg leading-snug font-bold">{t('mistakesName')}</p>
                  <p className="text-[0.95rem] text-ink-2">{t('mistakesMeta', { n: data.mistakes })}</p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-ink-2" />
              </Link>
            ) : (
              <div className="flex h-full items-center gap-4 rounded-2xl border border-dashed border-line p-4 sm:p-5">
                <CategoryIcon id="mistakes" className="size-11 shrink-0 opacity-50" />
                <div className="min-w-0 flex-1">
                  <p className="text-lg leading-snug font-bold text-ink-2">{t('mistakesName')}</p>
                  <p className="text-[0.95rem] text-ink-3">{t('mistakesEmpty')}</p>
                </div>
              </div>
            )}
          </li>
        </ul>
      </section>

      {/* History ---------------------------------------------------------- */}
      <section className="mt-14" aria-labelledby="history-title">
        <h2 id="history-title" className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">
          {t('historyTitle')}
        </h2>
        {data.results.length === 0 ? (
          <p className="mt-3 text-lg text-ink-2">{t('historyEmpty')}</p>
        ) : (
          <ul className="mt-5 divide-y divide-line border-y border-line">
            {data.results.map((r) => (
              <li key={r.id}>
                <Link to={`/results/${r.id}`} className="flex items-center gap-4 py-3.5 hover:bg-mist/60">
                  <span className={`w-28 shrink-0 rounded-full px-3 py-1 text-center text-[0.95rem] font-semibold ${r.passed ? 'bg-go-tint text-go' : 'bg-stop-tint text-stop'}`}>
                    {r.passed ? t('passed') : t('notPassed')}
                  </span>
                  <span className="min-w-0 flex-1 sm:flex sm:items-baseline sm:justify-between sm:gap-4">
                    <span className="block text-lg font-semibold tabular-nums">{t('historyMarks', { marks: r.marks, max: r.maxMarks })}</span>
                    <span className="block text-[0.95rem] text-ink-2">{formatDateTime(r.finishedAt, lang)}</span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-ink-2" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className="link-underline mt-8 text-[0.95rem] text-ink-3"
          onClick={() => {
            if (window.confirm(t('resetConfirm'))) {
              resetAllProgress()
              setVersion((v) => v + 1)
            }
          }}
        >
          {t('resetProgress')}
        </button>
      </section>
    </div>
  )
}
