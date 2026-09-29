import { useMemo, useState } from 'react'
import { optionLabel } from '../lib/i18n'
import { useLang } from '../lib/lang'
import { getQuestion } from '../lib/questions'
import type { Answers, OptionId, Question } from '../lib/types'
import { AlertIcon, CheckIcon } from './Icons'

type Filter = 'all' | 'wrong' | 'unanswered'

interface ReviewListProps {
  questionIds: number[]
  answers: Answers
}

function status(q: Question, a: OptionId | undefined): 'correct' | 'wrong' | 'unanswered' {
  if (a === undefined) return 'unanswered'
  return a === q.correctAnswer ? 'correct' : 'wrong'
}

export default function ReviewList({ questionIds, answers }: ReviewListProps) {
  const { t, n, lang, pick, showTranslation } = useLang()
  const items = useMemo(
    () =>
      questionIds.map((id, index) => {
        const q = getQuestion(id)
        return { q, index, answer: answers[id], status: status(q, answers[id]) }
      }),
    [questionIds, answers],
  )
  const counts = {
    all: items.length,
    wrong: items.filter((i) => i.status === 'wrong').length,
    unanswered: items.filter((i) => i.status === 'unanswered').length,
  }
  const [filter, setFilter] = useState<Filter>(counts.wrong > 0 ? 'wrong' : 'all')
  const visible = items.filter((i) => filter === 'all' || i.status === filter)

  const optionText = (q: Question, id: OptionId) => {
    const o = q.options.find((x) => x.id === id)!
    return `(${optionLabel(id, lang)}) ${pick(o.textNepali, o.textEnglish)}`
  }

  const tabs: { id: Filter; label: string }[] = [
    { id: 'wrong', label: t('filterWrong') },
    { id: 'unanswered', label: t('filterUnanswered') },
    { id: 'all', label: t('filterAll') },
  ]

  return (
    <section aria-labelledby="review-title">
      <h2 id="review-title" className="text-2xl font-bold tracking-tight">
        {t('reviewTitle')}
      </h2>
      <div role="group" aria-label={t('reviewTitle')} className="mt-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-pressed={filter === tab.id}
            onClick={() => setFilter(tab.id)}
            className={`rounded-full px-4 py-1.5 font-semibold transition-colors ${
              filter === tab.id ? 'bg-ink text-white' : 'bg-mist text-ink-2 hover:bg-line'
            }`}
          >
            {tab.label} <span className="tabular-nums opacity-80">{n(counts[tab.id])}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 text-lg text-ink-2">{t('reviewEmpty')}</p>
      ) : (
        <ol className="mt-6 space-y-4">
          {visible.map(({ q, index, answer, status: st }) => (
            <li key={q.id} className="rounded-2xl border border-line bg-white p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <p className="text-[0.95rem] text-ink-2">
                  <span className="font-semibold text-ink">{t('questionOf', { i: index + 1, n: items.length })}</span>
                  <span className="mx-2 text-line" aria-hidden="true">|</span>
                  <span>{t('officialNo', { id: q.id })}</span>
                </p>
                {st === 'correct' && <CheckIcon className="size-6 shrink-0 text-go" />}
                {st === 'wrong' && <AlertIcon className="size-6 shrink-0 text-stop" />}
              </div>
              <div className="mt-3 flex gap-4">
                {q.image && (
                  <img src={q.image} alt={t('signAlt', { id: q.id })} loading="lazy" decoding="async" width={72} height={72} className="size-18 shrink-0 object-contain" />
                )}
                <div className="min-w-0">
                  <h3 className="text-lg leading-snug font-bold">{pick(q.questionNepali, q.questionEnglish)}</h3>
                  {showTranslation && (
                    <p className="mt-1 leading-snug text-ink-3" lang={lang === 'ne' ? 'en' : 'ne'}>
                      {pick(q.questionEnglish, q.questionNepali)}
                    </p>
                  )}
                </div>
              </div>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className={`rounded-xl px-4 py-3 ${st === 'correct' ? 'bg-go-tint' : st === 'wrong' ? 'bg-stop-tint' : 'bg-mist'}`}>
                  <dt className="text-[0.95rem] text-ink-2">{t('yourAnswer')}</dt>
                  <dd className={`mt-0.5 font-semibold ${st === 'correct' ? 'text-go' : st === 'wrong' ? 'text-stop' : 'text-ink-2'}`}>
                    {answer ? optionText(q, answer) : t('notAnswered')}
                  </dd>
                </div>
                {st !== 'correct' && (
                  <div className="rounded-xl bg-go-tint px-4 py-3">
                    <dt className="text-[0.95rem] text-ink-2">{t('correctAnswer')}</dt>
                    <dd className="mt-0.5 font-semibold text-go">{optionText(q, q.correctAnswer)}</dd>
                  </div>
                )}
              </dl>
              {q.explanation && <p className="mt-3 leading-relaxed text-ink-2">{q.explanation}</p>}
              {q.sourceNote && (
                <p className="mt-3 border-l-4 border-line pl-3 text-[0.95rem] leading-relaxed text-ink-2">
                  <span className="font-semibold text-ink">{t('noteTitle')}: </span>
                  {pick(q.sourceNote.nepali, q.sourceNote.english)}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
