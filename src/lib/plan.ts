import { WEEK_SCHEDULE, WORKOUTS, type Workout } from '../data/training'
import type { AppData } from './store'

/** Trainingsplan: eigener (bearbeiteter) Plan oder die Vorgabe */
export function getWorkouts(d: AppData): Workout[] {
  return d.plan ?? WORKOUTS
}

/** Wochentag (0 = So … 6 = Sa) → Workout-ID */
export function getSchedule(d: AppData): Record<number, string | null> {
  return d.schedule ?? WEEK_SCHEDULE
}

export function findWorkout(d: AppData, id: string | null | undefined): Workout | undefined {
  return id ? getWorkouts(d).find((w) => w.id === id) : undefined
}

export function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'uebung'
  )
}

/* ---------- Laufplan ---------- */
import { RUN_PLAN, RUN_WEEKDAY, type PlannedRun } from '../data/running'
import { RECIPES, type Recipe } from '../data/recipes'

export function getRunPlan(d: AppData): PlannedRun[] {
  return d.runPlan ?? RUN_PLAN
}

/** Lauf 1/2/3 → Wochentag (0 = So … 6 = Sa) */
export function getRunDays(d: AppData): Record<1 | 2 | 3, number> {
  return d.runDays ?? RUN_WEEKDAY
}

export function runWeeks(d: AppData): number {
  return getRunPlan(d).reduce((m, r) => Math.max(m, r.week), 0)
}

/* ---------- Rezepte ---------- */
export function getRecipes(d: AppData): Recipe[] {
  return d.recipes ?? RECIPES
}
