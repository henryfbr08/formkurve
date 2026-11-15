import { useEffect, useState } from 'react'
import { useStore } from './lib/store'
import { applyUrlImport } from './lib/urlImport'
import Today from './screens/Today'
import Training from './screens/Training'
import Running from './screens/Running'
import Food from './screens/Food'
import Progress from './screens/Progress'

export type Tab = 'heute' | 'training' | 'laufen' | 'essen' | 'fortschritt'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'heute', label: 'Heute', icon: '🏠' },
  { id: 'training', label: 'Training', icon: '🏋️' },
  { id: 'laufen', label: 'Laufen', icon: '🏃' },
  { id: 'essen', label: 'Essen', icon: '🍽️' },
  { id: 'fortschritt', label: 'Fortschritt', icon: '📈' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('heute')
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
    setTab(t)
    window.scrollTo(0, 0)
  }

  return (
    <div className="app">
      {toast && <div className="toast">{toast}</div>}
      <main>
        {tab === 'heute' && <Today go={go} />}
        {tab === 'training' && <Training />}
        {tab === 'laufen' && <Running />}
        {tab === 'essen' && <Food />}
        {tab === 'fortschritt' && <Progress />}
      </main>
      <nav className="tabbar">
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
