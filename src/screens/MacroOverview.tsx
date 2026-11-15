import type { Macros } from '../data/nutrition'
import { useStore } from '../lib/store'
import { macroTargets } from '../lib/targets'

/** Nährwert-Übersicht eines Tages: Balken für alle Werte + Makro-Verteilung */
export default function MacroOverview({ totals, date, compact = false }: { totals: Macros; date: string; compact?: boolean }) {
  const { data } = useStore()
  const targets = macroTargets(data.settings, date)
  const shown = compact ? targets.filter((t) => ['kcal', 'protein', 'carbs', 'fat'].includes(t.key)) : targets

  const kP = totals.protein * 4
  const kC = totals.carbs * 4
  const kF = totals.fat * 9
  const kSum = kP + kC + kF

  return (
    <div>
      {shown.map((t) => {
        const v = totals[t.key]
        const pct = Math.min(100, (v / t.target) * 100)
        const over = v > t.target
        const cls = t.limit ? (over ? 'over' : 'ok') : over && t.key === 'kcal' ? 'over' : ''
        const fmt = (x: number) => (t.key === 'salt' ? x.toFixed(1).replace('.', ',') : Math.round(x))
        return (
          <div className="bar" key={t.key}>
            <div className="bar-head">
              <span>{t.label}</span>
              <span>
                {fmt(v)} / {fmt(t.target)} {t.unit}
              </span>
            </div>
            <div className="bar-track">
              <div className={`bar-fill m-${t.key} ${cls}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
      {!compact && kSum > 0 && (
        <>
          <div className="split">
            <div className="m-protein" style={{ width: `${(kP / kSum) * 100}%` }} />
            <div className="m-carbs" style={{ width: `${(kC / kSum) * 100}%` }} />
            <div className="m-fat" style={{ width: `${(kF / kSum) * 100}%` }} />
          </div>
          <p className="hint">
            Verteilung: <span className="dot m-protein" /> Protein {Math.round((kP / kSum) * 100)} % ·{' '}
            <span className="dot m-carbs" /> KH {Math.round((kC / kSum) * 100)} % · <span className="dot m-fat" /> Fett{' '}
            {Math.round((kF / kSum) * 100)} %
          </p>
        </>
      )}
    </div>
  )
}
