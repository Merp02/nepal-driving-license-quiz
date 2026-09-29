export type Lang = 'ne' | 'en'

export type OptionId = 'A' | 'B' | 'C' | 'D'

export type CategoryId =
  | 'vehicle-operation'
  | 'laws'
  | 'technical'
  | 'environment'
  | 'accident-awareness'
  | 'traffic-signs'

/** Which questions a practice session covers. */
export type PracticeScope = 'all' | 'mistakes' | CategoryId

export interface QuestionOption {
  id: OptionId
  textNepali: string
  textEnglish: string
}

export interface SourceNote {
  english: string
  nepali: string
}

export interface Question {
  /** Official question number in the DoTM question bank (1–500). */
  id: number
  category: CategoryId
  questionNepali: string
  questionEnglish: string
  options: QuestionOption[]
  correctAnswer: OptionId
  /** The source PDFs contain no explanations, so this is empty for now. */
  explanation: string
  /** Traffic-sign image, questions 416–500. */
  image?: string
  /** Present where the Nepali and English PDFs disagree on the answer. */
  sourceNote?: SourceNote
}

export interface CategoryConfig {
  id: CategoryId
  nameEnglish: string
  nameNepali: string
  titleEnglish: string
  titleNepali: string
  questionRange: [number, number]
  poolSize: number
  questionsInExam: number
  marksPerQuestion: number
  totalMarks: number
}

export interface ExamConfig {
  examName: string
  examNameNepali: string
  licenseCategories: { english: string; nepali: string }
  source: {
    publisher: string
    publisherNepali: string
    revision: string
    revisionNepali: string
    rulesSection: string
  }
  totalQuestionBankSize: number
  questionsPerExam: number
  totalMarks: number
  maximumAchievableMarks: number
  marksPerQuestion: number
  allQuestionsEqualMarks: boolean
  passingMarks: number
  passingPercentage: number
  durationMinutes: number
  categories: CategoryConfig[]
}

/** question id -> chosen option */
export type Answers = Record<number, OptionId>

export interface PracticeSession {
  kind: 'practice'
  scope: PracticeScope
  questionIds: number[]
  index: number
  answers: Answers
  startedAt: number
  updatedAt: number
}

export interface ExamSession {
  kind: 'exam'
  id: string
  questionIds: number[]
  index: number
  answers: Answers
  remainingSeconds: number
  startedAt: number
  updatedAt: number
}

export interface CategoryScore {
  id: CategoryId
  total: number
  correct: number
  marks: number
  maxMarks: number
}

export interface Score {
  total: number
  correct: number
  wrong: number
  unanswered: number
  marks: number
  maxMarks: number
  /** marks / maxMarks, 0–100, rounded to one decimal */
  percentage: number
  passed: boolean
  byCategory: CategoryScore[]
}

export interface QuizResult extends Score {
  id: string
  kind: 'exam' | 'practice'
  scope?: PracticeScope
  finishedAt: number
  durationSeconds: number
  timedOut?: boolean
  questionIds: number[]
  answers: Answers
}

export interface QuestionStat {
  attempts: number
  correct: number
  last: 'correct' | 'wrong'
  lastAt: number
}

export type QuestionStats = Record<number, QuestionStat>
