import { addDays, fromKey, mondayOf } from './dates'
import type { AppData, RunLog, SetEntry } from './store'
import { sumEntries } from './macros'
import { getRunPlan, getSchedule, getWorkouts } from './plan'
import { planWeek, weekAvg } from './stats'
import { EXERCISE_LIBRARY } from '../data/exercises'

/* ---------- Ernährung: Verbrauch schätzen (Idee von MacroFactor) ---------- */

export interface TdeeEstimate {
  ready: boolean
  tdee?: number
  /** kg pro Woche laut Trend */
  trendPerWeek?: number
  avgIntake?: number
  weighIns: number
  intakeDays: number
  needWeighIns: number
  needIntakeDays: number
}

const NEED_WEIGH_INS = 8
const NEED_INTAKE_DAYS = 10
/** Tage mit weniger kcal gelten als unvollständig getrackt */
const MIN_FULL_DAY = 1200

export function estimateTdee(data: AppData, today: string): TdeeEstimate {
  const pts: { x: number; w: number }[] = []
  const intakes: number[] = []
  for (let i = 27; i >= 0; i--) {
    const date = addDays(today, -i)
    const w = data.weights[date]
    if (w) pts.push({ x: -i, w })
    const kcal = sumEntries(data.food[date] ?? []).kcal
    if (kcal >= MIN_FULL_DAY) intakes.push(kcal)
  }
  const base = { weighIns: pts.length, intakeDays: intakes.length, needWeighIns: NEED_WEIGH_INS, needIntakeDays: NEED_INTAKE_DAYS }
  const span = pts.length ? pts[pts.length - 1].x - pts[0].x : 0
  if (pts.length < NEED_WEIGH_INS || span < 13 || intakes.length < NEED_INTAKE_DAYS) return { ready: false, ...base }

  // Gewichtstrend: Ausgleichsgerade durch alle Wiegungen
  const n = pts.length
  const mx = pts.reduce((a, p) => a + p.x, 0) / n
  const mw = pts.reduce((a, p) => a + p.w, 0) / n
  const slope = pts.reduce((a, p) => a + (p.x - mx) * (p.w - mw), 0) / pts.reduce((a, p) => a + (p.x - mx) ** 2, 0)
  const avgIntake = intakes.reduce((a, b) => a + b, 0) / intakes.length
  // 1 kg Körpergewicht ≈ 7.700 kcal
  const tdee = avgIntake - slope * 7700
  return { ready: true, tdee: Math.round(tdee / 10) * 10, trendPerWeek: slope * 7, avgIntake: Math.round(avgIntake), ...base }
}

/** Tage in Folge mit Essens-Einträgen (heute darf noch fehlen) */
export function logStreak(data: AppData, today: string): number {
  const has = (d: string) => (data.food[d] ?? []).length > 0
  let day = has(today) ? today : addDays(today, -1)
  let n = 0
  while (has(day)) {
    n++
    day = addDays(day, -1)
  }
  return n
}

/* ---------- Läufe ---------- */

export function allRuns(data: AppData): RunLog[] {
  return [...Object.values(data.runs), ...(data.freeRuns ?? [])]
}

export function runRecords(data: AppData) {
  const runs = allRuns(data).filter((r) => r.km > 0 && r.minutes > 0)
  if (!runs.length) return null
  const pace = (r: RunLog) => r.minutes / r.km
  const best = (min: number) => runs.filter((r) => r.km >= min).sort((a, b) => pace(a) - pace(b))[0]
  return {
    count: runs.length,
    totalKm: runs.reduce((a, r) => a + r.km, 0),
    longest: [...runs].sort((a, b) => b.km - a.km)[0],
    fastest: best(3),
    best5: best(5),
    best10: best(10),
  }
}

/** Kilometer pro Woche für die letzten `weeks` Wochen (älteste zuerst) */
export function weeklyKm(data: AppData, today: string, weeks = 8) {
  const runs = allRuns(data)
  return Array.from({ length: weeks }, (_, i) => {
    const mon = addDays(mondayOf(today), -7 * (weeks - 1 - i))
    const end = addDays(mon, 6)
    const km = runs.filter((r) => r.date >= mon && r.date <= end).reduce((a, r) => a + r.km, 0)
    const d = fromKey(mon)
    return { label: `${d.getDate()}.${d.getMonth() + 1}.`, km: Math.round(km * 10) / 10 }
  })
}

export function shoeKm(data: AppData, shoeId: string): number {
  const shoe = (data.shoes ?? []).find((s) => s.id === shoeId)
  return (shoe?.startKm ?? 0) + allRuns(data).reduce((a, r) => a + (r.shoeId === shoeId ? r.km : 0), 0)
}

/* ---------- Training ---------- */

/** Geschätzte Maximalkraft für 1 Wiederholung (Epley-Formel) */
export function e1rm(kg: number, reps: number): number {
  return reps <= 1 ? kg : kg * (1 + reps / 30)
}

export function bestSet(data: AppData, exerciseId: string, beforeDate?: string) {
  let best: { kg: number; reps: number; e: number; date: string } | null = null
  for (const log of Object.values(data.workouts)) {
    if (beforeDate && log.date >= beforeDate) continue
    for (const s of log.sets[exerciseId] ?? []) {
      if (!s.kg || !s.reps) continue
      const e = e1rm(s.kg, s.reps)
      if (!best || e > best.e) best = { kg: s.kg, reps: s.reps, e, date: log.date }
    }
  }
  return best
}

export function isRecord(sets: SetEntry[] | undefined, best: { e: number } | null): boolean {
  if (!best || !sets) return false
  return sets.some((s) => s.kg && s.reps && e1rm(s.kg, s.reps) > best.e + 0.01)
}

export const MUSCLES = ['Brust', 'Rücken', 'Schultern', 'Bizeps', 'Trizeps', 'Beine', 'Bauch & Rumpf'] as const

export function muscleOf(name: string): string {
  const hit = EXERCISE_LIBRARY.find((g) => g.names.includes(name))
  if (hit) return hit.group
  const n = name.toLowerCase()
  if (/reverse|face pull|seitheb|schulter/.test(n)) return 'Schultern'
  if (/beinheben|crunch|plank|bauch|twist|ab wheel|sit-?up/.test(n)) return 'Bauch & Rumpf'
  if (/bein|knie|squat|ausfall|hip thrust|waden|addukt|abdukt|hacken/.test(n)) return 'Beine'
  if (/trizeps|french|skull/.test(n)) return 'Trizeps'
  if (/bizeps|curl/.test(n)) return 'Bizeps'
  if (/lat|ruder|klimm|kreuzheb|rückenstr|überz|pull/.test(n)) return 'Rücken'
  if (/bank|brust|butterfly|dips|liegest|fly|press/.test(n)) return 'Brust'
  return 'Sonstiges'
}

/** Direkte Sätze pro Muskelgruppe und Woche laut Plan */
export function plannedSetsPerMuscle(data: AppData): { muscle: string; sets: number }[] {
  const schedule = getSchedule(data)
  const workouts = getWorkouts(data)
  const sums: Record<string, number> = {}
  for (const id of Object.values(schedule)) {
    const w = workouts.find((x) => x.id === id)
    for (const ex of w?.exercises ?? []) {
      const m = muscleOf(ex.name)
      sums[m] = (sums[m] ?? 0) + ex.sets
    }
  }
  const order = [...MUSCLES, 'Sonstiges'] as string[]
  return order.filter((m) => m !== 'Sonstiges' || sums[m]).map((muscle) => ({ muscle, sets: sums[muscle] ?? 0 }))
}

/* ---------- Wochenbericht ---------- */

export function weekReport(data: AppData, anyDay: string) {
  const mon = mondayOf(anyDay)
  const days = Array.from({ length: 7 }, (_, i) => addDays(mon, i))
  const end = days[6]
  const logged = days.map((d) => sumEntries(data.food[d] ?? [])).filter((t) => t.kcal > 0)
  const avg = (f: (t: (typeof logged)[number]) => number) => (logged.length ? Math.round(logged.reduce((a, t) => a + f(t), 0) / logged.length) : null)
  const schedule = getSchedule(data)
  const gymPlanned = days.filter((d) => schedule[fromKey(d).getDay()]).length
  const gymDone = Object.values(data.workouts).filter(
    (l) => l.date >= mon && l.date <= end && Object.values(l.sets).some((arr) => arr.some((s) => s.reps)),
  ).length
  const runs = allRuns(data).filter((r) => r.date >= mon && r.date <= end)
  const pw = planWeek(data, mon)
  const runsPlanned = pw ? getRunPlan(data).filter((r) => r.week === pw).length : 0
  const water = days.map((d) => data.water?.[d] ?? 0).filter((v) => v > 0)
  return {
    mon,
    daysLogged: logged.length,
    avgKcal: avg((t) => t.kcal),
    avgProtein: avg((t) => t.protein),
    gymDone,
    gymPlanned,
    runsDone: runs.length,
    runsPlanned,
    km: Math.round(runs.reduce((a, r) => a + r.km, 0) * 10) / 10,
    avgWater: water.length ? water.reduce((a, b) => a + b, 0) / water.length / 1000 : null,
    weight: weekAvg(data.weights, mon),
  }
}

/* ---------- Gewichts-Vorschlag (Idee von MCI) ---------- */

export function suggestNext(
  ex: { sets: number; repMin: number; repMax: number },
  last: SetEntry[] | undefined,
): { kg: number; text: string; up: boolean } | null {
  const done = (last ?? []).filter((s) => s.kg && s.reps) as { kg: number; reps: number }[]
  if (!done.length) return null
  const top = Math.max(...done.map((s) => s.kg))
  const de = (n: number) => String(n).replace(".", ",")
  const reps = ex.repMin === ex.repMax ? `${ex.repMin}` : `${ex.repMin}–${ex.repMax}`
  const allTop = done.length >= ex.sets && done.slice(0, ex.sets).every((s) => s.reps >= ex.repMax)
  if (allTop) {
    const next = top + (top < 20 ? 1 : 2.5)
    return { kg: next, up: true, text: `${de(next)} kg × ${reps}. Letztes Mal hast du alle Sätze oben geschafft, also steigern.` }
  }
  if (done.some((s) => s.reps < ex.repMin)) {
    return { kg: top, up: false, text: `${de(top)} kg halten und in jedem Satz mindestens ${ex.repMin} Wdh. schaffen.` }
  }
  return { kg: top, up: false, text: `${de(top)} kg, pro Satz eine Wiederholung mehr als letztes Mal (bis ${ex.repMax}).` }
}

/* ---------- Erholung pro Muskelgruppe ---------- */

export function muscleRecovery(data: AppData, today: string) {
  const names = new Map<string, string>()
  getWorkouts(data).forEach((w) => w.exercises.forEach((e) => names.set(e.id, e.name)))
  const last: Record<string, string> = {}
  for (const log of Object.values(data.workouts)) {
    for (const [id, sets] of Object.entries(log.sets)) {
      if (!sets.some((s) => s.reps)) continue
      const m = muscleOf(names.get(id) ?? id)
      if (!last[m] || log.date > last[m]) last[m] = log.date
    }
  }
  return MUSCLES.map((muscle) => {
    const date = last[muscle]
    const days = date ? Math.round((fromKey(today).getTime() - fromKey(date).getTime()) / 86_400_000) : null
    const state = days == null ? 'none' : days <= 1 ? 'tired' : days === 2 ? 'mid' : 'fresh'
    return { muscle, days, state }
  })
}
