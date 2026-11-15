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
