import { useEffect, useRef, type ReactNode } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  children?: ReactNode
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Modal confirmation built on the native <dialog> element (focus trap and Esc for free).
 * showModal() focuses the first button, so the safe choice (cancel) is the default.
 */
export default function ConfirmDialog({ open, title, children, confirmLabel, cancelLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onCancel()
      }}
      className="m-auto w-[min(92vw,30rem)] rounded-2xl bg-white p-0 text-ink shadow-[0_20px_60px_rgba(28,32,57,0.35)] backdrop:bg-ink/50"
    >
      <div className="p-6 sm:p-7">
        <h2 id="confirm-title" className="text-xl font-bold tracking-tight sm:text-2xl">
          {title}
        </h2>
        {children && <div className="mt-3 text-lg leading-relaxed text-ink-2">{children}</div>}
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="btn-secondary">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className="btn-primary">
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
