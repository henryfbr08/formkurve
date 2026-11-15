import { addDays, daysBetween, fromKey, isWeekend, mondayOf } from './dates'
import type { AppData, WorkoutLog } from './store'
import { RUN_PLAN, RUN_WEEKDAY, TOTAL_WEEKS, type PlannedRun } from '../data/running'
import { TARGETS } from '../data/nutrition'
import type { Exercise } from '../data/training'

export function kcalTarget(date: string): number {
  return isWeekend(date) ? TARGETS.weekendKcal : TARGETS.weekdayKcal
}

/** Durchschnittsgewicht der Woche (Mo–So), in der `date` liegt */
export function weekAvg(weights: Record<string, number>, date: string): number | null {
  const mon = mondayOf(date)
  const vals: number[] = []
  for (let i = 0; i < 7; i++) {
    const w = weights[addDays(mon, i)]
    if (w) vals.push(w)
  }
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
}

/** Gleitender 7-Tage-Schnitt für jeden Tag mit Messwert */
export function rollingAvg(weights: Record<string, number>) {
  const keys = Object.keys(weights).sort()
  return keys.map((k) => {
    const vals: number[] = []
    for (let i = 0; i < 7; i++) {
      const w = weights[addDays(k, -i)]
      if (w) vals.push(w)
    }
    return { date: k, weight: weights[k], avg: vals.reduce((a, b) => a + b, 0) / vals.length }
  })
}

/** Plan-Woche (1-basiert) für ein Datum, oder null wenn außerhalb */
export function planWeek(start: string, date: string): number | null {
  const d = daysBetween(start, date)
  if (d < 0) return null
  const w = Math.floor(d / 7) + 1
  return w > TOTAL_WEEKS ? null : w
}

export function plannedRunOn(start: string, date: string): PlannedRun | null {
  const week = planWeek(start, date)
  if (!week) return null
  const wd = fromKey(date).getDay()
  return RUN_PLAN.find((r) => r.week === week && RUN_WEEKDAY[r.slot] === wd) ?? null
}

/** Datum eines geplanten Laufs */
export function runDate(start: string, run: PlannedRun): string {
  const offset = { 1: 1, 2: 4, 3: 6 }[run.slot]
  return addDays(start, (run.week - 1) * 7 + offset)
}

/** Letztes gespeichertes Training mit dieser Übung vor `beforeDate` */
export function lastSets(data: AppData, exerciseId: string, beforeDate: string) {
  const logs: WorkoutLog[] = Object.values(data.workouts)
    .filter((l) => l.date < beforeDate && l.sets[exerciseId]?.some((s) => s.kg != null || s.reps != null))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
  return logs[0] ? { date: logs[0].date, sets: logs[0].sets[exerciseId] } : null
}

/** Doppelte Progression: alle Sätze am oberen Ende → Gewicht erhöhen */
export function shouldIncrease(ex: Exercise, sets: { reps: number | null }[] | undefined): boolean {
  if (!sets || sets.length < ex.sets) return false
  return sets.slice(0, ex.sets).every((s) => (s.reps ?? 0) >= ex.repMax)
}
