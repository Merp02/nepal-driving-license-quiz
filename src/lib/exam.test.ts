import { describe, expect, it } from 'vitest'
import { buildExamPaper, formatClock, scoreAnswers, seededRng, shuffle } from './exam'
import type { Answers, CategoryConfig, ExamConfig, OptionId, Question } from './types'
import rawConfig from '../data/examConfig.json'
import rawQuestions from '../data/questions.json'

const config = rawConfig as ExamConfig
const questions = rawQuestions as Question[]
const byId = new Map(questions.map((q) => [q.id, q]))
const lookup = (id: number) => byId.get(id)!

const wrongOption = (q: Question): OptionId => (['A', 'B', 'C', 'D'] as OptionId[]).find((o) => o !== q.correctAnswer)!

describe('buildExamPaper', () => {
  it('draws 25 questions with the official number from each topic', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const paper = buildExamPaper(questions, config.categories, seededRng(seed))
      expect(paper).toHaveLength(config.questionsPerExam)
      expect(new Set(paper).size).toBe(paper.length)
      for (const cat of config.categories) {
        const inCat = paper.filter((id) => lookup(id).category === cat.id)
        expect(inCat).toHaveLength(cat.questionsInExam)
      }
    }
  })

  it('keeps topics in bank order', () => {
    const paper = buildExamPaper(questions, config.categories, seededRng(7))
    const order = paper.map((id) => config.categories.findIndex((c) => c.id === lookup(id).category))
    expect(order).toEqual([...order].sort((a, b) => a - b))
  })

  it('is deterministic for a seed and varies across seeds', () => {
    const a = buildExamPaper(questions, config.categories, seededRng(42))
    const b = buildExamPaper(questions, config.categories, seededRng(42))
    const c = buildExamPaper(questions, config.categories, seededRng(43))
    expect(a).toEqual(b)
    expect(a).not.toEqual(c)
  })

  it('refuses a topic that is too small', () => {
    const tiny: CategoryConfig[] = [{ ...config.categories[0], questionsInExam: 999 }]
    expect(() => buildExamPaper(questions, tiny)).toThrow()
  })
})

describe('scoreAnswers', () => {
  const paper = buildExamPaper(questions, config.categories, seededRng(3))

  const answer = (nCorrect: number, nWrong: number): Answers => {
    const answers: Answers = {}
    paper.forEach((id, i) => {
      const q = lookup(id)
      if (i < nCorrect) answers[id] = q.correctAnswer
      else if (i < nCorrect + nWrong) answers[id] = wrongOption(q)
    })
    return answers
  }

  it('gives 4 marks per correct answer out of 100', () => {
    const s = scoreAnswers(paper, answer(25, 0), lookup, config)
    expect(s).toMatchObject({ total: 25, correct: 25, wrong: 0, unanswered: 0, marks: 100, maxMarks: 100, percentage: 100, passed: true })
  })

  it('passes at exactly 60 marks (15 correct) and fails at 56 (14 correct)', () => {
    const pass = scoreAnswers(paper, answer(15, 10), lookup, config)
    expect(pass.marks).toBe(60)
    expect(pass.percentage).toBe(60)
    expect(pass.passed).toBe(true)

    const fail = scoreAnswers(paper, answer(14, 11), lookup, config)
    expect(fail.marks).toBe(56)
    expect(fail.passed).toBe(false)
  })

  it('counts unanswered questions separately, with no negative marking', () => {
    const s = scoreAnswers(paper, answer(10, 5), lookup, config)
    expect(s).toMatchObject({ correct: 10, wrong: 5, unanswered: 10, marks: 40, passed: false })
  })

  it('breaks marks down by topic', () => {
    const s = scoreAnswers(paper, answer(25, 0), lookup, config)
    expect(s.byCategory.map((c) => [c.id, c.total, c.marks])).toEqual(
      config.categories.map((c) => [c.id, c.questionsInExam, c.totalMarks]),
    )
  })
})

describe('helpers', () => {
  it('shuffle keeps every item', () => {
    const items = Array.from({ length: 100 }, (_, i) => i)
    expect(shuffle(items, seededRng(1)).sort((a, b) => a - b)).toEqual(items)
  })

  it('formats the exam clock', () => {
    expect(formatClock(30 * 60)).toBe('30:00')
    expect(formatClock(65)).toBe('01:05')
    expect(formatClock(-3)).toBe('00:00')
  })
})
