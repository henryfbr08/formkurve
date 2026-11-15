import { useStore } from '../lib/store'
import { addDays, formatShort, todayKey } from '../lib/dates'
import { weekReport } from '../lib/insights'
import { getTargets } from '../lib/targets'

/** Wochenbericht: diese Woche im Vergleich zur Vorwoche */
export default function WeekReport() {
  const { data } = useStore()
  const today = todayKey()
  const now = weekReport(data, today)
  const prev = weekReport(data, addDays(today, -7))
  const target = getTargets(data.settings, now.mon)

  const dash = '–'
  const rows: [string, string, string][] = [
    ['Getrackte Tage', `${now.daysLogged} / 7`, `${prev.daysLogged} / 7`],
    ['Ø Kalorien', now.avgKcal != null ? `${now.avgKcal}` : dash, prev.avgKcal != null ? `${prev.avgKcal}` : dash],
    ['Ø Protein', now.avgProtein != null ? `${now.avgProtein} g` : dash, prev.avgProtein != null ? `${prev.avgProtein} g` : dash],
    ['Gym-Einheiten', `${now.gymDone} / ${now.gymPlanned}`, `${prev.gymDone} / ${prev.gymPlanned}`],
    ['Läufe', `${now.runsDone}${now.runsPlanned ? ` / ${now.runsPlanned}` : ''}`, `${prev.runsDone}${prev.runsPlanned ? ` / ${prev.runsPlanned}` : ''}`],
    ['Lauf-Kilometer', `${String(now.km).replace('.', ',')} km`, `${String(prev.km).replace('.', ',')} km`],
    ['Ø Wasser', now.avgWater != null ? `${now.avgWater.toFixed(1).replace('.', ',')} l` : dash, prev.avgWater != null ? `${prev.avgWater.toFixed(1).replace('.', ',')} l` : dash],
    ['Ø Gewicht', now.weight ? `${now.weight.toFixed(1).replace('.', ',')} kg` : dash, prev.weight ? `${prev.weight.toFixed(1).replace('.', ',')} kg` : dash],
  ]

  return (
    <section className="card">
      <h2>Wochenbericht</h2>
      <table className="report">
        <thead>
          <tr>
            <th />
            <th>Diese Woche</th>
            <th>Letzte ({formatShort(prev.mon)})</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, a, b]) => (
            <tr key={label}>
              <td>{label}</td>
              <td>{a}</td>
              <td className="muted">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hint">
        Ziel unter der Woche: {target.kcal} kcal und {target.protein} g Protein. Der Kalorien-Schnitt zählt nur Tage mit Einträgen.
      </p>
    </section>
  )
}
