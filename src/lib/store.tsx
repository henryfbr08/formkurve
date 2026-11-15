import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { nextMonday, todayKey } from './dates'

export interface SetEntry {
  kg: number | null
  reps: number | null
}

export interface WorkoutLog {
  date: string
  workoutId: string
  /** exerciseId → Sätze */
  sets: Record<string, SetEntry[]>
}

export interface RunLog {
  date: string
  km: number
  minutes: number
  feeling?: number
  note?: string
}

export interface FoodEntry {
  id: string
  name: string
  kcal: number
  protein: number
}

export interface AppData {
  version: 1
  /** Start-/Zielgewicht – werden in der App unter „Fortschritt“ eingetragen */
  profile: { startWeight?: number; goalWeight?: number }
  runPlanStart: string
  weights: Record<string, number>
  waist: Record<string, number>
  /** key = `${date}|${workoutId}` */
  workouts: Record<string, WorkoutLog>
  /** key = PlannedRun.key */
  runs: Record<string, RunLog>
  food: Record<string, FoodEntry[]>
}

const STORAGE_KEY = 'formkurve-data-v1'

function initialData(): AppData {
  return {
    version: 1,
    profile: {},
    runPlanStart: nextMonday(todayKey()),
    weights: {},
    waist: {},
    workouts: {},
    runs: {},
    food: {},
  }
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...initialData(), ...JSON.parse(raw) }
  } catch {
    /* kaputte Daten → neu starten */
  }
  return initialData()
}

interface Ctx {
  data: AppData
  update: (fn: (d: AppData) => AppData) => void
  replaceAll: (d: AppData) => void
}

const StoreContext = createContext<Ctx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const value: Ctx = {
    data,
    update: (fn) => setData((d) => fn(structuredClone(d))),
    replaceAll: (d) => setData({ ...initialData(), ...d }),
  }
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Ctx {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore außerhalb des StoreProvider')
  return ctx
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}
