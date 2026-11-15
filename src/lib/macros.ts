import { TARGETS, type Food, type Macros } from '../data/nutrition'
import type { FoodEntry } from './store'
import { isWeekend } from './dates'

export const EMPTY: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, salt: 0 }

const KEYS = Object.keys(EMPTY) as (keyof Macros)[]

export function sumEntries(entries: FoodEntry[]): Macros {
  const s = { ...EMPTY }
  for (const e of entries) for (const k of KEYS) s[k] += e[k] ?? 0
  return s
}

/** Nährwerte pro 100 g → Menge in Gramm */
export function scale(food: Partial<Macros>, grams: number): Macros {
  const out = { ...EMPTY }
  for (const k of KEYS) out[k] = ((food[k] ?? 0) * grams) / 100
  return out
}

/** Rundet für die Speicherung (kcal ganz, Salz 2 Stellen, Rest 1 Stelle) */
export function round(m: Macros): Macros {
  const out = { ...m }
  for (const k of KEYS) {
    const f = k === 'kcal' ? 1 : k === 'salt' ? 100 : 10
    out[k] = Math.round(m[k] * f) / f
  }
  return out
}

export interface MacroTarget {
  key: keyof Macros
  label: string
  unit: string
  target: number
  /** true = Obergrenze (Zucker, Salz) */
  limit?: boolean
}

export function targetsFor(date: string): MacroTarget[] {
  const we = isWeekend(date)
  return [
    { key: 'kcal', label: 'Kalorien', unit: 'kcal', target: we ? TARGETS.weekendKcal : TARGETS.weekdayKcal },
    { key: 'protein', label: 'Protein', unit: 'g', target: TARGETS.protein },
    { key: 'carbs', label: 'Kohlenhydrate', unit: 'g', target: we ? TARGETS.carbsWeekend : TARGETS.carbsWeekday },
    { key: 'fat', label: 'Fett', unit: 'g', target: TARGETS.fatMin },
    { key: 'fiber', label: 'Ballaststoffe', unit: 'g', target: TARGETS.fiber },
    { key: 'sugar', label: 'Zucker (max.)', unit: 'g', target: TARGETS.sugarMax, limit: true },
    { key: 'salt', label: 'Salz (max.)', unit: 'g', target: TARGETS.saltMax, limit: true },
  ]
}

/** Kurzform für Listen: "45 KH · 12 F · 6 Bst" */
export function shortMacros(m: Partial<Macros>): string {
  if (m.carbs == null && m.fat == null) return ''
  return `${Math.round(m.carbs ?? 0)} KH · ${Math.round(m.fat ?? 0)} F · ${Math.round(m.fiber ?? 0)} Bst`
}

export type { Food }
