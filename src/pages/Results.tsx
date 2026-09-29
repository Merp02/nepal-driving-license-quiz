import { Link, useNavigate, useParams } from 'react-router'
import ResultCard from '../components/ResultCard'
import ReviewList from '../components/ReviewList'
import { EXAM, getCategory } from '../lib/config'
import { formatDateTime } from '../lib/i18n'
import { useLang } from '../lib/lang'
import { clearExam, findResult } from '../lib/storage'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export default function Results() {
  const { id = '' } = useParams()
  const { t, n, pick, lang } = useLang()
  const navigate = useNavigate()
  const result = findResult(id)
  const isExam = result?.kind === 'exam'
  useDocumentTitle(result ? (isExam ? t('examResultTitle') : t('practiceResultTitle')) : t('notFoundTitle'))

  if (!result) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-12 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight">{t('notFoundTitle')}</h1>
        <p className="mt-3 text-lg text-ink-2">{t('resultNotFound')}</p>
        <Link to="/" className="btn-primary mt-8">
          {t('backHome')}
        </Link>
      </div>
    )
  }

  const when = formatDateTime(result.finishedAt, lang)

  const startNewExam = () => {
    clearExam()
    navigate('/exam')
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6 sm:pt-8">
      <Link to="/" className="link-underline text-ink-2">
        {t('backHome')}
      </Link>
      <h1 className="mt-4 text-[1.9rem] leading-tight font-extrabold tracking-tight sm:text-[2.6rem]">
        {isExam ? t('examResultTitle') : t('practiceResultTitle')}
      </h1>
      <p className="mt-1 text-ink-2">{when}</p>

      <div className="mt-6">
        <ResultCard result={result} />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {isExam ? (
          <button type="button" className="btn-primary" onClick={startNewExam}>
            {t('retakeExam')}
          </button>
        ) : (
          <Link to={result.scope ? `/practice/${result.scope}` : '/practice/all'} className="btn-primary">
            {t('restartSet')}
          </Link>
        )}
        {result.wrong > 0 && (
          <Link to="/practice/mistakes" className="btn-secondary">
            {t('practiseMistakes')}
          </Link>
        )}
      </div>

      {isExam && (
        <section className="mt-12" aria-labelledby="topics-title">
          <h2 id="topics-title" className="text-2xl font-bold tracking-tight">
            {t('byTopicTitle')}
          </h2>
          <table className="mt-4 w-full border-t-2 border-ink text-left">
            <tbody>
              {result.byCategory.map((c) => {
                const cat = getCategory(c.id)
                return (
                  <tr key={c.id} className="border-b border-line">
                    <th scope="row" className="py-3 pr-4 text-lg font-semibold">
                      {pick(cat.nameNepali, cat.nameEnglish)}
                      <span className="block text-[0.95rem] font-normal text-ink-2">{t('byTopicRow', { correct: c.correct, total: c.total })}</span>
                    </th>
                    <td className="py-3 text-right text-xl font-bold whitespace-nowrap tabular-nums">
                      {n(c.marks)}
                      <span className="text-ink-3">/{n(c.maxMarks)}</span>
                    </td>
                  </tr>
                )
              })}
              <tr>
                <th scope="row" className="py-3 pr-4 text-lg font-bold">
                  {t('factTotal')}
                </th>
                <td className="py-3 text-right text-xl font-bold whitespace-nowrap tabular-nums">
                  {n(result.marks)}
                  <span className="text-ink-3">/{n(EXAM.totalMarks)}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      <div className="mt-12">
        <ReviewList questionIds={result.questionIds} answers={result.answers} />
      </div>

      <p className="mt-10">
        <Link to="/" className="link-underline">
          {t('backHome')}
        </Link>
      </p>
    </div>
  )
}
