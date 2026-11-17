import { useEffect, useRef, useState, type ReactNode } from 'react'
import { IconChart, IconDumbbell, IconFood, IconHome, IconRun } from './Icons'
import { useStore } from './lib/store'
import { applyUrlImport } from './lib/urlImport'
import Today from './screens/Today'
import Training from './screens/Training'
import Running from './screens/Running'
import Food from './screens/Food'
import Progress from './screens/Progress'

export type Tab = 'heute' | 'training' | 'laufen' | 'essen' | 'fortschritt'

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'heute', label: 'Heute', icon: <IconHome /> },
  { id: 'training', label: 'Training', icon: <IconDumbbell /> },
  { id: 'laufen', label: 'Laufen', icon: <IconRun /> },
  { id: 'essen', label: 'Essen', icon: <IconFood /> },
  { id: 'fortschritt', label: 'Fortschritt', icon: <IconChart /> },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('heute')
  const [dir, setDir] = useState<'left' | 'right' | 'none'>('none')
  const [toast, setToast] = useState('')
  const { update } = useStore()

  // Daten aus Kurzbefehl-Link übernehmen (?weight=…, ?run_km=…&run_min=…)
  useEffect(() => {
    if (!window.location.search) return
    let message = ''
    update((d) => {
      const res = applyUrlImport(d, window.location.search)
      if (!res) return d
      message = res.message
      return res.data
    })
    window.history.replaceState(null, '', window.location.pathname)
    // update läuft synchron im State-Updater; Meldung im nächsten Tick setzen
    setTimeout(() => message && setToast(message), 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 4000)
    return () => clearTimeout(t)
  }, [toast])

  function go(t: Tab) {
    if (t === tab) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const order = TABS.map((x) => x.id)
    setDir(order.indexOf(t) > order.indexOf(tab) ? 'right' : 'left')
    setTab(t)
    window.scrollTo(0, 0)
  }

  /* ----- Wischen zwischen den Seiten ----- */
  const mainRef = useRef<HTMLElement>(null)
  const touch = useRef<{ x: number; y: number; t: number; lock: 'x' | 'y' | null } | null>(null)
  const idx = TABS.findIndex((x) => x.id === tab)

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0]
    const el = e.target as HTMLElement
    // Nicht wischen bei waagerecht scrollbaren Bereichen, Eingaben, Diagrammen und offenen Fenstern
    const blocked = el.closest('.chips, .seg, input, select, textarea, .recharts-wrapper, .overlay, .no-swipe')
    const edge = t.clientX < 22 || t.clientX > window.innerWidth - 22
    touch.current = blocked || edge || e.touches.length > 1 ? null : { x: t.clientX, y: t.clientY, t: Date.now(), lock: null }
  }

  function onTouchMove(e: React.TouchEvent) {
    const s = touch.current
    const main = mainRef.current
    if (!s || !main) return
    const dx = e.touches[0].clientX - s.x
    const dy = e.touches[0].clientY - s.y
    if (!s.lock && Math.hypot(dx, dy) > 10) s.lock = Math.abs(dx) > Math.abs(dy) * 1.3 ? 'x' : 'y'
    if (s.lock !== 'x') return
    // Am ersten/letzten Tab nur leicht nachgeben
    const atEnd = (dx > 0 && idx === 0) || (dx < 0 && idx === TABS.length - 1)
    const shift = atEnd ? dx * 0.15 : dx * 0.45
    main.style.transition = 'none'
    main.style.transform = `translateX(${shift}px)`
    main.style.opacity = String(1 - Math.min(0.35, Math.abs(shift) / 400))
  }

  function onTouchEnd(e: React.TouchEvent) {
    const s = touch.current
    const main = mainRef.current
    touch.current = null
    if (!s || !main || s.lock !== 'x') return
    const dx = e.changedTouches[0].clientX - s.x
    const fast = Math.abs(dx) / Math.max(1, Date.now() - s.t) > 0.5
    const next = dx < 0 ? idx + 1 : idx - 1
    if ((Math.abs(dx) > 80 || (fast && Math.abs(dx) > 35)) && next >= 0 && next < TABS.length) {
      main.style.transform = ''
      main.style.opacity = ''
      main.style.transition = ''
      navigator.vibrate?.(8)
      go(TABS[next].id)
    } else {
      main.style.transition = 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.25s'
      main.style.transform = ''
      main.style.opacity = ''
    }
  }

  return (
    <div className="app" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}>
      {toast && <div className="toast">{toast}</div>}
      <main key={tab} ref={mainRef} className={`page page-${dir}`}>
        {tab === 'heute' && <Today go={go} />}
        {tab === 'training' && <Training />}
        {tab === 'laufen' && <Running />}
        {tab === 'essen' && <Food />}
        {tab === 'fortschritt' && <Progress />}
      </main>
      <nav className="tabbar">
        <span className="tab-indicator" style={{ transform: `translateX(${idx * 100}%)` }} />
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => go(t.id)}>
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
