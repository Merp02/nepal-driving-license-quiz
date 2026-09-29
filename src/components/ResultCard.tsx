import { EXAM } from '../lib/config'
import { useLang } from '../lib/lang'
import type { QuizResult } from '../lib/types'
import { AlertIcon, CheckIcon } from './Icons'
import StatsBand from './StatsBand'

/** Score band plus the pass/fail verdict, modelled on a results slip. */
export default function ResultCard({ result }: { result: QuizResult }) {
  const { t, n } = useLang()
  const isExam = result.kind === 'exam'
  const pct = n(Number.isInteger(result.percentage) ? result.percentage : result.percentage.toFixed(1))

  return (
    <section aria-labelledby="verdict" className="overflow-hidden rounded-2xl">
      <StatsBand
        stats={[
          { value: n(result.correct), label: t('statCorrect'), tone: 'go' },
          { value: n(result.wrong), label: t('statWrong'), tone: 'stop' },
          isExam
            ? { value: n(result.marks), label: t('statMarks'), tone: 'ink' }
            : { value: `${pct}%`, label: t('statScore'), tone: 'ink' },
        ]}
      />
      <div
        className={`mt-1 rounded-2xl px-5 py-7 sm:px-8 sm:py-9 ${
          !isExam ? 'bg-mist' : result.passed ? 'bg-go-tint' : 'bg-stop-tint'
        }`}
      >
        {isExam ? (
          <>
            <h2 id="verdict" className={`flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-[1.9rem] ${result.passed ? 'text-go' : 'text-stop'}`}>
              {result.passed ? <CheckIcon className="size-8 shrink-0" /> : <AlertIcon className="size-8 shrink-0" />}
              <span className="pt-1">{result.passed ? t('resultPassHeading') : t('resultFailHeading')}</span>
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink sm:text-xl">
              {t('resultBody', { marks: result.marks, max: result.maxMarks, pct, pass: EXAM.passingMarks })}
            </p>
          </>
        ) : (
          <>
            <h2 id="verdict" className="text-2xl font-bold tracking-tight text-ink sm:text-[1.9rem]">
              {t('practiceResultTitle')}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink sm:text-xl">
              {t('resultBodyPractice', { correct: result.correct, total: result.total, pct })}
            </p>
          </>
        )}
        {(result.unanswered > 0 || result.timedOut) && (
          <p className="mt-2 text-ink-2">
            {[result.unanswered > 0 ? t('resultUnanswered', { n: result.unanswered }) : '', result.timedOut ? t('resultTimedOut') : '']
              .filter(Boolean)
              .join(' ')}
          </p>
        )}
      </div>
    </section>
  )
}
