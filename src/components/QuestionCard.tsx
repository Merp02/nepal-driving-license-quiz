import { useRef, type KeyboardEvent } from 'react'
import { EXAM, getCategory } from '../lib/config'
import { optionLabel } from '../lib/i18n'
import { useLang } from '../lib/lang'
import type { OptionId, Question } from '../lib/types'
import AnswerOption, { type OptionState } from './AnswerOption'
import { AlertIcon, CheckIcon } from './Icons'

interface QuestionCardProps {
  question: Question
  mode: 'practice' | 'exam'
  selected: OptionId | undefined
  /** Practice mode: the answer has been checked and feedback is showing. */
  revealed: boolean
  onSelect: (option: OptionId) => void
}

function optionState(mode: 'practice' | 'exam', optionId: OptionId, selected: OptionId | undefined, correct: OptionId, revealed: boolean): OptionState {
  if (mode === 'exam') return optionId === selected ? 'selected' : 'idle'
  if (!revealed) return 'idle'
  if (optionId === selected) return optionId === correct ? 'correct' : 'wrong'
  if (optionId === correct) return 'answer'
  return 'muted'
}

export default function QuestionCard({ question, mode, selected, revealed, onSelect }: QuestionCardProps) {
  const { lang, t, n, pick, showTranslation } = useLang()
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const headingId = `q-${question.id}-text`
  const locked = mode === 'practice' && revealed
  const category = getCategory(question.category)
  const isRight = selected === question.correctAnswer

  // Roving focus: arrows move between options, Space/Enter chooses.
  const focusIndex = Math.max(0, question.options.findIndex((o) => o.id === selected))
  const onKeyDown = (index: number) => (e: KeyboardEvent<HTMLButtonElement>) => {
    const last = question.options.length - 1
    let next = -1
    if (e.key === 'ArrowDown') next = index === last ? 0 : index + 1
    else if (e.key === 'ArrowUp') next = index === 0 ? last : index - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    if (next >= 0) {
      e.preventDefault()
      e.stopPropagation()
      refs.current[next]?.focus()
    }
  }

  const correctOption = question.options.find((o) => o.id === question.correctAnswer)!
  const correctText = pick(correctOption.textNepali, correctOption.textEnglish)
  const questionText = pick(question.questionNepali, question.questionEnglish)
  const translation = pick(question.questionEnglish, question.questionNepali)

  return (
    <article aria-labelledby={headingId}>
      {question.image && (
        <figure className="grid place-items-center rounded-2xl bg-mist px-4 py-5">
          <img
            src={question.image}
            alt={t('signAlt', { id: question.id })}
            width={160}
            height={160}
            className="h-36 w-auto max-w-full object-contain mix-blend-multiply sm:h-44"
            decoding="async"
          />
        </figure>
      )}

      <h2 id={headingId} tabIndex={-1} className={`${question.image ? 'mt-6' : 'mt-1'} outline-none text-[1.4rem] leading-snug font-bold tracking-tight text-ink sm:text-[1.7rem]`}>
        {questionText}
      </h2>
      {showTranslation && (
        <p className="mt-1.5 text-lg leading-snug text-ink-3" lang={lang === 'ne' ? 'en' : 'ne'}>
          {translation}
        </p>
      )}

      <div role="radiogroup" aria-labelledby={headingId} className="mt-5 space-y-2.5">
        {question.options.map((o, i) => (
          <AnswerOption
            key={o.id}
            option={o}
            lang={lang}
            state={optionState(mode, o.id, selected, question.correctAnswer, revealed)}
            showTranslation={showTranslation}
            locked={locked}
            tabIndex={i === focusIndex ? 0 : -1}
            onSelect={() => onSelect(o.id)}
            onKeyDown={onKeyDown(i)}
            buttonRef={(el) => {
              refs.current[i] = el
            }}
          />
        ))}
      </div>

      <div aria-live="polite" aria-atomic="true">
        {mode === 'practice' && revealed && selected && (
          <div
            className={`mt-5 flex items-start gap-4 rounded-2xl px-5 py-4 text-lg leading-snug font-semibold ${
              isRight ? 'bg-go-tint text-go' : 'bg-stop-tint text-stop'
            }`}
          >
            {isRight ? <CheckIcon className="size-7 shrink-0" /> : <AlertIcon className="size-7 shrink-0" />}
            <p className="pt-1">
              {isRight
                ? t('feedbackCorrect')
                : t('feedbackWrong', { letter: optionLabel(question.correctAnswer, lang), text: correctText })}
            </p>
          </div>
        )}
      </div>

      {mode === 'practice' && revealed && question.explanation && (
        <p className="mt-4 text-lg leading-relaxed text-ink-2">{question.explanation}</p>
      )}

      {mode === 'practice' && revealed && question.sourceNote && (
        <aside className="mt-4 rounded-2xl border-2 border-dashed border-line px-5 py-4">
          <h3 className="font-bold text-ink">{t('noteTitle')}</h3>
          <p className="mt-1 leading-relaxed text-ink-2">{pick(question.sourceNote.nepali, question.sourceNote.english)}</p>
        </aside>
      )}

      <div className="mt-6 space-y-0.5 rounded-2xl bg-mist px-5 py-4 text-ink-2">
        <p>
          {t('infoMarks', { marks: '' })}
          <strong className="font-bold text-ink">{n(EXAM.marksPerQuestion)}</strong>
        </p>
        <p>{t('infoTopic', { topic: pick(category.titleNepali, category.titleEnglish) })}</p>
        <p>{t('infoSource', { id: question.id })}</p>
      </div>
    </article>
  )
}
