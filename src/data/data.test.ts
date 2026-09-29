import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { ExamConfig, Question } from '../lib/types'
import rawConfig from './examConfig.json'
import rawQuestions from './questions.json'

const config = rawConfig as ExamConfig
const questions = rawQuestions as Question[]
const publicDir = fileURLToPath(new URL('../../public', import.meta.url))

describe('exam configuration', () => {
  it('matches the rules printed in the question bank', () => {
    expect(config.totalQuestionBankSize).toBe(500)
    expect(config.questionsPerExam).toBe(25)
    expect(config.marksPerQuestion).toBe(4)
    expect(config.totalMarks).toBe(100)
    expect(config.passingMarks).toBe(60)
    expect(config.passingPercentage).toBe(60)
    expect(config.durationMinutes).toBe(30)
  })

  it('is internally consistent', () => {
    expect(config.questionsPerExam * config.marksPerQuestion).toBe(config.totalMarks)
    expect((config.passingPercentage / 100) * config.totalMarks).toBe(config.passingMarks)
    expect(config.categories.reduce((s, c) => s + c.poolSize, 0)).toBe(config.totalQuestionBankSize)
    expect(config.categories.reduce((s, c) => s + c.questionsInExam, 0)).toBe(config.questionsPerExam)
    expect(config.categories.reduce((s, c) => s + c.totalMarks, 0)).toBe(config.totalMarks)
    expect(config.categories.map((c) => [c.poolSize, c.questionsInExam])).toEqual([
      [130, 6],
      [90, 5],
      [80, 3],
      [30, 2],
      [60, 3],
      [110, 6],
    ])
  })
})

describe('question bank', () => {
  it('has all 500 questions numbered 1–500', () => {
    expect(questions.map((q) => q.id)).toEqual(Array.from({ length: 500 }, (_, i) => i + 1))
  })

  it('gives every question text and four options in both languages', () => {
    for (const q of questions) {
      expect(q.questionNepali.trim(), `q${q.id}`).not.toBe('')
      expect(q.questionEnglish.trim(), `q${q.id}`).not.toBe('')
      expect(q.options.map((o) => o.id), `q${q.id}`).toEqual(['A', 'B', 'C', 'D'])
      for (const o of q.options) {
        expect(o.textNepali.trim(), `q${q.id}${o.id}`).not.toBe('')
        expect(o.textEnglish.trim(), `q${q.id}${o.id}`).not.toBe('')
      }
      expect(['A', 'B', 'C', 'D']).toContain(q.correctAnswer)
    }
  })

  it('contains no extraction debris', () => {
    for (const q of questions) {
      const text = [q.questionNepali, ...q.options.map((o) => o.textNepali)].join(' ')
      expect(text, `q${q.id}`).not.toMatch(/[�⦃⦄]/)
      // A vowel sign straight after a virama means glyphs were re-ordered wrongly.
      expect(text, `q${q.id}`).not.toMatch(/्[ा-ौ]/)
    }
  })

  it('files each question under the topic its number belongs to', () => {
    for (const c of config.categories) {
      const ids = questions.filter((q) => q.category === c.id).map((q) => q.id)
      expect(ids.length).toBe(c.poolSize)
      expect(Math.min(...ids)).toBe(c.questionRange[0])
      expect(Math.max(...ids)).toBe(c.questionRange[1])
    }
  })

  it('has an image file for every traffic-sign question', () => {
    const withImage = questions.filter((q) => q.image)
    expect(withImage.map((q) => q.id)).toEqual(Array.from({ length: 85 }, (_, i) => 416 + i))
    for (const q of withImage) {
      expect(existsSync(`${publicDir}${q.image}`), q.image).toBe(true)
    }
  })

  it('notes every answer where the Nepali and English PDFs disagree', () => {
    expect(questions.filter((q) => q.sourceNote).map((q) => q.id)).toEqual([178, 215, 237, 286, 310, 322, 415, 454])
  })
})
