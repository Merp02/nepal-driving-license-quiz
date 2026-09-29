import type { KeyboardEvent } from 'react'
import { optionLabel } from '../lib/i18n'
import type { Lang, QuestionOption } from '../lib/types'
import { AlertIcon, CheckIcon } from './Icons'

/**
 * idle      nothing chosen yet
 * selected  chosen in the mock exam (no feedback until the end)
 * correct   chosen and right
 * wrong     chosen and wrong
 * answer    the right answer, revealed after a wrong choice
 * muted     other options once the question is answered
 */
export type OptionState = 'idle' | 'selected' | 'correct' | 'wrong' | 'answer' | 'muted'

interface AnswerOptionProps {
  option: QuestionOption
  lang: Lang
  state: OptionState
  showTranslation: boolean
  locked: boolean
  tabIndex: number
  onSelect: () => void
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void
  buttonRef?: (el: HTMLButtonElement | null) => void
}

const BOX: Record<OptionState, string> = {
  idle: 'border-line bg-white hover:border-ink-3 hover:bg-mist/60',
  selected: 'border-sign bg-sign-tint',
  correct: 'border-go bg-go-tint',
  wrong: 'border-stop bg-stop-tint',
  answer: 'border-go bg-white',
  muted: 'border-line bg-white',
}

const BADGE: Record<OptionState, string> = {
  idle: 'bg-mist text-ink group-hover:bg-white',
  selected: 'bg-sign text-white',
  correct: 'bg-go text-white',
  wrong: 'bg-stop text-white',
  answer: 'bg-white text-go ring-2 ring-go ring-inset',
  muted: 'bg-mist text-ink-3',
}

const TEXT: Record<OptionState, string> = {
  idle: 'text-ink',
  selected: 'text-ink',
  correct: 'text-go',
  wrong: 'text-stop',
  answer: 'text-go',
  muted: 'text-ink-3',
}

export default function AnswerOption({
  option,
  lang,
  state,
  showTranslation,
  locked,
  tabIndex,
  onSelect,
  onKeyDown,
  buttonRef,
}: AnswerOptionProps) {
  const text = lang === 'ne' ? option.textNepali : option.textEnglish
  const other = lang === 'ne' ? option.textEnglish : option.textNepali
  const checked = state === 'selected' || state === 'correct' || state === 'wrong'

  return (
    <button
      ref={buttonRef}
      type="button"
      role="radio"
      aria-checked={checked}
      aria-disabled={locked || undefined}
      tabIndex={tabIndex}
      onClick={() => {
        if (!locked) onSelect()
      }}
      onKeyDown={onKeyDown}
      className={`group flex w-full items-start gap-3.5 rounded-xl border-2 px-3.5 py-3 text-left transition-colors duration-150 sm:px-4 ${BOX[state]} ${
        locked ? 'cursor-default' : 'cursor-pointer'
      }`}
    >
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-lg pt-0.5 text-lg font-bold transition-colors ${BADGE[state]}`}
        lang={lang}
        aria-hidden="true"
      >
        {optionLabel(option.id, lang)}
      </span>
      <span className="min-w-0 flex-1 pt-1">
        <span className={`block text-[1.08rem] leading-snug font-medium sm:text-lg ${TEXT[state]}`}>{text}</span>
        {showTranslation && (
          <span className="mt-1 block text-[0.95rem] leading-snug text-ink-3" lang={lang === 'ne' ? 'en' : 'ne'}>
            {other}
          </span>
        )}
      </span>
      {(state === 'correct' || state === 'answer') && <CheckIcon className="mt-1 size-6 shrink-0 text-go" />}
      {state === 'wrong' && <AlertIcon className="mt-1 size-6 shrink-0 text-stop" />}
    </button>
  )
}
