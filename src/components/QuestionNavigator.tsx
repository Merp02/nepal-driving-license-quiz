import { useLang } from '../lib/lang'
import type { Answers } from '../lib/types'

interface QuestionNavigatorProps {
  questionIds: number[]
  answers: Answers
  current: number
  onJump: (index: number) => void
}

/** Grid of the 25 exam questions: filled when answered, outlined when current. */
export default function QuestionNavigator({ questionIds, answers, current, onJump }: QuestionNavigatorProps) {
  const { t, n } = useLang()
  return (
    <nav aria-label={t('navigatorLabel')}>
      <ol className="grid grid-cols-9 gap-1.5 sm:grid-cols-[repeat(13,minmax(0,1fr))]">
        {questionIds.map((id, i) => {
          const answered = answers[id] !== undefined
          const isCurrent = i === current
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onJump(i)}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={t('navigatorItem', { i: i + 1, state: answered ? t('stateAnswered') : t('stateUnanswered') })}
                className={`grid h-9 w-full place-items-center rounded-lg pt-0.5 text-[0.95rem] font-semibold tabular-nums transition-colors ${
                  answered ? 'bg-ink text-white' : 'bg-mist text-ink-2 hover:bg-line'
                } ${isCurrent ? 'ring-3 ring-sign ring-offset-2' : ''}`}
              >
                {n(i + 1)}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
