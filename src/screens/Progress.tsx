import { useRef, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useStore, type AppData } from '../lib/store'
import { addDays, formatShort, mondayOf, todayKey } from '../lib/dates'
import { rollingAvg, weekAvg } from '../lib/stats'
import { getWorkouts } from '../lib/plan'

export default function Progress() {
  const { data, update, replaceAll } = useStore()
  const today = todayKey()
  const [waist, setWaist] = useState('')
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const series = rollingAvg(data.weights).map((p) => ({ ...p, label: formatShort(p.date), avg: Math.round(p.avg * 10) / 10 }))

  const weeks: { mon: string; avg: number }[] = []
  for (let i = 0; i < 8; i++) {
    const mon = addDays(mondayOf(today), -7 * i)
    const avg = weekAvg(data.weights, mon)
    if (avg) weeks.push({ mon, avg })
  }

  const firstWeight = series[0]?.weight
  const start = data.profile.startWeight ?? firstWeight
  const goal = data.profile.goalWeight
  const latest = series.at(-1)?.avg
  const lost = start != null && latest != null ? start - latest : null
  const toGo = goal != null && latest != null ? latest - goal : null

  const [startInput, setStartInput] = useState(data.profile.startWeight?.toString() ?? '')
  const [goalInput, setGoalInput] = useState(data.profile.goalWeight?.toString() ?? '')

  function saveProfile() {
    const s = parseFloat(startInput.replace(',', '.'))
    const g = parseFloat(goalInput.replace(',', '.'))
    update((d) => {
      d.profile.startWeight = s || undefined
      d.profile.goalWeight = g || undefined
      return d
    })
    setMsg('Ziele gespeichert ✓')
  }

  function saveWaist() {
    const v = parseFloat(waist.replace(',', '.'))
    if (!v) return
    update((d) => {
      d.waist[today] = v
      return d
    })
    setWaist('')
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `formkurve-backup-${today}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function importData(file: File) {
    try {
      const parsed = JSON.parse(await file.text()) as AppData
      if (parsed.version !== 1) throw new Error()
      replaceAll(parsed)
      setMsg('Backup geladen ✓')
    } catch {
      setMsg('Datei konnte nicht gelesen werden.')
    }
  }

  // Kraftverlauf: schwerster Satz pro Einheit
  const logs = Object.values(data.workouts).sort((a, b) => (a.date < b.date ? -1 : 1))
  const exNames = new Map<string, string>()
  getWorkouts(data).forEach((w) => w.exercises.forEach((e) => exNames.set(e.id, e.name)))
  const exIds = [...new Set(logs.flatMap((l) => Object.keys(l.sets).filter((id) => l.sets[id].some((x) => x.kg))))]
  const [exSel, setExSel] = useState('')
  const exId = exIds.includes(exSel) ? exSel : exIds[0]
  const strength = exId
    ? logs
        .filter((l) => l.sets[exId])
        .map((l) => {
          const best = l.sets[exId].reduce((a, x) => ((x.kg ?? 0) > (a.kg ?? 0) ? x : a), { kg: 0, reps: 0 } as { kg: number | null; reps: number | null })
          return { label: formatShort(l.date), kg: best.kg ?? 0, reps: best.reps ?? 0 }
        })
        .filter((p) => p.kg > 0)
    : []

  const waistEntries = Object.entries(data.waist).sort(([a], [b]) => (a < b ? 1 : -1))

  return (
    <div className="screen">
      <h1>Fortschritt</h1>

      <section className="card">
        <div className="stats">
          <div className="stat">
            <span className="stat-value">{latest != null ? `${latest.toFixed(1)} kg` : '–'}</span>
            <span className="stat-label">aktuell (Ø 7 Tage)</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              {lost != null ? `${lost >= 0 ? '−' : '+'}${Math.abs(lost).toFixed(1)} kg` : '–'}
            </span>
            <span className="stat-label">seit Start{start != null && ` (${start} kg)`}</span>
          </div>
          <div className="stat">
            <span className="stat-value">{toGo != null ? `${Math.max(0, toGo).toFixed(1)} kg` : '–'}</span>
            <span className="stat-label">bis Ziel{goal != null && ` (${goal} kg)`}</span>
          </div>
        </div>
        <div className="row wrap">
          <input inputMode="decimal" placeholder="Startgewicht kg" value={startInput} onChange={(e) => setStartInput(e.target.value)} />
          <input inputMode="decimal" placeholder="Zielgewicht kg" value={goalInput} onChange={(e) => setGoalInput(e.target.value)} />
          <button className="ghost" onClick={saveProfile}>
            Ziele speichern
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Gewichtsverlauf</h2>
        {series.length < 2 ? (
          <p className="muted">Ab 2 Messungen erscheint hier dein Verlauf.</p>
        ) : (
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={series} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#272b35" vertical={false} />
                <XAxis dataKey="label" stroke="#8d93a1" fontSize={11} />
                <YAxis
                  domain={[(min: number) => Math.floor(min - 0.5), (max: number) => Math.ceil(max + 0.5)]}
                  allowDecimals={false}
                  stroke="#8d93a1"
                  fontSize={11}
                />
                <Tooltip contentStyle={{ background: '#15171d', border: '1px solid #272b35', borderRadius: 10 }} />
                <Line type="monotone" dataKey="weight" name="Gewicht" stroke="#8d93a1" strokeWidth={1} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="avg" name="Ø 7 Tage" stroke="#ff4d4f" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Kraftverlauf</h2>
        {exIds.length === 0 ? (
          <p className="muted">Sobald du Trainings mit Gewichten speicherst, siehst du hier deinen Verlauf pro Übung.</p>
        ) : (
          <>
            <select value={exId} onChange={(e) => setExSel(e.target.value)} style={{ width: '100%' }}>
              {exIds.map((id) => (
                <option key={id} value={id}>
                  {exNames.get(id) ?? id}
                </option>
              ))}
            </select>
            {strength.length < 2 ? (
              <p className="hint">
                Bisher {strength.length === 1 ? `ein Eintrag: ${strength[0].kg} kg × ${strength[0].reps}` : 'kein Eintrag'}. Ab zwei Einheiten erscheint die Kurve.
              </p>
            ) : (
              <div style={{ width: '100%', height: 200, marginTop: 10 }}>
                <ResponsiveContainer>
                  <LineChart data={strength} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="#272b35" vertical={false} />
                    <XAxis dataKey="label" stroke="#8d93a1" fontSize={11} />
                    <YAxis domain={[(min: number) => Math.floor(min - 2.5), (max: number) => Math.ceil(max + 2.5)]} allowDecimals={false} stroke="#8d93a1" fontSize={11} />
                    <Tooltip contentStyle={{ background: '#15171d', border: '1px solid #272b35', borderRadius: 10 }} />
                    <Line type="monotone" dataKey="kg" name="Schwerster Satz (kg)" stroke="#34d399" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </section>

      <section className="card">
        <h2>Wochenschnitte</h2>
        {weeks.length === 0 ? (
          <p className="muted">Noch keine Daten.</p>
        ) : (
          <ul className="list">
            {weeks.map((w, i) => {
              const prev = weeks[i + 1]
              const diff = prev ? w.avg - prev.avg : null
              return (
                <li key={w.mon} className="entry">
                  <span>Woche ab {formatShort(w.mon)}</span>
                  <span>{w.avg.toFixed(1)} kg</span>
                  <span className={diff == null ? 'muted' : diff <= 0 ? 'good' : 'bad'}>
                    {diff == null ? '' : `${diff > 0 ? '+' : ''}${diff.toFixed(1)}`}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Taillenumfang</h2>
        <div className="row">
          <input inputMode="decimal" placeholder="cm (Bauchnabelhöhe)" value={waist} onChange={(e) => setWaist(e.target.value)} />
          <button className="primary" onClick={saveWaist}>
            Speichern
          </button>
        </div>
        {waistEntries.length > 0 && (
          <ul className="list">
            {waistEntries.slice(0, 8).map(([d, v]) => (
              <li key={d} className="entry">
                <span>{formatShort(d)}</span>
                <span>{v} cm</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Daten sichern</h2>
        <p className="hint">Alle Daten liegen nur auf diesem Gerät. Mach ab und zu ein Backup.</p>
        <div className="row wrap">
          <button className="primary" onClick={exportData}>
            Backup exportieren
          </button>
          <button className="ghost" onClick={() => fileRef.current?.click()}>
            Backup laden
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])}
          />
        </div>
        {msg && <p className="hint">{msg}</p>}
      </section>
    </div>
  )
}
