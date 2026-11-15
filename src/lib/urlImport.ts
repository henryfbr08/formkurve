import type { AppData } from './store'
import { todayKey } from './dates'
import { plannedRunOn } from './stats'

/**
 * Übernimmt Werte aus der URL, z. B. von einem iPhone-Kurzbefehl, der Daten
 * aus Apple Health liest (Waage → Renpho → Health, Läufe → Adidas Running → Health).
 *
 *   ?weight=94.2[&date=2026-11-16]
 *   ?run_km=5.21&run_min=33.4[&date=2026-11-17]
 *
 * Dezimal-Kommas werden akzeptiert. Gibt eine Meldung zurück oder null.
 */
export function applyUrlImport(data: AppData, search: string): { data: AppData; message: string } | null {
  const p = new URLSearchParams(search)
  const num = (k: string) => {
    const v = p.get(k)
    if (!v) return null
    const n = parseFloat(v.replace(',', '.'))
    return Number.isFinite(n) ? n : null
  }
  const dateParam = p.get('date')
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayKey()

  const msgs: string[] = []
  const d = structuredClone(data)

  const weight = num('weight')
  if (weight && weight > 30 && weight < 250) {
    d.weights[date] = Math.round(weight * 10) / 10
    msgs.push(`Gewicht ${d.weights[date].toFixed(1).replace('.', ',')} kg übernommen`)
  }

  const km = num('run_km')
  const min = num('run_min')
  if (km && min) {
    const planned = plannedRunOn(d.runPlanStart, date)
    if (planned) {
      d.runs[planned.key] = { date, km: Math.round(km * 100) / 100, minutes: min }
      msgs.push(`Lauf ${km.toFixed(2).replace('.', ',')} km bei Woche ${planned.week} eingetragen`)
    } else {
      msgs.push('Lauf erkannt, aber heute ist kein Lauf im Plan – bitte manuell eintragen')
    }
  }

  return msgs.length ? { data: d, message: msgs.join(' · ') } : null
}
