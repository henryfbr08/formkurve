import { useState } from 'react'
import { uid, useStore } from '../lib/store'
import { addDays, formatLong, isWeekend, todayKey } from '../lib/dates'
import { kcalTarget } from '../lib/stats'
import { FOODS, MEAL_PLAN, TARGETS, WEEKEND_RULES, type Food as FoodItem } from '../data/nutrition'
import { Bar } from './Today'

export default function Food() {
  const { data, update } = useStore()
  const [date, setDate] = useState(todayKey())
  const [selected, setSelected] = useState<FoodItem | null>(null)
  const [grams, setGrams] = useState('')
  const [custom, setCustom] = useState({ name: '', kcal: '', protein: '' })
  const [view, setView] = useState<'log' | 'plan'>('log')

  const entries = data.food[date] ?? []
  const kcal = entries.reduce((a, f) => a + f.kcal, 0)
  const protein = entries.reduce((a, f) => a + f.protein, 0)
  const target = kcalTarget(date)

  function add(name: string, k: number, p: number) {
    update((d) => {
      d.food[date] = [...(d.food[date] ?? []), { id: uid(), name, kcal: Math.round(k), protein: Math.round(p * 10) / 10 }]
      return d
    })
  }

  function addSelected() {
    if (!selected) return
    const g = parseFloat(grams.replace(',', '.')) || selected.portion
    add(`${selected.name} (${g} g)`, (selected.kcal * g) / 100, (selected.protein * g) / 100)
    setSelected(null)
    setGrams('')
  }

  function addCustom() {
    const k = parseFloat(custom.kcal)
    if (!custom.name || !k) return
    add(custom.name, k, parseFloat(custom.protein) || 0)
    setCustom({ name: '', kcal: '', protein: '' })
  }

  function remove(id: string) {
    update((d) => {
      d.food[date] = (d.food[date] ?? []).filter((f) => f.id !== id)
      return d
    })
  }

  return (
    <div className="screen">
      <h1>Ernährung</h1>
      <div className="chips">
        <button className={`chip ${view === 'log' ? 'active' : ''}`} onClick={() => setView('log')}>
          Tagebuch
        </button>
        <button className={`chip ${view === 'plan' ? 'active' : ''}`} onClick={() => setView('plan')}>
          Mein Plan
        </button>
      </div>

      {view === 'log' ? (
        <>
          <div className="day-nav">
            <button className="ghost" onClick={() => setDate(addDays(date, -1))}>
              ◀
            </button>
            <span>{formatLong(date)}</span>
            <button className="ghost" onClick={() => setDate(addDays(date, 1))}>
              ▶
            </button>
          </div>

          <section className="card">
            <Bar label="Kalorien" value={kcal} max={target} unit="kcal" />
            <Bar label="Protein" value={protein} max={TARGETS.protein} unit="g" />
            <p className="hint">Noch {Math.max(0, target - kcal)} kcal · {Math.max(0, TARGETS.protein - Math.round(protein))} g Protein offen</p>
          </section>

          <section className="card">
            <h2>Schnell hinzufügen</h2>
            <div className="food-grid">
              {FOODS.map((f) => (
                <button
                  key={f.id}
                  className={`chip ${selected?.id === f.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelected(f)
                    setGrams(String(f.portion))
                  }}
                >
                  {f.name}
                </button>
              ))}
            </div>
            {selected && (
              <div className="row">
                <input inputMode="decimal" value={grams} onChange={(e) => setGrams(e.target.value)} />
                <span className="muted">g {selected.portionLabel && `(${selected.portionLabel} = ${selected.portion} g)`}</span>
                <button className="primary" onClick={addSelected}>
                  + {Math.round((selected.kcal * (parseFloat(grams) || 0)) / 100)} kcal
                </button>
              </div>
            )}
          </section>

          <section className="card">
            <h2>Eigener Eintrag</h2>
            <div className="row wrap">
              <input placeholder="Name (z. B. Familienessen)" value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} />
              <input inputMode="numeric" placeholder="kcal" value={custom.kcal} onChange={(e) => setCustom({ ...custom, kcal: e.target.value })} />
              <input inputMode="decimal" placeholder="Protein g" value={custom.protein} onChange={(e) => setCustom({ ...custom, protein: e.target.value })} />
              <button className="primary" onClick={addCustom}>
                Hinzufügen
              </button>
            </div>
          </section>

          {entries.length > 0 && (
            <section className="card">
              <h2>Gegessen</h2>
              <ul className="list">
                {entries.map((e) => (
                  <li key={e.id} className="entry">
                    <span>{e.name}</span>
                    <span className="muted">
                      {e.kcal} kcal · {e.protein} g P
                    </span>
                    <button className="ghost small" onClick={() => remove(e.id)}>
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {isWeekend(date) && <WeekendCard />}
        </>
      ) : (
        <>
          <section className="card">
            <h2>Ziele</h2>
            <ul className="list">
              <li>Mo–Fr: {TARGETS.weekdayKcal} kcal</li>
              <li>Sa/So: ~{TARGETS.weekendKcal} kcal (Familienessen + langer Lauf)</li>
              <li>Protein: {TARGETS.protein} g · Fett: mind. {TARGETS.fatMin} g</li>
              <li>3–4 Portionen Obst · 400 g+ Gemüse/Obst</li>
            </ul>
          </section>
          {MEAL_PLAN.map((slot) => (
            <section className="card" key={slot.name}>
              <h2>{slot.name}</h2>
              {slot.options.map((o, i) => (
                <div className="meal" key={o.title}>
                  <div className="meal-head">
                    <strong>
                      {slot.options.length > 1 && `${String.fromCharCode(65 + i)}: `}
                      {o.title}
                    </strong>
                    <span className="muted">
                      {o.kcal} kcal · {o.protein} g P
                    </span>
                  </div>
                  <ul className="list small">
                    {o.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                  <button className="ghost small" onClick={() => { add(o.title, o.kcal, o.protein); setView('log'); setDate(todayKey()) }}>
                    + Als gegessen eintragen
                  </button>
                </div>
              ))}
            </section>
          ))}
          <WeekendCard />
        </>
      )}
    </div>
  )
}

function WeekendCard() {
  return (
    <section className="card">
      <h2>Wochenende (Familienessen)</h2>
      <ul className="list small">
        {WEEKEND_RULES.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </section>
  )
}
