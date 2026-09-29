/**
 * Pure exam logic: building a mock exam paper and scoring answers.
 * Kept free of React and storage so it can be unit-tested.
 */
import type { Answers, CategoryConfig, CategoryId, ExamConfig, OptionId, Question, Score } from './types'

export type Rng = () => number

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const a = items.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Deterministic PRNG for tests (mulberry32). */
export function seededRng(seed: number): Rng {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Build a mock exam paper following the DoTM instructions: from every topic,
 * draw exactly the number of questions that topic contributes to the real exam
 * (6 + 5 + 3 + 2 + 3 + 6 = 25). Questions stay grouped by topic, in the order
 * the topics appear in the question bank, and are shuffled within each topic.
 */
export function buildExamPaper(
  questions: readonly Pick<Question, 'id' | 'category'>[],
  categories: readonly CategoryConfig[],
  rng: Rng = Math.random,
): number[] {
  const paper: number[] = []
  for (const cat of categories) {
    const pool = questions.filter((q) => q.category === cat.id).map((q) => q.id)
    if (pool.length < cat.questionsInExam) {
      throw new Error(`Topic ${cat.id} has ${pool.length} questions, needs ${cat.questionsInExam}`)
    }
    paper.push(...shuffle(pool, rng).slice(0, cat.questionsInExam))
  }
  return paper
}

export function isCorrect(question: Pick<Question, 'correctAnswer'>, answer: OptionId | undefined): boolean {
  return answer !== undefined && answer === question.correctAnswer
}

/**
 * Score a set of answered questions. Every question carries the same marks
 * (4 in the official exam); unanswered questions score nothing and there is
 * no negative marking.
 */
export function scoreAnswers(
  questionIds: readonly number[],
  answers: Answers,
  lookup: (id: number) => Pick<Question, 'id' | 'category' | 'correctAnswer'>,
  config: Pick<ExamConfig, 'marksPerQuestion' | 'passingPercentage' | 'categories'>,
): Score {
  let correct = 0
  let wrong = 0
  let unanswered = 0
  const perCat = new Map<CategoryId, { total: number; correct: number }>()

  for (const id of questionIds) {
    const q = lookup(id)
    const a = answers[id]
    const bucket = perCat.get(q.category) ?? { total: 0, correct: 0 }
    bucket.total += 1
    if (a === undefined) {
      unanswered += 1
    } else if (a === q.correctAnswer) {
      correct += 1
      bucket.correct += 1
    } else {
      wrong += 1
    }
    perCat.set(q.category, bucket)
  }

  const total = questionIds.length
  const maxMarks = total * config.marksPerQuestion
  const marks = correct * config.marksPerQuestion
  const percentage = maxMarks === 0 ? 0 : Math.round((marks / maxMarks) * 1000) / 10
  const passed = maxMarks > 0 && marks * 100 >= config.passingPercentage * maxMarks

  const byCategory = config.categories
    .filter((c) => perCat.has(c.id))
    .map((c) => {
      const b = perCat.get(c.id)!
      return {
        id: c.id,
        total: b.total,
        correct: b.correct,
        marks: b.correct * config.marksPerQuestion,
        maxMarks: b.total * config.marksPerQuestion,
      }
    })

  return { total, correct, wrong, unanswered, marks, maxMarks, percentage, passed, byCategory }
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
