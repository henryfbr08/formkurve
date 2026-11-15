import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { nextMonday, todayKey } from './dates'
import type { Food } from '../data/nutrition'
import type { Workout } from '../data/training'
import type { PlannedRun } from '../data/running'
import type { Recipe } from '../data/recipes'
import { DEFAULT_SETTINGS, type Settings } from './targets'

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
  shoeId?: string
}

export interface FreeRun extends RunLog {
  id: string
}

export interface Shoe {
  id: string
  name: string
  /** Kilometer, die der Schuh vor dem Eintragen schon hatte */
  startKm: number
}

export interface SavedMeal {
  id: string
  name: string
  items: FoodEntry[]
}

export interface FoodEntry {
  id: string
  name: string
  kcal: number
  protein: number
  /** ältere Einträge haben diese Werte evtl. noch nicht */
  carbs?: number
  fat?: number
  fiber?: number
  sugar?: number
  salt?: number
  meal?: MealId
  /** Menge, auf die sich die Nährwerte beziehen (zum späteren Ändern) */
  amount?: number
  unit?: 'g' | 'Portion'
}

export type MealId = 'fruehstueck' | 'mittag' | 'abend' | 'snack'

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
  /** per Barcode gescannte / eigene Produkte */
  customFoods: Food[]
  /** getrunkenes Wasser pro Tag in ml */
  water: Record<string, number>
  /** Ernährungsziel (Abnehmen / Halten / Aufbauen) */
  settings: Settings
  /** eigener Trainingsplan; fehlt = Vorgabe */
  plan?: Workout[]
  /** Wochentag (0 = So) → Workout-ID; fehlt = Vorgabe */
  schedule?: Record<number, string | null>
  /** eigener Laufplan / eigene Lauftage / eigene Rezepte; fehlt = Vorgabe */
  runPlan?: PlannedRun[]
  runDays?: Record<1 | 2 | 3, number>
  recipes?: Recipe[]
  /** Läufe außerhalb des Plans */
  freeRuns: FreeRun[]
  shoes: Shoe[]
  activeShoe?: string
  /** gespeicherte Mahlzeiten-Vorlagen */
  savedMeals: SavedMeal[]
  lastBackup?: string
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
    customFoods: [],
    water: {},
    settings: { ...DEFAULT_SETTINGS },
    freeRuns: [],
    shoes: [],
    savedMeals: [],
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
