import { useEffect, useState } from 'react'
import { useStore } from '../lib/store'
import { addDays, formatLong, fromKey, mondayOf, todayKey, weekdayShort } from '../lib/dates'
import { plannedRunOn, weekAvg } from '../lib/stats'
import { sumEntries } from '../lib/macros'
import { getTargets, macroTargets, MODES } from '../lib/targets'
import { findWorkout, getSchedule } from '../lib/plan'
import { logStreak } from '../lib/insights'
import type { Tab } from '../App'
import { applyUrlImport } from '../lib/urlImport'
import { IconCheck, IconDrop, IconDumbbell, IconRun } from '../Icons'

const WATER_GOAL = 3000

function greeting(): string {
  const h = new Date().getHours()
  if (h < 11) return 'Guten Morgen'
  if (h < 18) return 'Guten Tag'
  return 'Guten Abend'
}

export default function Today({ go }: { go: (t: Tab) => void }) {
  const { data, update } = useStore()
  const today = todayKey()
  const savedWeight = data.weights[today]
  const [weightInput, setWeightInput] = useState(savedWeight?.toString() ?? '')
  // Eingabefeld nachziehen, wenn das Gewicht von außen kommt (Kurzbefehl-Import)
  useEffect(() => {
    setWeightInput(savedWeight?.toString() ?? '')
  }, [savedWeight])

  const schedule = getSchedule(data)
  const workoutId = schedule[fromKey(today).getDay()]
  const workout = findWorkout(data, workoutId) ?? null
  const workoutDone = workoutId ? !!data.workouts[`${today}|${workoutId}`] : false
  const run = plannedRunOn(data, today)
  const runDone = run ? !!data.runs[run.key] : false

  const totals = sumEntries(data.food[today] ?? [])
  const target = getTargets(data.settings, today).kcal
  const mode = MODES[data.settings.mode]
  const left = Math.round(target - totals.kcal)
  const macros = macroTargets(data.settings, today).filter((t) => ['protein', 'carbs', 'fat'].includes(t.key))

  const thisWeek = weekAvg(data.weights, today)
  const lastWeek = weekAvg(data.weights, addDays(today, -7))
  const diff = thisWeek && lastWeek ? thisWeek - lastWeek : null

  const water = data.water?.[today] ?? 0
  const streak = logStreak(data, today)

  const [clipMsg, setClipMsg] = useState('')

  /** Kurzbefehl kopiert z. B. "weight=94.2" in die Zwischenablage → hier einfügen */
  async function pasteFromShortcut() {
    try {
      const text = (await navigator.clipboard.readText()).trim()
      const query = text.includes('?') ? text.slice(text.indexOf('?')) : `?${text}`
      let msg = ''
      update((d) => {
        const res = applyUrlImport(d, query)
        if (!res) return d
        msg = res.message
        return res.data
      })
      setTimeout(() => setClipMsg(msg || 'Nichts Passendes in der Zwischenablage gefunden.'), 0)
    } catch {
      setClipMsg('Zwischenablage konnte nicht gelesen werden.')
    }
  }

  function saveWeight() {
    const v = parseFloat(weightInput.replace(',', '.'))
    if (!v || v < 30 || v > 250) return
    update((d) => {
      d.weights[today] = v
      return d
    })
  }

  function addWater(ml: number) {
    update((d) => {
      d.water = d.water ?? {}
      d.water[today] = Math.max(0, (d.water[today] ?? 0) + ml)
      return d
    })
  }

  // Wochenübersicht Mo–So
  const monday = mondayOf(today)
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i)
    const wId = schedule[fromKey(date).getDay()]
    const r = plannedRunOn(data, date)
    return {
      date,
      gym: wId ? (data.workouts[`${date}|${wId}`] ? 'done' : 'planned') : null,
      run: r ? (data.runs[r.key] ? 'done' : 'planned') : null,
    }
  })

  return (
    <div className="screen">
      <header className="hero-head">
        <span className="brand">FORMKURVE</span>
        <h1>{greeting()}</h1>
        <p className="muted">
          {formatLong(today)}
          {streak >= 2 && <span className="badge streak">{streak} Tage in Folge getrackt</span>}
        </p>
      </header>

      <section className="card week-strip">
        {week.map((d) => (
          <div key={d.date} className={`day ${d.date === today ? 'today' : ''} ${d.date < today ? 'past' : ''}`}>
            <span className="day-name">{weekdayShort(d.date)}</span>
            <span className="day-num">{fromKey(d.date).getDate()}</span>
            <span className="day-marks">
              <i className={`mark gym ${d.gym ?? 'none'}`} />
              <i className={`mark run ${d.run ?? 'none'}`} />
            </span>
          </div>
        ))}
        <p className="legend">
          <i className="mark gym done" /> Gym <i className="mark run done" /> Lauf · gefüllt = erledigt
        </p>
      </section>

      <section className="card clickable kcal-card" onClick={() => go('essen')}>
        <Ring value={totals.kcal} max={target}>
          <span className="ring-num">{Math.abs(left)}</span>
          <span className="ring-label">{left >= 0 ? 'kcal übrig' : 'kcal drüber'}</span>
        </Ring>
        <div className="kcal-side">
          {macros.map((t) => (
            <div className="mini" key={t.key}>
              <div className="mini-head">
                <span>{t.label}</span>
                <span>
                  {Math.round(totals[t.key])}/{t.target} g
                </span>
              </div>
              <div className="bar-track">
                <div className={`bar-fill m-${t.key}`} style={{ width: `${Math.min(100, (totals[t.key] / t.target) * 100)}%` }} />
              </div>
            </div>
          ))}
          <p className="hint">
            {mode.label} · Ziel {target} kcal
          </p>
        </div>
      </section>

      <div className="tiles">
        <section className={`card tile clickable ${workoutDone ? 'done' : ''}`} onClick={() => go('training')}>
          <span className="tile-icon gym">
            <IconDumbbell />
          </span>
          <span className="tile-label">Training</span>
          <strong>{workout ? workout.name : 'Ruhetag'}</strong>
          <span className="muted small">
            {workout ? (workoutDone ? 'erledigt' : `${workout.exercises.length} Übungen`) : 'kein Gym heute'}
          </span>
          {workoutDone && (
            <span className="tile-check">
              <IconCheck />
            </span>
          )}
        </section>
        <section className={`card tile clickable ${runDone ? 'done' : ''}`} onClick={() => go('laufen')}>
          <span className="tile-icon run">
            <IconRun />
          </span>
          <span className="tile-label">Laufen</span>
          <strong>{run ? `${run.km} km` : 'Kein Lauf'}</strong>
          <span className="muted small">{run ? (runDone ? 'erledigt' : `Woche ${run.week} · ${run.type}`) : 'heute frei'}</span>
          {runDone && (
            <span className="tile-check">
              <IconCheck />
            </span>
          )}
        </section>
      </div>

      <section className="card">
        <div className="meal-head">
          <h2>
            <span className="h-icon water">
              <IconDrop />
            </span>
            Wasser
          </h2>
          <span className="muted">
            {(water / 1000).toFixed(2).replace('.', ',')} / {WATER_GOAL / 1000} l
          </span>
        </div>
        <div className="bar-track tall">
          <div className="bar-fill m-water" style={{ width: `${Math.min(100, (water / WATER_GOAL) * 100)}%` }} />
        </div>
        <div className="row">
          <button className="soft" onClick={() => addWater(250)}>
            + 250 ml
          </button>
          <button className="soft" onClick={() => addWater(500)}>
            + 500 ml
          </button>
          <button className="ghost" onClick={() => addWater(-250)} aria-label="250 ml abziehen">
            −
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Gewicht</h2>
        <div className="row">
          <input inputMode="decimal" placeholder="kg" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} />
          <button className="primary" onClick={saveWeight}>
            Speichern
          </button>
        </div>
        <div className="stats">
          <Stat label="Ø diese Woche" value={thisWeek ? `${thisWeek.toFixed(1)} kg` : '–'} />
          <Stat label="Ø letzte Woche" value={lastWeek ? `${lastWeek.toFixed(1)} kg` : '–'} />
          <Stat
            label="Veränderung"
            value={diff != null ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg` : '–'}
            tone={diff == null || data.settings.mode !== 'cut' ? undefined : diff <= 0 ? 'good' : 'bad'}
          />
        </div>
        <p className="hint">Morgens nach der Toilette wiegen. Ziel ({mode.label}): {mode.rate}, gemessen am Wochenschnitt.</p>
        <button className="ghost small" onClick={pasteFromShortcut}>
          Aus Health-Kurzbefehl einfügen
        </button>
        {clipMsg && <p className="hint">{clipMsg}</p>}
      </section>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) {
  return (
    <div className="stat">
      <span className={`stat-value ${tone ?? ''}`}>{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

function Ring({ value, max, children }: { value: number; max: number; children: React.ReactNode }) {
  const r = 52
  const c = 2 * Math.PI * r
  const pct = Math.min(1, value / max)
  return (
    <div className="ring">
      <svg viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} className="ring-bg" />
        <circle
          cx="60"
          cy="60"
          r={r}
          className={`ring-fg ${value > max ? 'over' : ''}`}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  )
}
