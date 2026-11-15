import { useState } from 'react'
import { useStore } from '../lib/store'
import { formatShort, mondayOf, pace, todayKey } from '../lib/dates'
import { planWeek, runDate } from '../lib/stats'
import { PACES, RUN_PLAN, SLOT_LABEL, TOTAL_WEEKS, WEEK_NOTES, type PlannedRun } from '../data/running'

export default function Running() {
  const { data, update } = useStore()
  const today = todayKey()
  const current = planWeek(data.runPlanStart, today)
  const [openWeek, setOpenWeek] = useState<number>(current ?? 1)
  const [editing, setEditing] = useState<string | null>(null)

  const doneRuns = Object.keys(data.runs).length
  const totalKm = Object.values(data.runs).reduce((a, r) => a + r.km, 0)

  return (
    <div className="screen">
      <h1>Laufen</h1>
      <p className="muted">
        12-Wochen-Wiedereinstieg · Ziel: 10 km unter 60 Min. ·{' '}
        {current ? `Aktuell Woche ${current}` : today < data.runPlanStart ? `Start am ${formatShort(data.runPlanStart)}` : 'Plan abgeschlossen'}
      </p>

      <section className="card">
        <div className="stats">
          <div className="stat">
            <span className="stat-value">
              {doneRuns}/{RUN_PLAN.length}
            </span>
            <span className="stat-label">Läufe</span>
          </div>
          <div className="stat">
            <span className="stat-value">{totalKm.toFixed(1)} km</span>
            <span className="stat-label">Gesamt</span>
          </div>
        </div>
        <label className="field">
          Plan-Start (Montag von Woche 1)
          <input
            type="date"
            value={data.runPlanStart}
            onChange={(e) =>
              e.target.value &&
              update((d) => {
                d.runPlanStart = mondayOf(e.target.value)
                return d
              })
            }
          />
        </label>
      </section>

      <section className="card">
        <h2>Tempobereiche</h2>
        <ul className="list">
          {PACES.map((p) => (
            <li key={p.name}>
              <strong>{p.name}:</strong> {p.pace} – <span className="muted">{p.info}</span>
            </li>
          ))}
        </ul>
      </section>

      {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((week) => {
        const runs = RUN_PLAN.filter((r) => r.week === week)
        const km = runs.reduce((a, r) => a + r.km, 0)
        const done = runs.filter((r) => data.runs[r.key]).length
        const open = openWeek === week
        return (
          <section className={`card ${week === current ? 'current' : ''}`} key={week}>
            <button className="week-head" onClick={() => setOpenWeek(open ? 0 : week)}>
              <span>
                <strong>Woche {week}</strong> {WEEK_NOTES[week] && <span className="badge">{WEEK_NOTES[week]}</span>}
              </span>
              <span className="muted">
                {done}/3 · ~{km} km {open ? '▲' : '▼'}
              </span>
            </button>
            {open &&
              runs.map((r) => (
                <RunRow key={r.key} run={r} editing={editing === r.key} onEdit={() => setEditing(editing === r.key ? null : r.key)} />
              ))}
          </section>
        )
      })}

      <section className="card">
        <h2>Regeln</h2>
        <ul className="list">
          <li>Feste Tage Di / Fr / So – lieber kurz als gar nicht.</li>
          <li>Lockere Läufe wirklich locker (6:50–7:30 /km).</li>
          <li>Ausgefallenen Lauf nicht an zwei Tagen hintereinander nachholen.</li>
          <li>Schmerz &gt; 3/10 oder am nächsten Tag noch da → 2–3 Tage Pause.</li>
          <li>Kurze, schnelle Schritte – unter dem Körper landen.</li>
        </ul>
      </section>
    </div>
  )
}

function RunRow({ run, editing, onEdit }: { run: PlannedRun; editing: boolean; onEdit: () => void }) {
  const { data, update } = useStore()
  const log = data.runs[run.key]
  const date = runDate(data.runPlanStart, run)
  const [km, setKm] = useState(log?.km.toString() ?? run.km.toString())
  const [min, setMin] = useState(log ? Math.floor(log.minutes).toString() : '')
  const [sec, setSec] = useState(log ? Math.round((log.minutes % 1) * 60).toString() : '')
  const [feeling, setFeeling] = useState(log?.feeling?.toString() ?? '')

  function save() {
    const k = parseFloat(km.replace(',', '.'))
    const m = (parseInt(min) || 0) + (parseInt(sec) || 0) / 60
    if (!k || !m) return
    update((d) => {
      d.runs[run.key] = { date: todayKey(), km: k, minutes: m, feeling: parseInt(feeling) || undefined }
      return d
    })
    onEdit()
  }

  function remove() {
    update((d) => {
      delete d.runs[run.key]
      return d
    })
    onEdit()
  }

  return (
    <div className={`run-row type-${run.type}`}>
      <div className="run-main" onClick={onEdit}>
        <span className="run-day">
          {SLOT_LABEL[run.slot]} {formatShort(date)}
        </span>
        <span className="run-title">{run.title}</span>
        {log ? (
          <span className="badge ok">
            ✓ {log.km} km · {pace(log.minutes, log.km)} /km
          </span>
        ) : (
          <span className="muted small">eintragen</span>
        )}
      </div>
      {editing && (
        <div className="run-form">
          <label>
            km
            <input inputMode="decimal" value={km} onChange={(e) => setKm(e.target.value)} />
          </label>
          <label>
            Min
            <input inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} />
          </label>
          <label>
            Sek
            <input inputMode="numeric" value={sec} onChange={(e) => setSec(e.target.value)} />
          </label>
          <label>
            Gefühl 1–10
            <input inputMode="numeric" value={feeling} onChange={(e) => setFeeling(e.target.value)} />
          </label>
          <button className="primary" onClick={save}>
            Speichern
          </button>
          {log && (
            <button className="ghost" onClick={remove}>
              Löschen
            </button>
          )}
        </div>
      )}
    </div>
  )
}
