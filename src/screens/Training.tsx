import { useEffect, useState } from 'react'
import { uid, useStore, type AppData, type SetEntry } from '../lib/store'
import { formatShort, fromKey, todayKey } from '../lib/dates'
import { lastSets, shouldIncrease } from '../lib/stats'
import { findWorkout, getSchedule, getWorkouts, slug } from '../lib/plan'
import type { Exercise, Workout } from '../data/training'
import { EXERCISE_LIBRARY } from '../data/exercises'
import { IconTimer } from '../Icons'
import { bestSet, isRecord, plannedSetsPerMuscle } from '../lib/insights'

const DAYS: [number, string][] = [
  [1, 'Montag'],
  [2, 'Dienstag'],
  [3, 'Mittwoch'],
  [4, 'Donnerstag'],
  [5, 'Freitag'],
  [6, 'Samstag'],
  [0, 'Sonntag'],
]

type Picker = { mode: 'add' } | { mode: 'swap'; index: number } | null

export default function Training() {
  const { data, update } = useStore()
  const today = todayKey()
  const workouts = getWorkouts(data)
  const schedule = getSchedule(data)
  const [workoutId, setWorkoutId] = useState<string>(schedule[fromKey(today).getDay()] ?? workouts[0]?.id ?? '')
  const workout = findWorkout(data, workoutId) ?? workouts[0]
  const logKey = `${today}|${workout?.id}`
  const existing = data.workouts[logKey]

  const [sets, setSets] = useState<Record<string, SetEntry[]>>(() => existing?.sets ?? {})
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState(false)
  const [picker, setPicker] = useState<Picker>(null)

  function changeWorkout(id: string) {
    setWorkoutId(id)
    setSets(data.workouts[`${today}|${id}`]?.sets ?? {})
    setSaved(false)
  }

  function setValue(exId: string, idx: number, field: keyof SetEntry, raw: string) {
    const v = raw === '' ? null : parseFloat(raw.replace(',', '.'))
    setSets((prev) => {
      const arr = [...(prev[exId] ?? [])]
      arr[idx] = { ...(arr[idx] ?? { kg: null, reps: null }), [field]: v == null || Number.isNaN(v) ? null : v }
      return { ...prev, [exId]: arr }
    })
    setSaved(false)
  }

  function save() {
    if (!workout) return
    update((d) => {
      d.workouts[logKey] = { date: today, workoutId: workout.id, sets }
      return d
    })
    setSaved(true)
  }

  /* ----- Plan bearbeiten ----- */
  function editPlan(fn: (w: Workout, plan: Workout[], d: AppData) => void) {
    update((d) => {
      const plan: Workout[] = structuredClone(getWorkouts(d))
      const w = plan.find((x) => x.id === workout?.id)
      if (w) fn(w, plan, d)
      d.plan = plan
      return d
    })
  }

  function patchExercise(index: number, patch: Partial<Exercise>) {
    editPlan((w) => {
      const next = { ...w.exercises[index], ...patch }
      if (next.repMax < next.repMin) next.repMax = next.repMin
      // Hinweise aus der Analyse gelten nach einer Änderung nicht mehr
      if (patch.repMin != null || patch.repMax != null) delete next.hint
      w.exercises[index] = next
    })
  }

  function move(index: number, dir: -1 | 1) {
    editPlan((w) => {
      const j = index + dir
      if (j < 0 || j >= w.exercises.length) return
      ;[w.exercises[index], w.exercises[j]] = [w.exercises[j], w.exercises[index]]
    })
  }

  function pick(name: string) {
    const p = picker
    setPicker(null)
    if (!p) return
    editPlan((w) => {
      let id = slug(name)
      const taken = (x: string) => w.exercises.some((e, i) => e.id === x && !(p.mode === 'swap' && i === p.index))
      while (taken(id)) id += '-2'
      if (p.mode === 'swap') {
        const old = w.exercises[p.index]
        w.exercises[p.index] = { id, name, sets: old.sets, repMin: old.repMin, repMax: old.repMax }
      } else {
        w.exercises.push({ id, name, sets: 3, repMin: 8, repMax: 12 })
      }
    })
  }

  function addWorkout() {
    const id = `w-${uid()}`
    update((d) => {
      d.plan = [...structuredClone(getWorkouts(d)), { id, name: 'Neue Einheit', exercises: [] }]
      return d
    })
    setWorkoutId(id)
    setSets({})
  }

  function deleteWorkout() {
    if (!workout || workouts.length <= 1) return
    const id = workout.id
    update((d) => {
      d.plan = structuredClone(getWorkouts(d)).filter((w) => w.id !== id)
      const s = { ...getSchedule(d) }
      for (const k of Object.keys(s)) if (s[Number(k)] === id) s[Number(k)] = null
      d.schedule = s
      return d
    })
    changeWorkout(workouts.find((w) => w.id !== id)!.id)
  }

  function setDay(day: number, id: string) {
    update((d) => {
      d.schedule = { ...getSchedule(d), [day]: id || null }
      return d
    })
  }

  function resetPlan() {
    update((d) => {
      delete d.plan
      delete d.schedule
      return d
    })
    setEditing(false)
  }

  if (!workout) return null

  const history = Object.values(data.workouts)
    .filter((l) => l.workoutId === workout.id && l.date !== today)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5)

  return (
    <div className="screen">
      <div className="meal-head">
        <h1>Training</h1>
        <button className={editing ? 'primary small' : 'ghost small'} onClick={() => setEditing(!editing)}>
          {editing ? 'Fertig' : 'Plan bearbeiten'}
        </button>
      </div>
      <div className="chips">
        {workouts.map((w) => (
          <button key={w.id} className={`chip ${w.id === workout.id ? 'active' : ''}`} onClick={() => changeWorkout(w.id)}>
            {w.name}
          </button>
        ))}
        {editing && (
          <button className="chip" onClick={addWorkout}>
            + Einheit
          </button>
        )}
      </div>

      {picker && <ExercisePicker onPick={pick} onClose={() => setPicker(null)} />}

      {editing ? (
        <>
          <section className="card">
            <label className="field" style={{ marginTop: 0 }}>
              Name der Einheit
              <input value={workout.name} onChange={(e) => editPlan((w) => void (w.name = e.target.value))} />
            </label>
          </section>

          {workout.exercises.map((ex, i) => (
            <section className="card" key={ex.id}>
              <input className="ex-name" value={ex.name} onChange={(e) => patchExercise(i, { name: e.target.value })} />
              <div className="ex-edit">
                <label>
                  Sätze
                  <div className="stepper">
                    <button onClick={() => patchExercise(i, { sets: Math.max(1, ex.sets - 1) })}>−</button>
                    <span>{ex.sets}</span>
                    <button onClick={() => patchExercise(i, { sets: Math.min(10, ex.sets + 1) })}>+</button>
                  </div>
                </label>
                <label>
                  Wdh. von
                  <input inputMode="numeric" value={ex.repMin} onChange={(e) => patchExercise(i, { repMin: parseInt(e.target.value) || 1 })} />
                </label>
                <label>
                  bis
                  <input inputMode="numeric" value={ex.repMax} onChange={(e) => patchExercise(i, { repMax: parseInt(e.target.value) || ex.repMin })} />
                </label>
              </div>
              <div className="row wrap">
                <button className="soft small" onClick={() => setPicker({ mode: 'swap', index: i })}>
                  Übung tauschen
                </button>
                <button className="ghost small" onClick={() => move(i, -1)} disabled={i === 0} aria-label="nach oben">
                  ↑
                </button>
                <button className="ghost small" onClick={() => move(i, 1)} disabled={i === workout.exercises.length - 1} aria-label="nach unten">
                  ↓
                </button>
                <button className="ghost small" onClick={() => editPlan((w) => void w.exercises.splice(i, 1))}>
                  Entfernen
                </button>
              </div>
            </section>
          ))}

          <button className="primary wide" onClick={() => setPicker({ mode: 'add' })}>
            + Übung hinzufügen
          </button>

          <section className="card">
            <h2>Plan-Check: Sätze pro Woche</h2>
            {plannedSetsPerMuscle(data).map((m) => {
              const min = m.muscle === 'Bauch & Rumpf' ? 6 : 10
              const cls = m.sets >= min && m.sets <= 20 ? 'ok' : m.sets > 20 ? 'over' : 'low'
              return (
                <div className="bar" key={m.muscle}>
                  <div className="bar-head">
                    <span>{m.muscle}</span>
                    <span>
                      {m.sets} {m.sets < min ? '· wenig' : m.sets > 20 ? '· viel' : '· gut'}
                    </span>
                  </div>
                  <div className="bar-track">
                    <div className={`bar-fill ${cls}`} style={{ width: `${Math.min(100, (m.sets / 20) * 100)}%` }} />
                  </div>
                </div>
              )
            })}
            <p className="hint">
              Gezählt werden die direkten Sätze laut Wochenplan. Richtwert für Muskelaufbau: 10–20 pro Muskelgruppe und Woche. Für Bauch und
              Rumpf reichen auch 6–10.
            </p>
          </section>

          <section className="card">
            <h2>Wochenplan</h2>
            {DAYS.map(([day, label]) => (
              <label className="day-select" key={day}>
                <span>{label}</span>
                <select value={schedule[day] ?? ''} onChange={(e) => setDay(day, e.target.value)}>
                  <option value="">Ruhetag</option>
                  {workouts.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </section>

          <div className="row wrap">
            {workouts.length > 1 && (
              <button className="ghost small" onClick={deleteWorkout}>
                Einheit „{workout.name}“ löschen
              </button>
            )}
            {(data.plan || data.schedule) && (
              <button className="ghost small" onClick={resetPlan}>
                Auf ursprünglichen Plan zurücksetzen
              </button>
            )}
          </div>
          <p className="hint">Deine bisherigen Trainingsdaten bleiben erhalten, auch wenn du Übungen tauschst oder umbenennst.</p>
        </>
      ) : (
        <>
          {workout.exercises.length === 0 && <p className="muted">Noch keine Übungen. Tippe oben auf „Plan bearbeiten“.</p>}
          {workout.exercises.map((ex) => {
            const last = lastSets(data, ex.id, today)
            const increase = shouldIncrease(ex, last?.sets)
            const best = bestSet(data, ex.id, today)
            const record = isRecord(sets[ex.id], best)
            return (
              <section className={`card ${record ? 'record' : ''}`} key={ex.id}>
                <h2>{ex.name}</h2>
                {best && (
                  <p className="muted small">
                    Bestleistung: {best.kg} kg × {best.reps} ({formatShort(best.date)}) · geschätzte Maximalkraft {Math.round(best.e)} kg
                  </p>
                )}
                {record && <p className="badge ok block">Neue Bestleistung!</p>}
                <p className="muted small">
                  {ex.sets} × {ex.repMin === ex.repMax ? ex.repMin : `${ex.repMin}–${ex.repMax}`} Wdh.
                  {last && (
                    <>
                      {' · '}Letztes Mal ({formatShort(last.date)}): {last.sets.map((s) => `${s.kg ?? '–'}×${s.reps ?? '–'}`).join(', ')}
                    </>
                  )}
                </p>
                {increase && <p className="badge up">Alle Sätze am oberen Ende geschafft: Gewicht erhöhen!</p>}
                {ex.hint && <p className="hint">{ex.hint}</p>}
                <div className="sets">
                  {Array.from({ length: ex.sets }).map((_, i) => {
                    const s = sets[ex.id]?.[i]
                    const prev = last?.sets[i]
                    return (
                      <div className={`set-row ${s?.kg != null && s?.reps != null ? 'filled' : ''}`} key={i}>
                        <span className="set-no">{i + 1}</span>
                        <input
                          inputMode="decimal"
                          placeholder={prev?.kg != null ? `${prev.kg}` : 'kg'}
                          value={s?.kg ?? ''}
                          onChange={(e) => setValue(ex.id, i, 'kg', e.target.value)}
                        />
                        <span className="muted small">kg</span>
                        <input
                          inputMode="numeric"
                          placeholder={prev?.reps != null ? `${prev.reps}` : 'Wdh.'}
                          value={s?.reps ?? ''}
                          onChange={(e) => setValue(ex.id, i, 'reps', e.target.value)}
                        />
                        <span className="muted small">Wdh.</span>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}

          {workout.exercises.length > 0 && (
            <button className="primary wide" onClick={save}>
              {saved ? 'Gespeichert ✓' : existing ? 'Änderungen speichern' : 'Training speichern'}
            </button>
          )}

          {history.length > 0 && (
            <section className="card">
              <h2>Letzte {workout.name}-Einheiten</h2>
              <ul className="list">
                {history.map((h) => (
                  <li key={h.date}>
                    {formatShort(h.date)}: {Object.values(h.sets).flat().filter((s) => s.reps).length} Sätze
                  </li>
                ))}
              </ul>
            </section>
          )}
          <div style={{ height: 56 }} />
          <RestTimer />
        </>
      )}
    </div>
  )
}

/* ---------- Übung auswählen ---------- */

function ExercisePicker({ onPick, onClose }: { onPick: (name: string) => void; onClose: () => void }) {
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const groups = EXERCISE_LIBRARY.map((g) => ({
    group: g.group,
    names: g.names.filter((n) => !needle || n.toLowerCase().includes(needle) || g.group.toLowerCase().includes(needle)),
  })).filter((g) => g.names.length)

  return (
    <div className="overlay">
      <div className="scanner">
        <div className="scanner-head">
          <h2>Übung auswählen</h2>
          <button className="ghost small" onClick={onClose}>
            Schließen
          </button>
        </div>
        <input className="search" autoFocus placeholder="Suchen, z. B. Brust oder Curls …" value={q} onChange={(e) => setQ(e.target.value)} />
        {needle.length > 1 && (
          <button className="soft wide" onClick={() => onPick(q.trim())}>
            „{q.trim()}“ als eigene Übung verwenden
          </button>
        )}
        <div className="results tall">
          {groups.map((g) => (
            <div key={g.group}>
              <h3>{g.group}</h3>
              {g.names.map((n) => (
                <button key={n} className="result" onClick={() => onPick(n)}>
                  <span>{n}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------- Pausen-Timer ---------- */

const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`

function RestTimer() {
  const [endAt, setEndAt] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (endAt == null) return
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [endAt])

  const left = endAt != null ? Math.max(0, Math.ceil((endAt - now) / 1000)) : 0

  useEffect(() => {
    if (endAt != null && left === 0) {
      setEndAt(null)
      setFinished(true)
      navigator.vibrate?.([200, 100, 200])
      const t = setTimeout(() => setFinished(false), 5000)
      return () => clearTimeout(t)
    }
  }, [endAt, left])

  function start(sec: number) {
    setFinished(false)
    setNow(Date.now())
    setEndAt(Date.now() + sec * 1000)
  }

  return (
    <div className={`timer ${endAt != null ? 'running' : ''} ${finished ? 'finished' : ''}`}>
      <IconTimer />
      {endAt != null ? (
        <>
          <span className="time">{fmt(left)}</span>
          <button onClick={() => setEndAt(endAt + 30_000)}>+30 s</button>
          <button onClick={() => setEndAt(null)}>Stopp</button>
        </>
      ) : finished ? (
        <>
          <span className="time">Los!</span>
          <button onClick={() => setFinished(false)}>OK</button>
        </>
      ) : (
        <>
          <span className="small">Pause</span>
          {[90, 120, 180].map((s) => (
            <button key={s} onClick={() => start(s)}>
              {fmt(s)}
            </button>
          ))}
        </>
      )}
    </div>
  )
}
