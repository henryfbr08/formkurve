import { useState } from 'react'
import { uid, useStore, type FoodEntry, type MealId, type SavedMeal } from '../lib/store'
import { addDays, formatLong, isWeekend, todayKey } from '../lib/dates'
import { FOODS, MEAL_PLAN, WEEKEND_RULES, type Food as FoodItem, type Macros } from '../data/nutrition'
import { EMPTY, lineMacros, round, scale, shortMacros, sumEntries } from '../lib/macros'
import { getTargets, MODES } from '../lib/targets'
import { getRecipes } from '../lib/plan'
import { searchProducts } from '../lib/off'
import MacroOverview from './MacroOverview'
import { IconChevron } from '../Icons'
import Scanner from './Scanner'
import { FoodForm, Goals, RecipeList } from './FoodParts'

const MEALS: { id: MealId; label: string }[] = [
  { id: 'fruehstueck', label: 'Frühstück' },
  { id: 'mittag', label: 'Mittagessen' },
  { id: 'abend', label: 'Abendessen' },
  { id: 'snack', label: 'Snacks' },
]

const SLOT_MEAL: Record<string, MealId> = {
  Frühstück: 'fruehstueck',
  Mittagessen: 'mittag',
  Abendessen: 'abend',
}

function defaultMeal(): MealId {
  const h = new Date().getHours()
  if (h < 10) return 'fruehstueck'
  if (h >= 11 && h < 15) return 'mittag'
  if (h >= 17 && h < 21) return 'abend'
  return 'snack'
}

const num = (v: string) => parseFloat(v.replace(',', '.')) || 0

/** Auswahl vor dem Eintragen: Lebensmittel (pro 100 g) oder Gericht (pro Portion) */
interface Selection {
  name: string
  per: Macros
  unit: 'g' | 'Portion'
  food?: FoodItem
}

type View = 'log' | 'plan' | 'rezepte' | 'ziele'

export default function Food() {
  const { data, update } = useStore()
  const [view, setView] = useState<View>('log')
  const [date, setDate] = useState(todayKey())
  const [meal, setMeal] = useState<MealId>(defaultMeal)
  const [query, setQuery] = useState('')
  const [sel, setSel] = useState<Selection | null>(null)
  const [amount, setAmount] = useState('')
  const [scanning, setScanning] = useState(false)
  const [form, setForm] = useState<{ food: FoodItem | null } | null>(null)
  const [online, setOnline] = useState<{ status: 'idle' | 'loading' | 'done' | 'error'; items: FoodItem[] }>({ status: 'idle', items: [] })
  const [editId, setEditId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [quick, setQuick] = useState({ name: '', kcal: '', protein: '', carbs: '', fat: '' })
  const [showQuick, setShowQuick] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const entries = data.food[date] ?? []
  const totals = sumEntries(entries)
  const custom = data.customFoods ?? []
  // eigene/bearbeitete Lebensmittel haben Vorrang vor den Vorgaben
  const allFoods = [...custom, ...FOODS.filter((f) => !custom.some((c) => c.id === f.id))]

  /* ----- Eintragen ----- */
  function add(name: string, m: Macros, to: MealId, amt?: number, unit?: 'g' | 'Portion', day = date) {
    update((d) => {
      d.food[day] = [...(d.food[day] ?? []), { id: uid(), name, ...round(m), meal: to, amount: amt, unit }]
      return d
    })
  }

  function pickFood(f: FoodItem) {
    setSel({ name: f.name, per: f, unit: 'g', food: f })
    setAmount(String(f.portion))
  }

  function pickPortion(name: string, m: Macros) {
    setSel({ name, per: m, unit: 'Portion' })
    setAmount('1')
  }

  const selAmount = sel ? num(amount) : 0
  const preview = sel ? scale(sel.per, selAmount, sel.unit === 'g' ? 100 : 1) : EMPTY

  function addSelected() {
    if (!sel || selAmount <= 0) return
    add(sel.name, preview, meal, selAmount, sel.unit)
    // online gefundene Produkte merken, damit sie beim nächsten Mal sofort da sind
    const f = sel.food
    if (f && f.id.startsWith('ean-') && !custom.some((c) => c.id === f.id)) {
      update((d) => {
        d.customFoods = [f, ...(d.customFoods ?? [])].slice(0, 80)
        return d
      })
    }
    setSel(null)
    setAmount('')
    setQuery('')
    setOnline({ status: 'idle', items: [] })
  }

  function addQuick() {
    const k = num(quick.kcal)
    if (!quick.name || !k) return
    add(quick.name, { ...EMPTY, kcal: k, protein: num(quick.protein), carbs: num(quick.carbs), fat: num(quick.fat) }, meal, 1, 'Portion')
    setQuick({ name: '', kcal: '', protein: '', carbs: '', fat: '' })
    setShowQuick(false)
  }

  /* ----- Einträge bearbeiten ----- */
  function startEdit(e: FoodEntry) {
    setEditId(editId === e.id ? null : e.id)
    setEditAmount(String(e.amount ?? 1))
  }

  function saveEdit(e: FoodEntry, to: MealId) {
    const newAmount = num(editAmount)
    update((d) => {
      d.food[date] = (d.food[date] ?? []).map((x) => {
        if (x.id !== e.id) return x
        const old = x.amount ?? 1
        const factor = newAmount > 0 ? newAmount / old : 1
        return { ...x, ...round(scale(x, factor, 1)), meal: to, amount: newAmount > 0 ? newAmount : old, unit: x.unit ?? 'Portion' }
      })
      return d
    })
    setEditId(null)
  }

  function remove(id: string) {
    update((d) => {
      d.food[date] = (d.food[date] ?? []).filter((f) => f.id !== id)
      return d
    })
    setEditId(null)
  }

  function copyYesterday(to: MealId) {
    const y = (data.food[addDays(date, -1)] ?? []).filter((e) => (e.meal ?? 'snack') === to)
    if (!y.length) return
    update((d) => {
      d.food[date] = [...(d.food[date] ?? []), ...y.map((e) => ({ ...e, id: uid() }))]
      return d
    })
  }

  /* ----- Suche ----- */
  const q = query.trim().toLowerCase()
  const foodHits = q ? allFoods.filter((f) => f.name.toLowerCase().includes(q)) : []
  const dishHits = q
    ? [
        ...getRecipes(data).filter((r) => r.title.toLowerCase().includes(q)).map((r) => ({ title: r.title, m: r as Macros })),
        ...MEAL_PLAN.flatMap((s) => s.options)
          .filter((o) => o.title.toLowerCase().includes(q))
          .map((o) => ({ title: o.title, m: o as Macros })),
      ]
    : []

  async function searchOnline() {
    if (q.length < 2) return
    setOnline({ status: 'loading', items: [] })
    try {
      setOnline({ status: 'done', items: await searchProducts(query.trim()) })
    } catch {
      setOnline({ status: 'error', items: [] })
    }
  }

  function onScanned(food: FoodItem) {
    update((d) => {
      d.customFoods = [food, ...(d.customFoods ?? []).filter((f) => f.id !== food.id)].slice(0, 80)
      return d
    })
    setScanning(false)
    pickFood(food)
  }

  /* ----- Zuletzt gegessen & Mahlzeiten-Vorlagen ----- */
  const recents: FoodEntry[] = []
  for (let i = 0; i < 14 && recents.length < 6; i++) {
    for (const e of [...(data.food[addDays(todayKey(), -i)] ?? [])].reverse()) {
      if (recents.length < 6 && !recents.some((r) => r.name === e.name && r.amount === e.amount)) recents.push(e)
    }
  }
  const savedMeals = data.savedMeals ?? []
  const [saveFor, setSaveFor] = useState<MealId | null>(null)
  const [saveName, setSaveName] = useState('')
  const [manageMeals, setManageMeals] = useState(false)

  function readd(e: FoodEntry) {
    update((d) => {
      d.food[date] = [...(d.food[date] ?? []), { ...e, id: uid(), meal }]
      return d
    })
  }

  function saveMeal(from: MealId) {
    const items = entries.filter((e) => (e.meal ?? 'snack') === from)
    if (!saveName.trim() || !items.length) return
    update((d) => {
      d.savedMeals = [{ id: uid(), name: saveName.trim(), items }, ...(d.savedMeals ?? [])]
      return d
    })
    setSaveFor(null)
    setSaveName('')
  }

  function applySavedMeal(m: SavedMeal) {
    update((d) => {
      if (manageMeals) d.savedMeals = (d.savedMeals ?? []).filter((x) => x.id !== m.id)
      else d.food[date] = [...(d.food[date] ?? []), ...m.items.map((e) => ({ ...e, id: uid(), meal }))]
      return d
    })
  }

  const targets = getTargets(data.settings, date)

  /* ----- Vorschläge passend zu den Rest-Kalorien (Idee von performAll) ----- */
  const remaining = targets.kcal - totals.kcal
  const mainLeft = (['fruehstueck', 'mittag', 'abend'] as MealId[]).filter((id) => !entries.some((e) => e.meal === id)).length
  const budget = meal === 'snack' ? Math.min(remaining, 450) : remaining / Math.max(1, mainLeft)
  const mealTag = { fruehstueck: 'Frühstück', mittag: 'Mittag', abend: 'Abend', snack: 'Snack' }[meal]
  const suggestions =
    remaining < 200
      ? []
      : getRecipes(data)
          .filter((r) => (r.tags.includes(mealTag) || (meal === 'snack' && r.kcal <= 450)) && r.kcal <= budget * 1.15)
          .sort((a, b) => Math.abs(a.kcal - budget) - Math.abs(b.kcal - budget) || b.protein - a.protein)
          .slice(0, 3)
  const mode = MODES[data.settings.mode]
  const planKcal = MEAL_PLAN.reduce((a, s) => a + s.options[0].kcal, 0)
  const planDiff = getTargets(data.settings, todayKey()).kcal - planKcal

  return (
    <div className="screen">
      <h1>Ernährung</h1>
      <div className="chips">
        {(
          [
            ['log', 'Tagebuch'],
            ['plan', 'Mein Plan'],
            ['rezepte', 'Rezepte'],
            ['ziele', `Ziel: ${mode.label}`],
          ] as [View, string][]
        ).map(([id, label]) => (
          <button key={id} className={`chip ${view === id ? 'active' : ''}`} onClick={() => setView(id)}>
            {label}
          </button>
        ))}
      </div>

      {scanning && <Scanner onClose={() => setScanning(false)} onFound={onScanned} />}
      {form && (
        <FoodForm
          food={form.food}
          onClose={() => setForm(null)}
          onSaved={(f) => {
            setForm(null)
            pickFood(f)
          }}
        />
      )}

      {view === 'ziele' && <Goals />}

      {view === 'rezepte' && (
        <RecipeList
          onAdd={(title, m) => {
            add(title, m, meal, 1, 'Portion', todayKey())
            setDate(todayKey())
            setView('log')
          }}
        />
      )}

      {view === 'log' && (
        <>
          <div className="day-nav">
            <button className="ghost" onClick={() => setDate(addDays(date, -1))} aria-label="Tag zurück">
              ◀
            </button>
            <span>{date === todayKey() ? 'Heute' : formatLong(date)}</span>
            <button className="ghost" onClick={() => setDate(addDays(date, 1))} aria-label="Tag vor">
              ▶
            </button>
          </div>

          <section className="card">
            <div className="meal-head">
              <h2>Nährwerte</h2>
              <span className="muted small">
                {mode.label} · {targets.kcal} kcal
              </span>
            </div>
            <MacroOverview totals={totals} date={date} />
          </section>

          <section className="card">
            <h2>Hinzufügen zu</h2>
            <div className="seg">
              {MEALS.map((m) => (
                <button key={m.id} className={meal === m.id ? 'active' : ''} onClick={() => setMeal(m.id)}>
                  {m.label}
                </button>
              ))}
            </div>

            <div className="row">
              <input
                className="search"
                placeholder="Lebensmittel oder Gericht suchen …"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setOnline({ status: 'idle', items: [] })
                }}
                onKeyDown={(e) => e.key === 'Enter' && searchOnline()}
              />
              <button className="soft scan-btn" onClick={() => setScanning(true)} aria-label="Barcode scannen">
                Scan
              </button>
            </div>

            {!q && !sel && savedMeals.length > 0 && (
              <>
                <div className="meal-head">
                  <p className="hint">Meine Mahlzeiten{manageMeals && ' (antippen zum Löschen)'}</p>
                  <button className="ghost small" onClick={() => setManageMeals(!manageMeals)}>
                    {manageMeals ? 'Fertig' : 'Verwalten'}
                  </button>
                </div>
                <div className="food-grid">
                  {savedMeals.map((m) => (
                    <button key={m.id} className={`chip saved ${manageMeals ? 'danger' : ''}`} onClick={() => applySavedMeal(m)}>
                      {manageMeals && '✕ '}
                      {m.name} · {Math.round(sumEntries(m.items).kcal)} kcal
                    </button>
                  ))}
                </div>
              </>
            )}

            {!q && !sel && recents.length > 0 && (
              <>
                <p className="hint">Zuletzt gegessen</p>
                <div className="results">
                  {recents.map((e) => (
                    <button key={e.id} className="result row-result" onClick={() => readd(e)}>
                      <span>
                        {e.name}
                        {e.amount != null && <span className="muted small"> · {e.amount} {e.unit === 'g' ? 'g' : 'Port.'}</span>}
                      </span>
                      <span className="muted small">+ {e.kcal} kcal</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {!q && (
              <>
                <button className="collapse-head" onClick={() => setShowAll(!showAll)} aria-expanded={showAll}>
                  <span>
                    Alle Lebensmittel <span className="muted small">({allFoods.length})</span>
                  </span>
                  <IconChevron up={showAll} />
                </button>
                {showAll && (
                  <div className="food-grid">
                    {allFoods.map((f) => (
                      <button key={f.id} className={`chip ${sel?.food?.id === f.id ? 'active' : ''}`} onClick={() => pickFood(f)}>
                        {f.name}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {q && !sel && (
              <div className="results">
                {foodHits.map((f) => (
                  <button key={f.id} className="result" onClick={() => pickFood(f)}>
                    <span>{f.name}</span>
                    <span className="muted small">
                      {f.kcal} kcal · {f.protein} g P / 100 g
                    </span>
                  </button>
                ))}
                {dishHits.map((d) => (
                  <button key={d.title} className="result" onClick={() => pickPortion(d.title, d.m)}>
                    <span>{d.title}</span>
                    <span className="muted small">
                      {d.m.kcal} kcal · {d.m.protein} g P / Portion
                    </span>
                  </button>
                ))}
                {online.items.map((f) => (
                  <button key={f.id} className="result" onClick={() => pickFood(f)}>
                    <span>{f.name}</span>
                    <span className="muted small">
                      {f.kcal} kcal · {f.protein} g P / 100 g
                    </span>
                  </button>
                ))}
                {online.status === 'loading' && <p className="hint">Suche in der Datenbank …</p>}
                {online.status === 'error' && <p className="hint">Die Online-Datenbank ist gerade überlastet. Versuch es in einer Minute nochmal. Der Barcode-Scan geht weiterhin.</p>}
                {online.status === 'done' && online.items.length === 0 && <p className="hint">Online nichts gefunden.</p>}
                {online.status !== 'loading' && online.status !== 'done' && (
                  <button className="soft wide" onClick={searchOnline}>
                    „{query.trim()}“ online suchen
                  </button>
                )}
                {foodHits.length + dishHits.length === 0 && online.status === 'idle' && (
                  <p className="hint">Nichts in deinen Lebensmitteln gefunden. Probier die Online-Suche oder leg es selbst an.</p>
                )}
              </div>
            )}

            {sel && (
              <div className="selected">
                <div className="meal-head">
                  <strong>{sel.name}</strong>
                  {sel.food && (
                    <button className="ghost small" onClick={() => setForm({ food: sel.food! })}>
                      Bearbeiten
                    </button>
                  )}
                </div>
                <div className="row">
                  <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  <span className="muted">
                    {sel.unit === 'g' ? 'g' : 'Portion(en)'}
                    {sel.food?.portionLabel && ` · ${sel.food.portionLabel} = ${sel.food.portion} g`}
                  </span>
                </div>
                <div className="macro-grid">
                  <span><b>{Math.round(preview.kcal)}</b> kcal</span>
                  <span><b>{Math.round(preview.protein)}</b> g Protein</span>
                  <span><b>{Math.round(preview.carbs)}</b> g KH</span>
                  <span><b>{Math.round(preview.fat)}</b> g Fett</span>
                  <span><b>{Math.round(preview.fiber)}</b> g Ballastst.</span>
                  <span><b>{Math.round(preview.sugar)}</b> g Zucker</span>
                </div>
                <div className="row">
                  <button className="primary" style={{ flex: 1 }} onClick={addSelected}>
                    Zu {MEALS.find((m) => m.id === meal)!.label} hinzufügen
                  </button>
                  <button className="ghost" onClick={() => setSel(null)}>
                    Abbrechen
                  </button>
                </div>
              </div>
            )}

            <div className="row">
              <button className="ghost small" onClick={() => setForm({ food: null })}>
                + Eigenes Lebensmittel
              </button>
              <button className="ghost small" onClick={() => setShowQuick(!showQuick)}>
                + Schnelleintrag (nur Werte)
              </button>
            </div>
            {showQuick && (
              <div className="row wrap">
                <input placeholder="Name (z. B. Familienessen)" value={quick.name} onChange={(e) => setQuick({ ...quick, name: e.target.value })} />
                <input inputMode="numeric" placeholder="kcal" value={quick.kcal} onChange={(e) => setQuick({ ...quick, kcal: e.target.value })} />
                <input inputMode="decimal" placeholder="Protein g" value={quick.protein} onChange={(e) => setQuick({ ...quick, protein: e.target.value })} />
                <input inputMode="decimal" placeholder="KH g" value={quick.carbs} onChange={(e) => setQuick({ ...quick, carbs: e.target.value })} />
                <input inputMode="decimal" placeholder="Fett g" value={quick.fat} onChange={(e) => setQuick({ ...quick, fat: e.target.value })} />
                <button className="primary" onClick={addQuick}>
                  Hinzufügen
                </button>
              </div>
            )}
          </section>

          {!q && !sel && suggestions.length > 0 && (
            <section className="card">
              <div className="meal-head">
                <h2>Passt noch rein</h2>
                <span className="muted small">noch {Math.round(remaining)} kcal</span>
              </div>
              <div className="results">
                {suggestions.map((r) => (
                  <button key={r.id} className="result" onClick={() => {
                    pickPortion(r.title, r)
                    setTimeout(() => document.querySelector('.selected')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60)
                  }}>
                    <span>{r.title}</span>
                    <span className="muted small">
                      {r.kcal} kcal · {r.protein} g Protein · {r.minutes} Min.
                    </span>
                  </button>
                ))}
              </div>
              <p className="hint">Vorschläge für {MEALS.find((x) => x.id === meal)!.label}, passend zu deinen Rest-Kalorien. Das Rezept steht unter „Rezepte“.</p>
            </section>
          )}

          {MEALS.map((m) => {
            const list = entries.filter((e) => (e.meal ?? 'snack') === m.id)
            const sum = sumEntries(list)
            const hasYesterday = (data.food[addDays(date, -1)] ?? []).some((e) => (e.meal ?? 'snack') === m.id)
            return (
              <section className={`card meal-card ${meal === m.id ? 'target' : ''}`} key={m.id}>
                <div className="meal-head" onClick={() => setMeal(m.id)}>
                  <h2>{m.label}</h2>
                  <span className="muted small">{list.length ? lineMacros(sum) : 'noch nichts'}</span>
                </div>
                {list.length > 0 && (
                  <ul className="list">
                    {list.map((e) => (
                      <li key={e.id} className="entry-wrap">
                        <div className="entry" onClick={() => startEdit(e)}>
                          <span>
                            {e.name}
                            <br />
                            <span className="muted small">
                              {e.amount != null && `${e.amount} ${e.unit === 'g' ? 'g' : e.amount === 1 ? 'Portion' : 'Portionen'} · `}
                              {shortMacros(e)}
                            </span>
                          </span>
                          <span className="muted">
                            {e.kcal} kcal · {Math.round(e.protein)} g P
                          </span>
                        </div>
                        {editId === e.id && (
                          <div className="entry-edit">
                            <div className="row">
                              <input inputMode="decimal" value={editAmount} onChange={(ev) => setEditAmount(ev.target.value)} />
                              <span className="muted">{e.unit === 'g' ? 'g' : 'Portion(en)'}</span>
                            </div>
                            <div className="seg">
                              {MEALS.map((mm) => (
                                <button key={mm.id} className={(e.meal ?? 'snack') === mm.id ? 'active' : ''} onClick={() => saveEdit(e, mm.id)}>
                                  {mm.label}
                                </button>
                              ))}
                            </div>
                            <div className="row">
                              <button className="primary" style={{ flex: 1 }} onClick={() => saveEdit(e, e.meal ?? 'snack')}>
                                Menge speichern
                              </button>
                              <button className="ghost" onClick={() => remove(e.id)}>
                                Löschen
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {list.length > 0 &&
                  (saveFor === m.id ? (
                    <div className="row">
                      <input placeholder="Name der Vorlage" value={saveName} onChange={(e) => setSaveName(e.target.value)} />
                      <button className="primary" onClick={() => saveMeal(m.id)}>
                        Speichern
                      </button>
                    </div>
                  ) : (
                    <button
                      className="ghost small"
                      onClick={() => {
                        setSaveFor(m.id)
                        setSaveName(m.label)
                      }}
                    >
                      Als Vorlage speichern
                    </button>
                  ))}
                {list.length === 0 && hasYesterday && (
                  <button className="ghost small" onClick={() => copyYesterday(m.id)}>
                    Wie gestern übernehmen
                  </button>
                )}
              </section>
            )
          })}

          {isWeekend(date) && <WeekendCard />}
        </>
      )}

      {view === 'plan' && (
        <>
          <section className="card">
            <h2>Beispieltag</h2>
            <p className="hint">
              Der Beispieltag hat ca. {planKcal} kcal. Dein aktuelles Ziel ({mode.label}) liegt bei {getTargets(data.settings, todayKey()).kcal}{' '}
              kcal.
              {planDiff > 150 &&
                ` Dir fehlen also etwa ${Math.round(planDiff / 50) * 50} kcal: z. B. ${Math.round(planDiff / 3.5 / 10) * 10} g mehr Reis oder Nudeln (roh), oder eine Portion Haferflocken mit Banane dazu.`}
              {planDiff < -150 && ` Das sind etwa ${Math.round(-planDiff / 50) * 50} kcal zu viel: Beilagen (Reis, Nudeln, Kartoffeln) etwas kleiner machen.`}
            </p>
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
                    <span className="muted small">{lineMacros(o)}</span>
                  </div>
                  <ul className="list small">
                    {o.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                  <button
                    className="ghost small"
                    onClick={() => {
                      add(o.title, o, SLOT_MEAL[slot.name] ?? 'snack', 1, 'Portion', todayKey())
                      setDate(todayKey())
                      setView('log')
                    }}
                  >
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
