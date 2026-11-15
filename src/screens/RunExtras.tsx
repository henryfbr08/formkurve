import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { uid, useStore } from '../lib/store'
import { formatShort, pace, todayKey } from '../lib/dates'
import { runRecords, shoeKm, weeklyKm } from '../lib/insights'

const num = (v: string) => parseFloat(v.replace(',', '.')) || 0

function time(minutes: number): string {
  const total = Math.round(minutes * 60)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`
}

/** Bestleistungen, Wochenkilometer, freie Läufe und Schuhe */
export default function RunExtras() {
  const { data, update } = useStore()
  const today = todayKey()
  const rec = runRecords(data)
  const weeks = weeklyKm(data, today)
  const free = [...(data.freeRuns ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1))
  const shoes = data.shoes ?? []

  const [showForm, setShowForm] = useState(false)
  const [date, setDate] = useState(today)
  const [km, setKm] = useState('')
  const [min, setMin] = useState('')
  const [sec, setSec] = useState('')
  const [note, setNote] = useState('')
  const [shoeName, setShoeName] = useState('')
  const [shoeStart, setShoeStart] = useState('')

  function addRun() {
    const k = num(km)
    const m = (parseInt(min) || 0) + (parseInt(sec) || 0) / 60
    if (!k || !m) return
    update((d) => {
      d.freeRuns = [...(d.freeRuns ?? []), { id: uid(), date, km: k, minutes: m, note: note.trim() || undefined, shoeId: d.activeShoe }]
      return d
    })
    setKm('')
    setMin('')
    setSec('')
    setNote('')
    setShowForm(false)
  }

  function addShoe() {
    if (!shoeName.trim()) return
    const id = uid()
    update((d) => {
      d.shoes = [...(d.shoes ?? []), { id, name: shoeName.trim(), startKm: num(shoeStart) }]
      d.activeShoe = id
      return d
    })
    setShoeName('')
    setShoeStart('')
  }

  return (
    <>
      <section className="card">
        <h2>Bestleistungen</h2>
        {!rec ? (
          <p className="muted">Trag deinen ersten Lauf ein, dann erscheinen hier deine Bestwerte.</p>
        ) : (
          <div className="record-grid">
            <div className="stat">
              <span className="stat-value">{rec.longest.km.toString().replace('.', ',')} km</span>
              <span className="stat-label">längster Lauf · {formatShort(rec.longest.date)}</span>
            </div>
            <div className="stat">
              <span className="stat-value">{rec.fastest ? `${pace(rec.fastest.minutes, rec.fastest.km)} /km` : '–'}</span>
              <span className="stat-label">schnellste Pace (ab 3 km)</span>
            </div>
            <div className="stat">
              <span className="stat-value">{rec.best5 ? time((rec.best5.minutes / rec.best5.km) * 5) : '–'}</span>
              <span className="stat-label">bestes 5-km-Tempo</span>
            </div>
            <div className="stat">
              <span className="stat-value">{rec.best10 ? time((rec.best10.minutes / rec.best10.km) * 10) : '–'}</span>
              <span className="stat-label">bestes 10-km-Tempo</span>
            </div>
          </div>
        )}
        {rec && <p className="hint">Die 5- und 10-km-Zeit ist aus der Pace deines schnellsten Laufs über mindestens diese Strecke hochgerechnet.</p>}
      </section>

      <section className="card">
        <h2>Kilometer pro Woche</h2>
        <div style={{ width: '100%', height: 170 }}>
          <ResponsiveContainer>
            <BarChart data={weeks} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid stroke="#272b35" vertical={false} />
              <XAxis dataKey="label" stroke="#8d93a1" fontSize={10} />
              <YAxis stroke="#8d93a1" fontSize={11} allowDecimals={false} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ background: '#15171d', border: '1px solid #272b35', borderRadius: 10 }} />
              <Bar dataKey="km" name="km" fill="#34d399" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card">
        <div className="meal-head">
          <h2>Freie Läufe</h2>
          <button className="ghost small" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Abbrechen' : '+ Lauf eintragen'}
          </button>
        </div>
        {showForm && (
          <div className="run-form">
            <label style={{ flex: '1 1 100%' }}>
              Datum
              <input type="date" value={date} onChange={(e) => setDate(e.target.value || today)} />
            </label>
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
            <label style={{ flex: '1 1 100%' }}>
              Notiz (optional)
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="z. B. Lauf mit Freunden" />
            </label>
            <button className="primary" style={{ flex: '1 1 100%' }} onClick={addRun}>
              Speichern
            </button>
          </div>
        )}
        {free.length === 0 && !showForm && <p className="muted small">Für Läufe, die nicht im Plan stehen. Sie zählen bei Kilometern und Bestleistungen mit.</p>}
        {free.length > 0 && (
          <ul className="list">
            {free.slice(0, 8).map((r) => (
              <li className="entry" key={r.id}>
                <span>
                  {formatShort(r.date)} · {r.km.toString().replace('.', ',')} km
                  {r.note && <span className="muted small"> · {r.note}</span>}
                </span>
                <span className="muted">{pace(r.minutes, r.km)} /km</span>
                <button
                  className="ghost small"
                  aria-label="Lauf löschen"
                  onClick={() =>
                    update((d) => {
                      d.freeRuns = (d.freeRuns ?? []).filter((x) => x.id !== r.id)
                      return d
                    })
                  }
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Laufschuhe</h2>
        {shoes.length === 0 && <p className="muted small">Trag deinen Schuh ein. Neue Läufe werden ihm automatisch zugerechnet. Ab etwa 600–800 km lässt die Dämpfung nach.</p>}
        {shoes.map((sh) => {
          const total = shoeKm(data, sh.id)
          const active = data.activeShoe === sh.id
          return (
            <div className="bar" key={sh.id}>
              <div className="bar-head">
                <span>
                  {sh.name} {active && <span className="badge ok">aktiv</span>}
                </span>
                <span>{Math.round(total)} / 700 km</span>
              </div>
              <div className="bar-track">
                <div className={`bar-fill ${total >= 600 ? 'over' : 'ok'}`} style={{ width: `${Math.min(100, (total / 700) * 100)}%` }} />
              </div>
              {total >= 600 && <p className="hint">Langsam Zeit für ein neues Paar.</p>}
              <div className="row">
                {!active && (
                  <button
                    className="ghost small"
                    onClick={() =>
                      update((d) => {
                        d.activeShoe = sh.id
                        return d
                      })
                    }
                  >
                    Als aktiv wählen
                  </button>
                )}
                <button
                  className="ghost small"
                  onClick={() =>
                    update((d) => {
                      d.shoes = (d.shoes ?? []).filter((x) => x.id !== sh.id)
                      if (d.activeShoe === sh.id) d.activeShoe = d.shoes[0]?.id
                      return d
                    })
                  }
                >
                  Entfernen
                </button>
              </div>
            </div>
          )
        })}
        <div className="row wrap">
          <input placeholder="Schuh (z. B. Adizero)" value={shoeName} onChange={(e) => setShoeName(e.target.value)} />
          <input inputMode="decimal" placeholder="bisherige km" value={shoeStart} onChange={(e) => setShoeStart(e.target.value)} />
          <button className="soft" style={{ flex: 'none' }} onClick={addShoe}>
            Hinzufügen
          </button>
        </div>
      </section>
    </>
  )
}
