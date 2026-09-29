import { useEffect } from 'react'

const BASE = 'Nepal Driving License Quiz'

/** Keeps the browser tab title in step with the page. */
export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    document.title = title && title !== BASE ? `${title} | ${BASE}` : `${BASE} – written test practice`
  }, [title])
}
