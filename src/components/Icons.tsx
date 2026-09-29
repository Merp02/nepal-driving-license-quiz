import { useId } from 'react'
import type { CategoryId } from '../lib/types'

type IconProps = { className?: string }

/** Double pennant, the outline of Nepal's flag. */
export function BrandMark({ className = 'h-8 w-auto' }: IconProps) {
  return (
    <svg viewBox="0 0 22 28" className={className} aria-hidden="true">
      <path
        d="M1.5 1.5 L19.5 13 H8.5 L19.5 26.5 H1.5 Z"
        fill="var(--color-crimson)"
        stroke="var(--color-flagblue)"
        strokeWidth="2"
        strokeLinejoin="miter"
      />
      <circle cx="6" cy="8.6" r="1.7" fill="#fff" />
      <circle cx="6.4" cy="19.6" r="2.4" fill="#fff" />
    </svg>
  )
}

export function FlagNepal({ className = 'h-4 w-auto' }: IconProps) {
  return (
    <svg viewBox="0 0 22 28" className={className} aria-hidden="true">
      <path d="M1.5 1.5 L19.5 13 H8.5 L19.5 26.5 H1.5 Z" fill="#dc143c" stroke="#003893" strokeWidth="2.4" />
      <circle cx="6" cy="8.6" r="1.8" fill="#fff" />
      <circle cx="6.4" cy="19.6" r="2.5" fill="#fff" />
    </svg>
  )
}

export function FlagUK({ className = 'h-4 w-auto' }: IconProps) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 60 30" className={className} aria-hidden="true">
      <clipPath id={`uk-${id}`}>
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath={`url(#uk-${id})`} stroke="#c8102e" strokeWidth="4" />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#c8102e" strokeWidth="6" />
    </svg>
  )
}

export function CheckIcon({ className = 'size-6' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />
    </svg>
  )
}

export function AlertIcon({ className = 'size-6' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <rect x="10.4" y="3" width="3.2" height="12" rx="1.6" />
      <circle cx="12" cy="19.6" r="1.9" />
    </svg>
  )
}

export function ChevronLeft({ className = 'size-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 5 8 12l7 7" />
    </svg>
  )
}

export function ChevronRight({ className = 'size-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 5 7 7-7 7" />
    </svg>
  )
}

export function ClockIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  )
}

/**
 * Each topic is drawn as the road sign family that fits it, echoing the
 * bank's own questions on sign shapes: blue discs are instructions, the red
 * triangle warns, the octagon is the stop sign.
 */
export function CategoryIcon({ id, className = 'size-11' }: IconProps & { id: CategoryId | 'all' | 'mistakes' }) {
  switch (id) {
    case 'vehicle-operation': // blue mandatory disc, "go straight"
      return (
        <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
          <circle cx="20" cy="20" r="18.5" fill="#1557a8" />
          <path d="M20 30V13" stroke="#fff" strokeWidth="4.2" strokeLinecap="round" />
          <path d="M12.8 18.6 20 10.8l7.2 7.8" fill="none" stroke="#fff" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'laws': // blue information panel with the word ऐन (act)
      return (
        <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
          <rect x="2" y="2" width="36" height="36" rx="6" fill="#1557a8" />
          <rect x="6" y="6" width="28" height="28" rx="3" fill="none" stroke="#fff" strokeWidth="1.6" />
          <text x="20" y="26.5" textAnchor="middle" fontFamily="Mukta, sans-serif" fontWeight="800" fontSize="15" fill="#fff">ऐन</text>
        </svg>
      )
    case 'technical': // blue disc with a gear
      return (
        <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
          <circle cx="20" cy="20" r="18.5" fill="#1557a8" />
          <g fill="#fff" transform="translate(20 20)">
            {Array.from({ length: 8 }, (_, i) => (
              <rect key={i} x="-2.3" y="-12" width="4.6" height="6" rx="1" transform={`rotate(${i * 45})`} />
            ))}
            <circle r="7.6" />
          </g>
          <circle cx="20" cy="20" r="3.2" fill="#1557a8" />
        </svg>
      )
    case 'environment': // green disc with a leaf
      return (
        <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
          <circle cx="20" cy="20" r="18.5" fill="#23744a" />
          <path d="M11 28.5c0-10 6.5-16.5 18-17-0.5 11.5-7 18-17 18" fill="#fff" />
          <path d="M11.5 28.8 22 18.5" stroke="#23744a" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'accident-awareness': // red warning triangle
      return (
        <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
          <path d="M20 3.5 37.5 35h-35z" fill="#fff" stroke="#c81e1e" strokeWidth="4" strokeLinejoin="round" />
          <rect x="18.2" y="14" width="3.6" height="11" rx="1.8" fill="#1c2039" />
          <circle cx="20" cy="29.2" r="2.1" fill="#1c2039" />
        </svg>
      )
    case 'traffic-signs': // stop octagon
      return (
        <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
          <path d="M13 2h14l11 11v14L27 38H13L2 27V13z" fill="#c81e1e" />
          <path d="M13.8 4.5h12.4l9.3 9.3v12.4l-9.3 9.3H13.8l-9.3-9.3V13.8z" fill="none" stroke="#fff" strokeWidth="1.6" />
          <rect x="9.5" y="17.5" width="21" height="5" rx="1" fill="#fff" />
        </svg>
      )
    case 'mistakes':
      return (
        <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
          <circle cx="20" cy="20" r="18.5" fill="#fff" stroke="#ab2a20" strokeWidth="3" />
          <path d="M14 20a6 6 0 1 1 1.9 4.4" fill="none" stroke="#ab2a20" strokeWidth="3" strokeLinecap="round" />
          <path d="M11.5 18.6 14 21.8l3-2.6" fill="none" stroke="#ab2a20" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    default: // all questions: stacked cards
      return (
        <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
          <rect x="4" y="9" width="26" height="26" rx="4" fill="#fff" stroke="#1c2039" strokeWidth="2.4" />
          <rect x="10" y="5" width="26" height="26" rx="4" fill="#1c2039" />
          <text x="23" y="23" textAnchor="middle" fontFamily="Mukta, sans-serif" fontWeight="800" fontSize="11" fill="#fff">500</text>
        </svg>
      )
  }
}
