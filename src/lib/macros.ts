import type { Macros } from '../data/nutrition'
import type { FoodEntry } from './store'

export const EMPTY: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, salt: 0 }

const KEYS = Object.keys(EMPTY) as (keyof Macros)[]

export function sumEntries(entries: FoodEntry[]): Macros {
  const s = { ...EMPTY }
  for (const e of entries) for (const k of KEYS) s[k] += e[k] ?? 0
  return s
}

/** Nährwerte pro `base` (100 g oder 1 Portion) → auf `amount` umrechnen */
export function scale(per: Partial<Macros>, amount: number, base = 100): Macros {
  const out = { ...EMPTY }
  for (const k of KEYS) out[k] = ((per[k] ?? 0) * amount) / base
  return out
}

/** Rundet für die Speicherung (kcal ganz, Salz 2 Stellen, Rest 1 Stelle) */
export function round(m: Macros): Macros {
  const out = { ...EMPTY }
  for (const k of KEYS) {
    const f = k === 'kcal' ? 1 : k === 'salt' ? 100 : 10
    out[k] = Math.round(m[k] * f) / f
  }
  return out
}

/** Kurzform für Listen: "45 KH · 12 F · 6 Bst" */
export function shortMacros(m: Partial<Macros>): string {
  if (m.carbs == null && m.fat == null) return ''
  return `${Math.round(m.carbs ?? 0)} KH · ${Math.round(m.fat ?? 0)} F · ${Math.round(m.fiber ?? 0)} Bst`
}

/** Zeile für Zwischensummen: "620 kcal · 49 P · 81 KH · 13 F" */
export function lineMacros(m: Partial<Macros>): string {
  return `${Math.round(m.kcal ?? 0)} kcal · ${Math.round(m.protein ?? 0)} P · ${Math.round(m.carbs ?? 0)} KH · ${Math.round(m.fat ?? 0)} F`
}
