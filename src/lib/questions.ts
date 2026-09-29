import data from '../data/questions.json'
import { ALL_QUESTION_IDS, questionIdsInCategory } from './config'
import { mistakeIds } from './storage'
import type { PracticeScope, Question } from './types'

export const QUESTIONS: Question[] = data as Question[]

const byId = new Map(QUESTIONS.map((q) => [q.id, q]))

export function getQuestion(id: number): Question {
  const q = byId.get(id)
  if (!q) throw new Error(`Unknown question ${id}`)
  return q
}

export function hasQuestion(id: number): boolean {
  return byId.has(id)
}

/** Question ids for a practice scope, in official bank order. */
export function idsForScope(scope: PracticeScope): number[] {
  if (scope === 'all') return ALL_QUESTION_IDS.slice()
  if (scope === 'mistakes') return mistakeIds()
  return questionIdsInCategory(scope)
}
