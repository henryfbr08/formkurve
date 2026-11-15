import { useState } from 'react'
import { useStore } from '../lib/store'
import { formatShort, mondayOf, pace, todayKey, weekdayShort } from '../lib/dates'
import { planWeek, runDate } from '../lib/stats'
import { getRunDays, getRunPlan, runWeeks } from '../lib/plan'
import { PACES, WEEK_NOTES, type PlannedRun, type RunType } from '../data/running'
import RunExtras from './RunExtras'
import { allRuns } from '../lib/insights'

const TYPES: [RunType, string][] = [
  ['locker', 'Locker'],
  ['steigerung', 'Locker + Steigerungen'],
  ['tempo', 'Tempo'],
  ['intervall', 'Intervalle'],
  ['lang', 'Langer Lauf'],
  ['test', 'Test / Wettkampf'],
]

const WEEKDAYS: [number, string][] = [
  [1, 'Montag'],
  [2, 'Dienstag'],
  [3, 'Mittwoch'],
  [4, 'Donnerstag'],
  [5, 'Freitag'],
  [6, 'Samstag'],
  [0, 'Sonntag'],
]

export default function Running() {
  const { data, update } = useStore()
  const today = todayKey()
  const plan = getRunPlan(data)
  const days = getRunDays(data)
  const weeks = runWeeks(data)
  const current = planWeek(data, today)
  const [openWeek, setOpenWeek] = useState<number>(current ?? 1)
  const [logging, setLogging] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  const doneRuns = plan.filter((r) => data.runs[r.key]).length
  const totalKm = allRuns(data).reduce((a, r) => a + r.km, 0)

  /* ----- Plan bearbeiten ----- */
  function editPlan(fn: (p: PlannedRun[]) => PlannedRun[] | void) {
    update((d) => {
      const p: PlannedRun[] = structuredClone(getRunPlan(d))
      d.runPlan = fn(p) ?? p
      return d
    })
  }

  function patchRun(key: string, patch: Partial<PlannedRun>) {
    editPlan((p) => {
      const i = p.findIndex((r) => r.key === key)
      if (i >= 0) p[i] = { ...p[i], ...patch }
    })
  }

  function addWeek() {
    const n = weeks + 1
    editPlan((p) => [
      ...p,
      ...([1, 2, 3] as const).map((slot) => {
        const prev = p.find((r) => r.week === weeks && r.slot === slot)
        return {
          key: `w${n}-r${slot}`,
          week: n,
          slot,
          type: prev?.type ?? ('locker' as RunType),
          title: prev?.title ?? '5 km locker',
          km: prev?.km ?? 5,
        }
      }),
    ])
    setOpenWeek(n)
  }

  function removeLastWeek() {
    if (weeks <= 1) return
    editPlan((p) => p.filter((r) => r.week !== weeks))
  }

  function setRunDay(slot: 1 | 2 | 3, wd: number) {
    update((d) => {
      d.runDays = { ...getRunDays(d), [slot]: wd }
      return d
    })
  }

  function resetPlan() {
    update((d) => {
      delete d.runPlan
      delete d.runDays
      return d
    })
    setEditing(false)
  }

  return (
    <div className="screen">
      <div className="meal-head">
        <h1>Laufen</h1>
        <button className={editing ? 'primary small' : 'ghost small'} onClick={() => setEditing(!editing)}>
          {editing ? 'Fertig' : 'Plan bearbeiten'}
        </button>
      </div>
      <p className="muted">
        {weeks}-Wochen-Plan ·{' '}
        {current ? `aktuell Woche ${current}` : today < data.runPlanStart ? `Start am ${formatShort(data.runPlanStart)}` : 'Plan abgeschlossen'}
      </p>

      <section className="card">
        <div className="stats">
          <div className="stat">
            <span className="stat-value">
              {doneRuns}/{plan.length}
            </span>
            <span className="stat-label">Läufe erledigt</span>
          </div>
          <div className="stat">
            <span className="stat-value">{totalKm.toFixed(1).replace('.', ',')} km</span>
            <span className="stat-label">gelaufen</span>
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

      {editing && (
        <section className="card">
          <h2>Lauftage</h2>
          {([1, 2, 3] as const).map((slot) => (
            <label className="day-select" key={slot}>
              <span>Lauf {slot}</span>
              <select value={days[slot]} onChange={(e) => setRunDay(slot, Number(e.target.value))}>
                {WEEKDAYS.map(([wd, label]) => (
                  <option key={wd} value={wd}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <p className="hint">Am besten kein harter Lauf am Tag nach dem Beintraining und mindestens ein Ruhetag pro Woche.</p>
        </section>
      )}

      {!editing && (
        <section className="card">
          <h2>Tempobereiche</h2>
          <ul className="list">
            {PACES.map((p) => (
              <li key={p.name}>
                <strong>{p.name}:</strong> {p.pace} <span className="muted">· {p.info}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {Array.from({ length: weeks }, (_, i) => i + 1).map((week) => {
        const runs = plan.filter((r) => r.week === week).sort((a, b) => a.slot - b.slot)
        const km = runs.reduce((a, r) => a + r.km, 0)
        const done = runs.filter((r) => data.runs[r.key]).length
        const open = openWeek === week
        const note = !data.runPlan ? WEEK_NOTES[week] : undefined
        return (
          <section className={`card ${week === current ? 'current' : ''}`} key={week}>
            <button className="week-head" onClick={() => setOpenWeek(open ? 0 : week)}>
              <span>
                <strong>Woche {week}</strong> {note && <span className="badge">{note}</span>}
              </span>
              <span className="muted small">
                {done}/{runs.length} · ~{Math.round(km * 10) / 10} km {open ? '▲' : '▼'}
              </span>
            </button>
            {open &&
              runs.map((r) =>
                editing ? (
                  <div className={`run-row type-${r.type}`} key={r.key}>
                    <span className="run-day">
                      {weekdayShort(runDate(data, r))} {formatShort(runDate(data, r))}
                    </span>
                    <input className="ex-name" value={r.title} onChange={(e) => patchRun(r.key, { title: e.target.value })} />
                    <div className="ex-edit">
                      <label>
                        Art
                        <select value={r.type} onChange={(e) => patchRun(r.key, { type: e.target.value as RunType })}>
                          {TYPES.map(([id, label]) => (
                            <option key={id} value={id}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label style={{ flex: '0 0 84px' }}>
                        km
                        <input
                          inputMode="decimal"
                          defaultValue={r.km}
                          onBlur={(e) => patchRun(r.key, { km: parseFloat(e.target.value.replace(',', '.')) || r.km })}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <RunRow key={r.key} run={r} open={logging === r.key} onToggle={() => setLogging(logging === r.key ? null : r.key)} />
                ),
              )}
          </section>
        )
      })}

      {!editing && <RunExtras />}

      {editing ? (
        <>
          <button className="primary wide" onClick={addWeek}>
            + Woche hinzufügen
          </button>
          <div className="row wrap">
            {weeks > 1 && (
              <button className="ghost small" onClick={removeLastWeek}>
                Woche {weeks} entfernen
              </button>
            )}
            {(data.runPlan || data.runDays) && (
              <button className="ghost small" onClick={resetPlan}>
                Auf ursprünglichen Plan zurücksetzen
              </button>
            )}
          </div>
          <p className="hint">Eingetragene Läufe bleiben erhalten. Steigere den längsten Lauf höchstens um 1–2 km pro Woche und plane etwa jede 4. Woche leichter.</p>
        </>
      ) : (
        <section className="card">
          <h2>Regeln</h2>
          <ul className="list">
            <li>Feste Lauftage einhalten. Lieber kurz laufen als gar nicht.</li>
            <li>Lockere Läufe wirklich locker (6:50–7:30 /km).</li>
            <li>Einen ausgefallenen Lauf nicht an zwei Tagen hintereinander nachholen.</li>
            <li>Schmerz über 3/10 oder am nächsten Tag noch da: 2–3 Tage Pause.</li>
            <li>Kurze, schnelle Schritte, unter dem Körper landen.</li>
          </ul>
        </section>
      )}
    </div>
  )
}

function RunRow({ run, open, onToggle }: { run: PlannedRun; open: boolean; onToggle: () => void }) {
  const { data, update } = useStore()
  const log = data.runs[run.key]
  const date = runDate(data, run)
  const [km, setKm] = useState(log?.km.toString() ?? run.km.toString())
  const [min, setMin] = useState(log ? Math.floor(log.minutes).toString() : '')
  const [sec, setSec] = useState(log ? Math.round((log.minutes % 1) * 60).toString() : '')
  const [feeling, setFeeling] = useState(log?.feeling?.toString() ?? '')

  function save() {
    const k = parseFloat(km.replace(',', '.'))
    const m = (parseInt(min) || 0) + (parseInt(sec) || 0) / 60
    if (!k || !m) return
    update((d) => {
      // Datum: geplanter Tag, wenn er schon vorbei ist, sonst heute
      const day = date <= todayKey() ? date : todayKey()
      d.runs[run.key] = { date: d.runs[run.key]?.date ?? day, km: k, minutes: m, feeling: parseInt(feeling) || undefined, shoeId: d.runs[run.key]?.shoeId ?? d.activeShoe }
      return d
    })
    onToggle()
  }

  function remove() {
    update((d) => {
      delete d.runs[run.key]
      return d
    })
    onToggle()
  }

  return (
    <div className={`run-row type-${run.type}`}>
      <div className="run-main" onClick={onToggle}>
        <span className="run-day">
          {weekdayShort(date)} {formatShort(date)}
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
      {open && (
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
