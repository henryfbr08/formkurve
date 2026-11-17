import { flushSync } from 'react-dom'

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Führt eine Zustandsänderung mit weicher Überblendung aus (View Transitions API).
 * Ältere Browser oder „Bewegung reduzieren“: sofort ohne Animation.
 */
export function smooth(update: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
  if (!doc.startViewTransition || reduced()) {
    update()
    return
  }
  doc.startViewTransition(() => flushSync(update))
}
