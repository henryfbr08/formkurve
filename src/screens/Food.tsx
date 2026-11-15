import { useState } from 'react'
import { uid, useStore } from '../lib/store'
import { addDays, formatLong, isWeekend, todayKey } from '../lib/dates'
import { FOODS, MEAL_PLAN, TARGETS, WEEKEND_RULES, type Food as FoodItem, type Macros } from '../data/nutrition'
import { EMPTY, round, scale, shortMacros, sumEntries } from '../lib/macros'
import MacroOverview from './MacroOverview'
import Scanner from './Scanner'
import { RECIPES } from '../data/recipes'

export default function Food() {
  const { data, update } = useStore()
  const [date, setDate] = useState(todayKey())
  const [selected, setSelected] = useState<FoodItem | null>(null)
  const [grams, setGrams] = useState('')
  const [custom, setCustom] = useState({ name: '', kcal: '', protein: '', carbs: '', fat: '' })
  const [view, setView] = useState<'log' | 'plan' | 'rezepte'>('log')
  const [scanning, setScanning] = useState(false)
  const [openRecipe, setOpenRecipe] = useState<string | null>(null)
  const myFoods = data.customFoods ?? []

  function onScanned(food: FoodItem) {
    update((d) => {
      d.customFoods = [food, ...(d.customFoods ?? []).filter((f) => f.id !== food.id)].slice(0, 40)
      return d
    })
    setScanning(false)
    setSelected(food)
    setGrams(String(food.portion))
  }

  const entries = data.food[date] ?? []
  const totals = sumEntries(entries)
  const [showAll, setShowAll] = useState(true)

  function add(name: string, m: Macros) {
    update((d) => {
      d.food[date] = [...(d.food[date] ?? []), { id: uid(), name, ...round(m) }]
      return d
    })
  }

  const num = (v: string) => parseFloat(v.replace(',', '.')) || 0
  const selectedGrams = selected ? num(grams) || selected.portion : 0
  const preview = selected ? scale(selected, selectedGrams) : EMPTY

  function addSelected() {
    if (!selected) return
    add(`${selected.name} (${selectedGrams} g)`, preview)
    setSelected(null)
    setGrams('')
  }

  function addCustom() {
    const k = num(custom.kcal)
    if (!custom.name || !k) return
    add(custom.name, { ...EMPTY, kcal: k, protein: num(custom.protein), carbs: num(custom.carbs), fat: num(custom.fat) })
    setCustom({ name: '', kcal: '', protein: '', carbs: '', fat: '' })
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
        <button className={`chip ${view === 'rezepte' ? 'active' : ''}`} onClick={() => setView('rezepte')}>
          Rezepte
        </button>
      </div>
      {scanning && <Scanner onClose={() => setScanning(false)} onFound={onScanned} />}

      {view === 'rezepte' ? (
        <RecipeList open={openRecipe} setOpen={setOpenRecipe} onAdd={(t, m) => { add(t, m); setDate(todayKey()); setView('log') }} />
      ) : view === 'log' ? (
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
            <div className="meal-head">
              <h2>Nährwerte</h2>
              <button className="ghost small" onClick={() => setShowAll(!showAll)}>
                {showAll ? 'Weniger' : 'Alle Werte'}
              </button>
            </div>
            <MacroOverview totals={totals} date={date} compact={!showAll} />
          </section>

          <section className="card">
            <h2>Schnell hinzufügen</h2>
            <button className="primary wide" onClick={() => setScanning(true)}>
              📷 Barcode scannen
            </button>
            {myFoods.length > 0 && <p className="hint">Meine Produkte</p>}
            <div className="food-grid">
              {[...myFoods, ...FOODS].map((f) => (
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
                  + {Math.round(preview.kcal)} kcal
                </button>
              </div>
            )}
            {selected && (
              <p className="hint">
                {Math.round(preview.protein)} g Protein · {Math.round(preview.carbs)} g KH · {Math.round(preview.fat)} g Fett ·{' '}
                {Math.round(preview.fiber)} g Ballaststoffe · {Math.round(preview.sugar)} g Zucker
              </p>
            )}
          </section>

          <section className="card">
            <h2>Eigener Eintrag</h2>
            <div className="row wrap">
              <input placeholder="Name (z. B. Familienessen)" value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} />
              <input inputMode="numeric" placeholder="kcal" value={custom.kcal} onChange={(e) => setCustom({ ...custom, kcal: e.target.value })} />
              <input inputMode="decimal" placeholder="Protein g" value={custom.protein} onChange={(e) => setCustom({ ...custom, protein: e.target.value })} />
              <input inputMode="decimal" placeholder="KH g" value={custom.carbs} onChange={(e) => setCustom({ ...custom, carbs: e.target.value })} />
              <input inputMode="decimal" placeholder="Fett g" value={custom.fat} onChange={(e) => setCustom({ ...custom, fat: e.target.value })} />
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
                    <span>
                      {e.name}
                      <br />
                      <span className="muted small">{shortMacros(e)}</span>
                    </span>
                    <span className="muted">
                      {e.kcal} kcal · {Math.round(e.protein)} g P
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
              <li>Kohlenhydrate: ~{TARGETS.carbsWeekday} g (Wochenende ~{TARGETS.carbsWeekend} g)</li>
              <li>Ballaststoffe: mind. {TARGETS.fiber} g · Zucker: max. ~{TARGETS.sugarMax} g · Salz: max. {TARGETS.saltMax} g</li>
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
                  <p className="muted small">{shortMacros(o)} · {o.sugar} g Zucker</p>
                  <ul className="list small">
                    {o.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                  <button className="ghost small" onClick={() => { add(o.title, o); setView('log'); setDate(todayKey()) }}>
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

function RecipeList({
  open,
  setOpen,
  onAdd,
}: {
  open: string | null
  setOpen: (id: string | null) => void
  onAdd: (title: string, m: Macros) => void
}) {
  const [filter, setFilter] = useState('Alle')
  const tags = ['Alle', 'Meal Prep', 'Frühstück', 'Mittag', 'Abend']
  const list = filter === 'Alle' ? RECIPES : RECIPES.filter((r) => r.tags.includes(filter))
  return (
    <>
      <div className="chips">
        {tags.map((t) => (
          <button key={t} className={`chip ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>
            {t}
          </button>
        ))}
      </div>
      {list.map((r) => {
        const isOpen = open === r.id
        return (
          <section className="card" key={r.id}>
            <button className="week-head" onClick={() => setOpen(isOpen ? null : r.id)}>
              <span style={{ textAlign: 'left' }}>
                <strong>{r.title}</strong>
                <br />
                <span className="muted small">
                  {r.kcal} kcal · {r.protein} g P pro Portion · {r.portions} Portionen · {r.minutes} Min.
                </span>
              </span>
              <span className="muted">{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && (
              <div className="recipe">
                <div className="tags">
                  {r.tags.map((t) => (
                    <span className="badge" key={t}>
                      {t}
                    </span>
                  ))}
                  <span className="badge">🧊 {r.keeps}</span>
                </div>
                <div className="macro-grid">
                  <span><b>{r.kcal}</b> kcal</span>
                  <span><b>{r.protein}</b> g Protein</span>
                  <span><b>{r.carbs}</b> g KH</span>
                  <span><b>{r.fat}</b> g Fett</span>
                  <span><b>{r.fiber}</b> g Ballastst.</span>
                  <span><b>{r.sugar}</b> g Zucker</span>
                </div>
                <h3>Zutaten (für {r.portions} Portionen)</h3>
                <ul className="list small">
                  {r.ingredients.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
                <h3>Zubereitung</h3>
                <ol className="list small">
                  {r.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
                {r.tip && <p className="hint">💡 {r.tip}</p>}
                <button className="primary" onClick={() => onAdd(`${r.title} (1 Portion)`, r)}>
                  + 1 Portion eintragen
                </button>
              </div>
            )}
          </section>
        )
      })}
      <p className="hint">Nährwerte pro Portion, aus Rohgewichten berechnet und gerundet.</p>
    </>
  )
}
