import { isWeekend } from './dates'
import type { Macros } from '../data/nutrition'

export type Mode = 'cut' | 'maintain' | 'bulk'

export interface Settings {
  mode: Mode
  /** Erhaltungskalorien (Gesamtumsatz) */
  maintenance: number
  /** eigene Werte; leer = Vorgabe des Modus */
  protein?: number
  fat?: number
}

export const DEFAULT_SETTINGS: Settings = { mode: 'cut', maintenance: 3100 }

export const MODES: Record<
  Mode,
  { label: string; desc: string; weekday: number; weekend: number; protein: number; fat: number; sugarMax: number; rate: string; tip: string }
> = {
  cut: {
    label: 'Abnehmen',
    desc: 'Fett verlieren, Muskeln behalten',
    weekday: -600,
    weekend: -250,
    protein: 180,
    fat: 65,
    sugarMax: 60,
    rate: '−0,5 bis −0,8 kg pro Woche',
    tip: 'Protein hoch halten, Krafttraining weitermachen, 8 Stunden schlafen.',
  },
  maintain: {
    label: 'Halten',
    desc: 'Gewicht halten, Leistung steigern',
    weekday: 0,
    weekend: 0,
    protein: 170,
    fat: 80,
    sugarMax: 70,
    rate: 'stabil (±0,2 kg pro Woche)',
    tip: 'Gut als Diätpause (1–2 Wochen) oder nach dem Abnehmen, um das Gewicht zu festigen.',
  },
  bulk: {
    label: 'Aufbauen',
    desc: 'Muskeln aufbauen mit kleinem Überschuss',
    weekday: 250,
    weekend: 250,
    protein: 170,
    fat: 90,
    sugarMax: 80,
    rate: '+0,2 bis +0,4 kg pro Woche',
    tip: 'Nimmst du schneller zu, wird es vor allem Fett. Dann 100–150 kcal weniger essen.',
  },
}

export interface DayTargets {
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugarMax: number
  saltMax: number
}

export function getTargets(settings: Settings | undefined, date: string): DayTargets {
  const s = settings ?? DEFAULT_SETTINGS
  const m = MODES[s.mode]
  const kcal = s.maintenance + (isWeekend(date) ? m.weekend : m.weekday)
  const protein = s.protein ?? m.protein
  const fat = s.fat ?? m.fat
  // Kohlenhydrate = Rest der Kalorien
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4 / 5) * 5)
  return { kcal, protein, carbs, fat, fiber: 30, sugarMax: m.sugarMax, saltMax: 6 }
}

export interface MacroTarget {
  key: keyof Macros
  label: string
  unit: string
  target: number
  /** true = Obergrenze (Zucker, Salz) */
  limit?: boolean
}

export function macroTargets(settings: Settings | undefined, date: string): MacroTarget[] {
  const t = getTargets(settings, date)
  return [
    { key: 'kcal', label: 'Kalorien', unit: 'kcal', target: t.kcal },
    { key: 'protein', label: 'Protein', unit: 'g', target: t.protein },
    { key: 'carbs', label: 'Kohlenhydrate', unit: 'g', target: t.carbs },
    { key: 'fat', label: 'Fett', unit: 'g', target: t.fat },
    { key: 'fiber', label: 'Ballaststoffe', unit: 'g', target: t.fiber },
    { key: 'sugar', label: 'Zucker (max.)', unit: 'g', target: t.sugarMax, limit: true },
    { key: 'salt', label: 'Salz (max.)', unit: 'g', target: t.saltMax, limit: true },
  ]
}
