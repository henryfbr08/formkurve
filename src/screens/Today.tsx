import { useEffect, useState } from 'react'
import { useStore } from '../lib/store'
import { addDays, formatLong, fromKey, todayKey } from '../lib/dates'
import { kcalTarget, plannedRunOn, weekAvg } from '../lib/stats'
import { WEEK_SCHEDULE, workoutById } from '../data/training'
import { TARGETS } from '../data/nutrition'
import type { Tab } from '../App'

export default function Today({ go }: { go: (t: Tab) => void }) {
  const { data, update } = useStore()
  const today = todayKey()
  const savedWeight = data.weights[today]
  const [weightInput, setWeightInput] = useState(savedWeight?.toString() ?? '')
  // Eingabefeld nachziehen, wenn das Gewicht von außen kommt (Kurzbefehl-Import)
  useEffect(() => {
    setWeightInput(savedWeight?.toString() ?? '')
  }, [savedWeight])

  const workoutId = WEEK_SCHEDULE[fromKey(today).getDay()]
  const workout = workoutId ? workoutById(workoutId) : null
  const workoutDone = workoutId ? !!data.workouts[`${today}|${workoutId}`] : false
  const run = plannedRunOn(data.runPlanStart, today)
  const runDone = run ? !!data.runs[run.key] : false

  const food = data.food[today] ?? []
  const kcal = food.reduce((a, f) => a + f.kcal, 0)
  const protein = food.reduce((a, f) => a + f.protein, 0)
  const target = kcalTarget(today)

  const thisWeek = weekAvg(data.weights, today)
  const lastWeek = weekAvg(data.weights, addDays(today, -7))

  function saveWeight() {
    const v = parseFloat(weightInput.replace(',', '.'))
    if (!v || v < 30 || v > 250) return
    update((d) => {
      d.weights[today] = v
      return d
    })
  }

  return (
    <div className="screen">
      <h1>Heute</h1>
      <p className="muted">{formatLong(today)}</p>

      <section className="card">
        <h2>Gewicht</h2>
        <div className="row">
          <input
            inputMode="decimal"
            placeholder="kg"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
          />
          <button className="primary" onClick={saveWeight}>
            Speichern
          </button>
        </div>
        <div className="stats">
          <Stat label="Ø diese Woche" value={thisWeek ? `${thisWeek.toFixed(1)} kg` : '–'} />
          <Stat label="Ø letzte Woche" value={lastWeek ? `${lastWeek.toFixed(1)} kg` : '–'} />
          <Stat
            label="Veränderung"
            value={thisWeek && lastWeek ? `${(thisWeek - lastWeek > 0 ? '+' : '')}${(thisWeek - lastWeek).toFixed(1)} kg` : '–'}
          />
        </div>
        <p className="hint">Morgens nach der Toilette wiegen. Ziel: −0,5 bis −0,8 kg pro Woche (Wochenschnitt).</p>
      </section>

      <section className="card clickable" onClick={() => go('training')}>
        <h2>Training</h2>
        {workout ? (
          <p>
            <strong>{workout.name}</strong> · {workout.exercises.length} Übungen{' '}
            {workoutDone && <span className="badge ok">erledigt ✓</span>}
          </p>
        ) : (
          <p className="muted">Kein Gym heute – Ruhetag.</p>
        )}
      </section>

      <section className="card clickable" onClick={() => go('laufen')}>
        <h2>Laufen</h2>
        {run ? (
          <p>
            <strong>Woche {run.week}:</strong> {run.title}{' '}
            {runDone && <span className="badge ok">erledigt ✓</span>}
          </p>
        ) : (
          <p className="muted">Heute kein Lauf geplant.</p>
        )}
      </section>

      <section className="card clickable" onClick={() => go('essen')}>
        <h2>Ernährung</h2>
        <Bar label="Kalorien" value={kcal} max={target} unit="kcal" />
        <Bar label="Protein" value={protein} max={TARGETS.protein} unit="g" />
        <p className="hint">
          Ziel heute: {target} kcal · {TARGETS.protein} g Protein
          {target === TARGETS.weekendKcal && ' (Wochenende mit Familie)'}
        </p>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

export function Bar({ label, value, max, unit }: { label: string; value: number; max: number; unit: string }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="bar">
      <div className="bar-head">
        <span>{label}</span>
        <span>
          {Math.round(value)} / {max} {unit}
        </span>
      </div>
      <div className="bar-track">
        <div className={`bar-fill ${value > max ? 'over' : ''}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
