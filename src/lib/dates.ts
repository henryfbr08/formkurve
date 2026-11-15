/** Lokales Datum als YYYY-MM-DD */
export function toKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayKey(): string {
  return toKey(new Date())
}

export function addDays(key: string, days: number): string {
  const d = fromKey(key)
  d.setDate(d.getDate() + days)
  return toKey(d)
}

/** Montag der Woche, in der `key` liegt */
export function mondayOf(key: string): string {
  const d = fromKey(key)
  const diff = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - diff)
  return toKey(d)
}

export function nextMonday(key: string): string {
  const mon = mondayOf(key)
  return mon === key ? key : addDays(mon, 7)
}

export function daysBetween(a: string, b: string): number {
  return Math.round((fromKey(b).getTime() - fromKey(a).getTime()) / 86_400_000)
}

const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
const WD_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']

export function weekdayShort(key: string): string {
  return WD[fromKey(key).getDay()]
}

export function formatLong(key: string): string {
  const d = fromKey(key)
  return `${WD_LONG[d.getDay()]}, ${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`
}

export function formatShort(key: string): string {
  const d = fromKey(key)
  return `${d.getDate()}.${d.getMonth() + 1}.`
}

export function isWeekend(key: string): boolean {
  const wd = fromKey(key).getDay()
  return wd === 0 || wd === 6
}

/** Minuten (dezimal) / km → "m:ss" */
export function pace(minutes: number, km: number): string {
  if (!km || !minutes) return '–'
  const p = minutes / km
  const m = Math.floor(p)
  const s = Math.round((p - m) * 60)
  return s === 60 ? `${m + 1}:00` : `${m}:${String(s).padStart(2, '0')}`
}
