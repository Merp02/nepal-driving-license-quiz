import type { ReactNode } from 'react'

export interface Stat {
  value: ReactNode
  label: string
  tone?: 'go' | 'stop' | 'ink'
}

const TONE = { go: 'text-go', stop: 'text-stop', ink: 'text-ink' }

/** The three-number band at the top of the quiz and results pages. */
export default function StatsBand({ stats }: { stats: Stat[] }) {
  return (
    <dl className="grid rounded-2xl bg-mist" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
      {stats.map((s, i) => (
        <div
          key={i}
          className={`flex flex-col items-center justify-center gap-x-3 px-2 py-4 text-center sm:flex-row sm:py-5 ${
            i > 0 ? 'border-l border-line' : ''
          }`}
        >
          <dt className="order-2 text-[0.95rem] leading-tight text-ink-2 sm:text-lg">{s.label}</dt>
          <dd className={`order-1 text-3xl leading-none font-bold tabular-nums sm:text-[2.6rem] ${TONE[s.tone ?? 'ink']}`}>{s.value}</dd>
        </div>
      ))}
    </dl>
  )
}
