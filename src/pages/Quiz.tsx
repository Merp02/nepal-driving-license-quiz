import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import ConfirmDialog from '../components/ConfirmDialog'
import { ChevronLeft, ChevronRight } from '../components/Icons'
import ProgressBar from '../components/ProgressBar'
import QuestionCard from '../components/QuestionCard'
import QuestionNavigator from '../components/QuestionNavigator'
import StatsBand from '../components/StatsBand'
import { CATEGORIES, EXAM, getCategory, isCategoryId } from '../lib/config'
import { buildExamPaper, formatClock, scoreAnswers } from '../lib/exam'
import { useLang } from '../lib/lang'
import { QUESTIONS, getQuestion, hasQuestion, idsForScope } from '../lib/questions'
import {
  clearExam,
  clearPractice,
  loadExam,
  loadPractice,
  newId,
  recordAnswers,
  saveExam,
  savePractice,
  saveResult,
} from '../lib/storage'
import type { ExamSession, OptionId, PracticeScope, PracticeSession, QuizResult } from '../lib/types'
import { useDocumentTitle } from '../lib/useDocumentTitle'

const KEY_TO_OPTION: Record<string, OptionId> = {
  '1': 'A', '2': 'B', '3': 'C', '4': 'D',
  a: 'A', b: 'B', c: 'C', d: 'D',
  क: 'A', ख: 'B', ग: 'C', घ: 'D',
}

/** Keyboard shortcuts: 1–4 / A–D choose, ← → move between questions. */
function useQuizKeys(handlers: { choose: (o: OptionId) => void; next: () => void; prev: () => void; enabled: boolean }) {
  const ref = useRef(handlers)
  useEffect(() => {
    ref.current = handlers
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const h = ref.current
      if (!h.enabled || e.altKey || e.ctrlKey || e.metaKey) return
      const target = e.target as HTMLElement | null
      if (target && (target.closest('input, textarea, select, dialog[open]') || target.isContentEditable)) return
      const option = KEY_TO_OPTION[e.key.toLowerCase()]
      if (option) {
        e.preventDefault()
        h.choose(option)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        h.next()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        h.prev()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

/** After moving to another question, bring its top into view and focus it for screen readers. */
function useQuestionFocus(index: number) {
  const topRef = useRef<HTMLDivElement>(null)
  const shown = useRef(index)
  useEffect(() => {
    if (shown.current === index) return
    shown.current = index
    const el = topRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.top < 0 || rect.top > window.innerHeight * 0.6) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollTo({ top: window.scrollY + rect.top - 12, behavior: reduce ? 'auto' : 'smooth' })
    }
    el.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })
  }, [index])
  return topRef
}

function TranslationToggle() {
  const { t, showTranslation, setShowTranslation } = useLang()
  return (
    <button
      type="button"
      role="switch"
      aria-checked={showTranslation}
      onClick={() => setShowTranslation(!showTranslation)}
      className="inline-flex items-center gap-2.5 rounded-full py-1 text-[0.95rem] font-semibold text-ink-2 hover:text-ink"
    >
      <span className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${showTranslation ? 'bg-sign' : 'bg-track'}`} aria-hidden="true">
        <span className={`absolute top-1 size-4 rounded-full bg-white shadow transition-[left] ${showTranslation ? 'left-5' : 'left-1'}`} />
      </span>
      <span className="pt-0.5">{t('showTranslation')}</span>
    </button>
  )
}

const DEVANAGARI_DIGITS = '०१२३४५६७८९'

/** "Go to question" box for long practice sets; accepts Latin or Devanagari digits. */
function JumpForm({ total, onJump }: { total: number; onJump: (index: number) => void }) {
  const { t } = useLang()
  const [value, setValue] = useState('')
  const [invalid, setInvalid] = useState(false)
  const id = useId()
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        const ascii = value.trim().replace(/[०-९]/g, (d) => String(DEVANAGARI_DIGITS.indexOf(d)))
        const target = /^\d+$/.test(ascii) ? Number(ascii) : NaN
        if (!Number.isInteger(target) || target < 1 || target > total) {
          setInvalid(true)
          return
        }
        setInvalid(false)
        setValue('')
        onJump(target - 1)
      }}
    >
      <label htmlFor={id} className="block text-[0.95rem] font-semibold text-ink-2">
        {t('jumpTo')}
      </label>
      <div className="mt-1.5 flex gap-2">
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${id}-err` : undefined}
          className={`h-12 w-24 rounded-xl border-2 bg-white px-3 text-lg tabular-nums ${invalid ? 'border-stop' : 'border-line focus:border-sign'}`}
        />
        <button type="submit" className="btn-secondary">
          {t('jumpGo')}
        </button>
      </div>
      {invalid && (
        <p id={`${id}-err`} className="mt-1.5 text-[0.95rem] text-stop">
          {t('jumpInvalid', { n: total })}
        </p>
      )}
    </form>
  )
}

// ---------------------------------------------------------------------------
// Practice
// ---------------------------------------------------------------------------

function parseScope(raw: string | undefined): PracticeScope | null {
  if (!raw || raw === 'all') return 'all'
  if (raw === 'mistakes') return 'mistakes'
  return isCategoryId(raw) ? raw : null
}

function startPractice(scope: PracticeScope): PracticeSession | null {
  const saved = loadPractice(scope)
  if (saved && saved.index < saved.questionIds.length && saved.questionIds.every(hasQuestion)) return saved
  const ids = idsForScope(scope)
  if (ids.length === 0) return null
  const now = Date.now()
  return { kind: 'practice', scope, questionIds: ids, index: 0, answers: {}, startedAt: now, updatedAt: now }
}

function PracticeQuiz({ scope }: { scope: PracticeScope }) {
  const { t, n, pick } = useLang()
  const navigate = useNavigate()
  const [session, setSession] = useState<PracticeSession | null>(() => startPractice(scope))
  const finished = useRef(false)

  const title =
    scope === 'all'
      ? t('practiceTitleAll')
      : scope === 'mistakes'
        ? t('practiceTitleMistakes')
        : t('practiceTitleTopic', { topic: pick(getCategory(scope).nameNepali, getCategory(scope).nameEnglish) })
  useDocumentTitle(title)

  useEffect(() => {
    if (session && !finished.current) savePractice(session)
  }, [session])

  const index = session?.index ?? 0
  const topRef = useQuestionFocus(index)

  const questionId = session?.questionIds[index]
  const question = questionId !== undefined ? getQuestion(questionId) : undefined
  const selected = questionId !== undefined ? session?.answers[questionId] : undefined
  const answered = selected !== undefined

  const choose = useCallback(
    (option: OptionId) => {
      if (!session || !question || session.answers[question.id] !== undefined) return
      recordAnswers([{ questionId: question.id, correct: option === question.correctAnswer }])
      setSession({ ...session, answers: { ...session.answers, [question.id]: option } })
    },
    [session, question],
  )

  const finish = useCallback(() => {
    if (!session) return
    finished.current = true
    const score = scoreAnswers(session.questionIds, session.answers, getQuestion, EXAM)
    const result: QuizResult = {
      ...score,
      id: newId(),
      kind: 'practice',
      scope,
      finishedAt: Date.now(),
      durationSeconds: Math.round((Date.now() - session.startedAt) / 1000),
      questionIds: session.questionIds,
      answers: session.answers,
    }
    saveResult(result)
    clearPractice(scope)
    navigate(`/results/${result.id}`)
  }, [session, scope, navigate])

  const go = useCallback(
    (delta: number) => {
      if (!session) return
      const nextIndex = session.index + delta
      if (nextIndex < 0) return
      if (nextIndex >= session.questionIds.length) {
        finish()
        return
      }
      setSession({ ...session, index: nextIndex })
    },
    [session, finish],
  )

  useQuizKeys({ choose, next: () => go(1), prev: () => go(-1), enabled: Boolean(session) })

  if (!session || !question) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-12 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight">{t('emptyMistakesTitle')}</h1>
        <p className="mt-3 text-lg leading-relaxed text-ink-2">{t('emptyMistakesBody')}</p>
        <Link to="/practice/all" className="btn-primary mt-8">
          {t('startPractice')}
        </Link>
        <p className="mt-6">
          <Link to="/" className="link-underline">
            {t('backHome')}
          </Link>
        </p>
      </div>
    )
  }

  const values = Object.entries(session.answers)
  const correct = values.filter(([id, a]) => getQuestion(Number(id)).correctAnswer === a).length
  const wrong = values.length - correct
  const pct = values.length ? Math.round((correct / values.length) * 100) : 0
  const isLast = index === session.questionIds.length - 1

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6 sm:pt-8">
      <Link to="/" className="link-underline text-ink-2">
        {t('backHome')}
      </Link>
      <h1 className="mt-4 text-[1.9rem] leading-tight font-extrabold tracking-tight sm:text-[2.6rem]">{title}</h1>

      <div className="mt-6">
        <StatsBand
          stats={[
            { value: n(correct), label: t('statCorrect'), tone: 'go' },
            { value: n(wrong), label: t('statWrong'), tone: 'stop' },
            { value: `${n(pct)}%`, label: t('statScore'), tone: 'ink' },
          ]}
        />
      </div>

      <div ref={topRef} className="scroll-mt-4 pt-7">
        <ProgressBar
          label={t('questionOf', { i: index + 1, n: session.questionIds.length })}
          detail={t('officialNo', { id: question.id })}
          value={index + 1}
          max={session.questionIds.length}
        />
        <div className="mt-3 mb-5 flex justify-end">
          <TranslationToggle />
        </div>
        <QuestionCard key={question.id} question={question} mode="practice" selected={selected} revealed={answered} onSelect={choose} />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:flex sm:items-center">
        <button type="button" className="btn-secondary" onClick={() => go(-1)} disabled={index === 0}>
          <ChevronLeft />
          <span className="pt-0.5">{t('previous')}</span>
        </button>
        <div className="hidden sm:block sm:flex-1" />
        {!answered && (
          <button type="button" className="btn-ghost col-span-2 row-start-2 sm:order-none" onClick={() => go(1)}>
            {t('skip')}
          </button>
        )}
        <button type="button" className="btn-primary" onClick={() => go(1)} disabled={!answered}>
          <span className="pt-0.5">{isLast ? t('finish') : t('next')}</span>
          {!isLast && <ChevronRight />}
        </button>
      </div>

      <p className="mt-4 hidden text-[0.95rem] text-ink-3 [@media(pointer:fine)]:sm:block">{t('keyboardHint')}</p>

      <div className="mt-8 flex flex-col gap-6 border-t border-line pt-6 sm:flex-row sm:items-end sm:justify-between">
        <JumpForm total={session.questionIds.length} onJump={(i) => setSession({ ...session, index: i })} />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link to="/" className="link-underline">
            {t('leavePractice')}
          </Link>
          <button
            type="button"
            className="link-underline text-ink-2"
            onClick={() => {
              clearPractice(scope)
              setSession(startPractice(scope))
            }}
          >
            {t('restartSet')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Mock exam
// ---------------------------------------------------------------------------

function newExam(): ExamSession {
  const now = Date.now()
  return {
    kind: 'exam',
    id: newId(),
    questionIds: buildExamPaper(QUESTIONS, CATEGORIES),
    index: 0,
    answers: {},
    remainingSeconds: EXAM.durationMinutes * 60,
    startedAt: now,
    updatedAt: now,
  }
}

function resumeOrNewExam(): ExamSession {
  const saved = loadExam()
  if (saved && saved.remainingSeconds > 0 && saved.questionIds.every(hasQuestion)) return saved
  return newExam()
}

function ExamQuiz() {
  const { t, n } = useLang()
  const navigate = useNavigate()
  useDocumentTitle(t('examTitle'))

  const [session, setSession] = useState<ExamSession>(resumeOrNewExam)
  const [confirming, setConfirming] = useState(false)
  const submitted = useRef(false)
  const sessionRef = useRef(session)
  useEffect(() => {
    sessionRef.current = session
  }, [session])

  // Persist every change (answers, position, clock) so a reload resumes the exam.
  useEffect(() => {
    if (!submitted.current) saveExam(session)
  }, [session])

  const submit = useCallback(
    (timedOut: boolean) => {
      if (submitted.current) return
      submitted.current = true
      const s = sessionRef.current
      const score = scoreAnswers(s.questionIds, s.answers, getQuestion, EXAM)
      const result: QuizResult = {
        ...score,
        id: s.id,
        kind: 'exam',
        finishedAt: Date.now(),
        durationSeconds: EXAM.durationMinutes * 60 - s.remainingSeconds,
        timedOut,
        questionIds: s.questionIds,
        answers: s.answers,
      }
      saveResult(result)
      recordAnswers(
        Object.entries(s.answers).map(([id, a]) => ({ questionId: Number(id), correct: getQuestion(Number(id)).correctAnswer === a })),
      )
      clearExam()
      navigate(`/results/${s.id}`, { replace: true })
    },
    [navigate],
  )

  // Wall-clock countdown: robust to throttled timers in background tabs.
  // Time stops while the page is closed, because only the remaining seconds are saved.
  useEffect(() => {
    let last = Date.now()
    const timer = window.setInterval(() => {
      if (submitted.current) return
      const elapsed = Math.floor((Date.now() - last) / 1000)
      if (elapsed < 1) return
      last += elapsed * 1000
      setSession((s) => ({ ...s, remainingSeconds: Math.max(0, s.remainingSeconds - elapsed) }))
    }, 250)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (session.remainingSeconds <= 0) submit(true)
  }, [session.remainingSeconds, submit])

  const topRef = useQuestionFocus(session.index)
  const question = getQuestion(session.questionIds[session.index])
  const total = session.questionIds.length
  const answeredCount = Object.keys(session.answers).length
  const unanswered = total - answeredCount
  const isLast = session.index === total - 1
  const lowTime = session.remainingSeconds <= 5 * 60

  const choose = useCallback((option: OptionId) => {
    setSession((s) => ({ ...s, answers: { ...s.answers, [s.questionIds[s.index]]: option } }))
  }, [])
  const jump = useCallback((i: number) => setSession((s) => ({ ...s, index: Math.min(Math.max(i, 0), s.questionIds.length - 1) })), [])

  useQuizKeys({
    choose,
    next: () => (isLast ? setConfirming(true) : jump(session.index + 1)),
    prev: () => jump(session.index - 1),
    enabled: !confirming,
  })

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6 sm:pt-8">
      <Link to="/" className="link-underline text-ink-2">
        {t('backHome')}
      </Link>
      <h1 className="mt-4 text-[1.9rem] leading-tight font-extrabold tracking-tight sm:text-[2.6rem]">{t('examTitle')}</h1>

      <div className="mt-6">
        <StatsBand
          stats={[
            {
              value: (
                <span role="timer" aria-live="off" className={lowTime ? 'text-stop' : undefined}>
                  {n(formatClock(session.remainingSeconds))}
                </span>
              ),
              label: t('statTimeLeft'),
              tone: 'ink',
            },
            { value: `${n(answeredCount)}/${n(total)}`, label: t('statAnswered'), tone: 'ink' },
          ]}
        />
      </div>

      <div className="mt-6">
        <QuestionNavigator questionIds={session.questionIds} answers={session.answers} current={session.index} onJump={jump} />
      </div>

      <div ref={topRef} className="scroll-mt-4 pt-7">
        <ProgressBar
          label={t('questionOf', { i: session.index + 1, n: total })}
          detail={t('officialNo', { id: question.id })}
          value={session.index + 1}
          max={total}
        />
        <div className="mt-3 mb-5 flex justify-end">
          <TranslationToggle />
        </div>
        <QuestionCard key={question.id} question={question} mode="exam" selected={session.answers[question.id]} revealed={false} onSelect={choose} />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:flex sm:items-center">
        <button type="button" className="btn-secondary" onClick={() => jump(session.index - 1)} disabled={session.index === 0}>
          <ChevronLeft />
          <span className="pt-0.5">{t('previous')}</span>
        </button>
        <div className="hidden sm:block sm:flex-1" />
        {isLast ? (
          <button type="button" className="btn-primary" onClick={() => setConfirming(true)}>
            <span className="pt-0.5">{t('submitExam')}</span>
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={() => jump(session.index + 1)}>
            <span className="pt-0.5">{t('next')}</span>
            <ChevronRight />
          </button>
        )}
      </div>

      <p className="mt-4 hidden text-[0.95rem] text-ink-3 [@media(pointer:fine)]:sm:block">{t('keyboardHint')}</p>

      <div className="mt-8 flex flex-wrap items-start justify-between gap-4 border-t border-line pt-6">
        <div>
          <Link to="/" className="link-underline">
            {t('leaveExam')}
          </Link>
          <p className="mt-1 max-w-[42ch] text-[0.95rem] text-ink-3">{t('leaveExamNote')}</p>
        </div>
        {!isLast && (
          <button type="button" className="btn-secondary" onClick={() => setConfirming(true)}>
            {t('submitExam')}
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirming}
        title={t('confirmSubmitTitle')}
        confirmLabel={t('submitExam')}
        cancelLabel={t('keepGoing')}
        onConfirm={() => submit(false)}
        onCancel={() => setConfirming(false)}
      >
        <p>{unanswered > 0 ? t('confirmSubmitUnanswered', { n: unanswered }) : t('confirmSubmitAll')}</p>
      </ConfirmDialog>
    </div>
  )
}

// ---------------------------------------------------------------------------

export default function Quiz({ mode }: { mode: 'practice' | 'exam' }) {
  const params = useParams()
  if (mode === 'exam') return <ExamQuiz />
  const scope = parseScope(params.scope)
  if (!scope) return <Navigate to="/practice/all" replace />
  return <PracticeQuiz key={scope} scope={scope} />
}
