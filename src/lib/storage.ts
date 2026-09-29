/**
 * Small, defensive localStorage layer. Every read and write is wrapped so the
 * app keeps working in private windows or when storage is full or blocked.
 */
import type {
  ExamSession,
  Lang,
  OptionId,
  PracticeScope,
  PracticeSession,
  QuestionStats,
  QuizResult,
} from './types'

const PREFIX = 'ndlq:v1:'
const KEYS = {
  prefs: `${PREFIX}prefs`,
  exam: `${PREFIX}exam`,
  results: `${PREFIX}results`,
  stats: `${PREFIX}stats`,
  practice: (scope: PracticeScope) => `${PREFIX}practice:${scope}`,
}

const MAX_RESULTS = 30

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable or full: the app still works for this visit */
  }
}

function remove(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

// ---- preferences -----------------------------------------------------------

export interface Prefs {
  lang: Lang
  showTranslation: boolean
}

export function loadPrefs(): Prefs {
  const p = read<Partial<Prefs>>(KEYS.prefs, {})
  return {
    lang: p.lang === 'en' || p.lang === 'ne' ? p.lang : 'ne',
    showTranslation: Boolean(p.showTranslation),
  }
}

export function savePrefs(prefs: Prefs): void {
  write(KEYS.prefs, prefs)
}

// ---- practice sessions -------------------------------------------------------

export function loadPractice(scope: PracticeScope): PracticeSession | null {
  const s = read<PracticeSession | null>(KEYS.practice(scope), null)
  if (!s || s.kind !== 'practice' || !Array.isArray(s.questionIds) || s.questionIds.length === 0) return null
  return s
}

export function savePractice(session: PracticeSession): void {
  write(KEYS.practice(session.scope), { ...session, updatedAt: Date.now() })
}

export function clearPractice(scope: PracticeScope): void {
  remove(KEYS.practice(scope))
}

/** All unfinished practice sessions, most recently used first. */
export function listPractice(scopes: PracticeScope[]): PracticeSession[] {
  return scopes
    .map((s) => loadPractice(s))
    .filter(
      (s): s is PracticeSession =>
        s !== null && s.index < s.questionIds.length && (s.index > 0 || Object.keys(s.answers).length > 0),
    )
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

// ---- mock exam session -------------------------------------------------------

export function loadExam(): ExamSession | null {
  const s = read<ExamSession | null>(KEYS.exam, null)
  if (!s || s.kind !== 'exam' || !Array.isArray(s.questionIds) || s.questionIds.length === 0) return null
  return s
}

export function saveExam(session: ExamSession): void {
  write(KEYS.exam, { ...session, updatedAt: Date.now() })
}

export function clearExam(): void {
  remove(KEYS.exam)
}

// ---- completed results -------------------------------------------------------

export function loadResults(): QuizResult[] {
  const list = read<QuizResult[]>(KEYS.results, [])
  return Array.isArray(list) ? list : []
}

export function saveResult(result: QuizResult): void {
  const list = loadResults().filter((r) => r.id !== result.id)
  list.unshift(result)
  write(KEYS.results, list.slice(0, MAX_RESULTS))
}

export function findResult(id: string): QuizResult | undefined {
  return loadResults().find((r) => r.id === id)
}

// ---- per-question history ------------------------------------------------------

export function loadStats(): QuestionStats {
  const s = read<QuestionStats>(KEYS.stats, {})
  return s && typeof s === 'object' ? s : {}
}

export function recordAnswers(entries: { questionId: number; correct: boolean }[]): QuestionStats {
  const stats = loadStats()
  const now = Date.now()
  for (const { questionId, correct } of entries) {
    const prev = stats[questionId]
    stats[questionId] = {
      attempts: (prev?.attempts ?? 0) + 1,
      correct: (prev?.correct ?? 0) + (correct ? 1 : 0),
      last: correct ? 'correct' : 'wrong',
      lastAt: now,
    }
  }
  write(KEYS.stats, stats)
  return stats
}

/** Question ids whose most recent attempt was wrong, in bank order. */
export function mistakeIds(stats: QuestionStats = loadStats()): number[] {
  return Object.entries(stats)
    .filter(([, s]) => s.last === 'wrong')
    .map(([id]) => Number(id))
    .sort((a, b) => a - b)
}

export function resetAllProgress(): void {
  try {
    const keys: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i)
      if (k && k.startsWith(PREFIX) && k !== KEYS.prefs) keys.push(k)
    }
    keys.forEach((k) => window.localStorage.removeItem(k))
  } catch {
    /* ignore */
  }
}

export function newId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  }
}

export type { OptionId }
