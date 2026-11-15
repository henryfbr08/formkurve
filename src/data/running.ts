export type RunType = 'locker' | 'steigerung' | 'tempo' | 'intervall' | 'lang' | 'test'

export interface PlannedRun {
  /** z. B. "w3-r2" */
  key: string
  week: number
  /** 1 = Di, 2 = Fr, 3 = So */
  slot: 1 | 2 | 3
  type: RunType
  title: string
  km: number
}

export const RUN_WEEKDAY: Record<1 | 2 | 3, number> = { 1: 2, 2: 5, 3: 0 }
export const SLOT_LABEL: Record<1 | 2 | 3, string> = { 1: 'Di', 2: 'Fr', 3: 'So' }

export const PACES = [
  { name: 'Locker', pace: '6:50–7:30 /km', info: 'In ganzen Sätzen reden können' },
  { name: 'Tempo', pace: '5:50–6:05 /km', info: 'Angenehm hart, kurze Sätze' },
  { name: 'Intervall', pace: '5:20–5:35 /km', info: 'Hart, nur einzelne Worte' },
  { name: 'Steigerung', pace: '20 Sek. schnell', info: 'Kein Sprint, danach 1 Min. traben' },
]

type Row = [RunType, string, number]

const WEEKS: { week: number; note?: string; runs: [Row, Row, Row] }[] = [
  { week: 1, runs: [['locker', '4 km locker', 4], ['locker', '4 km locker', 4], ['lang', '5 km locker', 5]] },
  { week: 2, runs: [['locker', '4 km locker', 4], ['steigerung', '4 km locker + 4× Steigerung', 4], ['lang', '6 km locker', 6]] },
  { week: 3, runs: [['locker', '5 km locker', 5], ['steigerung', '5 km locker + 6× Steigerung', 5], ['lang', '7 km locker', 7]] },
  { week: 4, note: 'Leichte Woche', runs: [['locker', '4 km locker', 4], ['steigerung', '4 km locker + 4× Steigerung', 4], ['lang', '6 km locker', 6]] },
  { week: 5, runs: [['locker', '5 km locker', 5], ['intervall', '2 km ein · 3× 1 km Intervall (2 Min. traben) · 1 km aus', 6], ['lang', '8 km locker', 8]] },
  { week: 6, runs: [['locker', '5 km locker', 5], ['tempo', '2 km ein · 2× 2 km Tempo (2 Min. traben) · 1 km aus', 7], ['lang', '8 km locker', 8]] },
  { week: 7, runs: [['steigerung', '5 km locker + 4× Steigerung', 5], ['intervall', '2 km ein · 4× 1 km Intervall · 1 km aus', 7.5], ['lang', '9 km locker', 9]] },
  { week: 8, note: 'Leichte Woche', runs: [['locker', '4 km locker', 4], ['steigerung', '4 km locker + 6× Steigerung', 4], ['lang', '7 km locker', 7]] },
  { week: 9, runs: [['locker', '6 km locker', 6], ['tempo', '2 km ein · 3 km Tempo · 1 km aus', 6], ['lang', '10 km locker', 10]] },
  { week: 10, runs: [['steigerung', '6 km locker + 4× Steigerung', 6], ['intervall', '2 km ein · 5× 1 km Intervall (2 Min. traben) · 1 km aus', 8.5], ['lang', '11 km locker', 11]] },
  { week: 11, runs: [['locker', '6 km locker', 6], ['tempo', '2 km ein · 2× 3 km Tempo (3 Min. traben) · 1 km aus', 9.5], ['lang', '10 km locker', 10]] },
  { week: 12, note: 'Testwoche', runs: [['steigerung', '4 km locker + 4× Steigerung', 4], ['locker', '3 km locker', 3], ['test', '10-km-Test: erste 5 km ~6:05/km, dann steigern', 10]] },
]

export const WEEK_NOTES: Record<number, string | undefined> = Object.fromEntries(
  WEEKS.map((w) => [w.week, w.note]),
)

export const RUN_PLAN: PlannedRun[] = WEEKS.flatMap((w) =>
  w.runs.map(([type, title, km], i) => ({
    key: `w${w.week}-r${i + 1}`,
    week: w.week,
    slot: (i + 1) as 1 | 2 | 3,
    type,
    title,
    km,
  })),
)

export const TOTAL_WEEKS = WEEKS.length
