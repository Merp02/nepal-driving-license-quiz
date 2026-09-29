import raw from '../data/examConfig.json'
import type { CategoryConfig, CategoryId, ExamConfig } from './types'

export const EXAM: ExamConfig = raw as ExamConfig

export const CATEGORIES: CategoryConfig[] = EXAM.categories

const byId = new Map(CATEGORIES.map((c) => [c.id, c]))

export function getCategory(id: CategoryId): CategoryConfig {
  const c = byId.get(id)
  if (!c) throw new Error(`Unknown category: ${id}`)
  return c
}

export function isCategoryId(value: string): value is CategoryId {
  return byId.has(value as CategoryId)
}

/** Category of an official question number, from the ranges in the question bank. */
export function categoryOfQuestion(questionId: number): CategoryConfig {
  const c = CATEGORIES.find((cat) => questionId >= cat.questionRange[0] && questionId <= cat.questionRange[1])
  if (!c) throw new Error(`Question ${questionId} is outside the bank`)
  return c
}

export function questionIdsInCategory(id: CategoryId): number[] {
  const [from, to] = getCategory(id).questionRange
  return Array.from({ length: to - from + 1 }, (_, i) => from + i)
}

export const ALL_QUESTION_IDS: number[] = Array.from({ length: EXAM.totalQuestionBankSize }, (_, i) => i + 1)
