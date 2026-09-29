interface ProgressBarProps {
  /** Text on the left, e.g. "Question 3 of 25". */
  label: string
  /** Optional text on the right, e.g. the official question number. */
  detail?: string
  value: number
  max: number
  tone?: 'ink' | 'go'
  size?: 'md' | 'sm'
}

export default function ProgressBar({ label, detail, value, max, tone = 'ink', size = 'md' }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  return (
    <div>
      {(label || detail) && (
        <div className="flex items-baseline justify-between gap-4 text-ink-2">
          <span className="font-semibold text-ink">{label}</span>
          {detail && <span className="text-[0.95rem]">{detail}</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className={`overflow-hidden rounded-full bg-track ${size === 'md' ? 'mt-2 h-3' : 'mt-1.5 h-1.5'}`}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 ease-out ${tone === 'go' ? 'bg-go' : 'bg-ink'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
