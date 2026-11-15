import { useState } from 'react'
import { useStore, type SetEntry } from '../lib/store'
import { formatShort, fromKey, todayKey } from '../lib/dates'
import { lastSets, shouldIncrease } from '../lib/stats'
import { WEEK_SCHEDULE, WORKOUTS, workoutById } from '../data/training'

export default function Training() {
  const { data, update } = useStore()
  const today = todayKey()
  const [workoutId, setWorkoutId] = useState<string>(WEEK_SCHEDULE[fromKey(today).getDay()] ?? 'push')
  const workout = workoutById(workoutId)!
  const logKey = `${today}|${workoutId}`
  const existing = data.workouts[logKey]

  const [sets, setSets] = useState<Record<string, SetEntry[]>>(() => existing?.sets ?? {})
  const [saved, setSaved] = useState(false)

  function changeWorkout(id: string) {
    setWorkoutId(id)
    setSets(data.workouts[`${today}|${id}`]?.sets ?? {})
    setSaved(false)
  }

  function setValue(exId: string, idx: number, field: keyof SetEntry, raw: string) {
    const v = raw === '' ? null : parseFloat(raw.replace(',', '.'))
    setSets((prev) => {
      const arr = [...(prev[exId] ?? [])]
      arr[idx] = { ...(arr[idx] ?? { kg: null, reps: null }), [field]: Number.isNaN(v) ? null : v }
      return { ...prev, [exId]: arr }
    })
    setSaved(false)
  }

  function save() {
    update((d) => {
      d.workouts[logKey] = { date: today, workoutId, sets }
      return d
    })
    setSaved(true)
  }

  const history = Object.values(data.workouts)
    .filter((l) => l.workoutId === workoutId && l.date !== today)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5)

  return (
    <div className="screen">
      <h1>Training</h1>
      <div className="chips">
        {WORKOUTS.map((w) => (
          <button key={w.id} className={`chip ${w.id === workoutId ? 'active' : ''}`} onClick={() => changeWorkout(w.id)}>
            {w.name}
          </button>
        ))}
      </div>

      {workout.exercises.map((ex) => {
        const last = lastSets(data, ex.id, today)
        const increase = shouldIncrease(ex, last?.sets)
        return (
          <section className="card" key={ex.id}>
            <h2>{ex.name}</h2>
            <p className="muted">
              {ex.sets} × {ex.repMin === ex.repMax ? ex.repMin : `${ex.repMin}–${ex.repMax}`} Wdh.
              {last && (
                <>
                  {' · '}Letztes Mal ({formatShort(last.date)}):{' '}
                  {last.sets.map((s) => `${s.kg ?? '–'}×${s.reps ?? '–'}`).join(', ')}
                </>
              )}
            </p>
            {increase && <p className="badge up">⬆ Alle Sätze am oberen Ende – Gewicht erhöhen!</p>}
            {ex.hint && <p className="hint">{ex.hint}</p>}
            <div className="sets">
              {Array.from({ length: ex.sets }).map((_, i) => {
                const s = sets[ex.id]?.[i]
                const prev = last?.sets[i]
                return (
                  <div className="set-row" key={i}>
                    <span className="set-no">{i + 1}</span>
                    <input
                      inputMode="decimal"
                      placeholder={prev?.kg != null ? `${prev.kg}` : 'kg'}
                      value={s?.kg ?? ''}
                      onChange={(e) => setValue(ex.id, i, 'kg', e.target.value)}
                    />
                    <span className="muted">kg</span>
                    <input
                      inputMode="numeric"
                      placeholder={prev?.reps != null ? `${prev.reps}` : 'Wdh.'}
                      value={s?.reps ?? ''}
                      onChange={(e) => setValue(ex.id, i, 'reps', e.target.value)}
                    />
                    <span className="muted">Wdh.</span>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      <button className="primary wide" onClick={save}>
        {saved ? 'Gespeichert ✓' : existing ? 'Änderungen speichern' : 'Training speichern'}
      </button>

      {history.length > 0 && (
        <section className="card">
          <h2>Letzte {workout.name}-Einheiten</h2>
          <ul className="list">
            {history.map((h) => (
              <li key={h.date}>
                {formatShort(h.date)} – {Object.values(h.sets).flat().filter((s) => s.reps).length} Sätze
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
