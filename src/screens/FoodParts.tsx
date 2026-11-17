import { useState } from 'react'
import { smooth } from '../lib/transition'
import { uid, useStore } from '../lib/store'
import { todayKey, addDays, mondayOf } from '../lib/dates'
import type { Food, Macros } from '../data/nutrition'
import type { Recipe } from '../data/recipes'
import { getRecipes } from '../lib/plan'
import RecipeForm, { RECIPE_TAGS } from './RecipeForm'
import { getTargets, MODES, type Mode } from '../lib/targets'
import { estimateTdee } from '../lib/insights'

const num = (v: string) => parseFloat(v.replace(',', '.')) || 0

/* ---------- Lebensmittel anlegen / bearbeiten ---------- */

const FIELDS: { key: keyof Macros; label: string }[] = [
  { key: 'kcal', label: 'Kalorien (kcal)' },
  { key: 'protein', label: 'Protein (g)' },
  { key: 'carbs', label: 'Kohlenhydrate (g)' },
  { key: 'fat', label: 'Fett (g)' },
  { key: 'fiber', label: 'Ballaststoffe (g)' },
  { key: 'sugar', label: 'Zucker (g)' },
  { key: 'salt', label: 'Salz (g)' },
]

export function FoodForm({ food, onClose, onSaved }: { food: Food | null; onClose: () => void; onSaved: (f: Food) => void }) {
  const { data, update } = useStore()
  const [name, setName] = useState(food?.name ?? '')
  const [portion, setPortion] = useState(String(food?.portion ?? 100))
  const [vals, setVals] = useState<Record<string, string>>(() =>
    Object.fromEntries(FIELDS.map((f) => [f.key, food ? String(food[f.key]) : ''])),
  )
  const isOwn = !!food && (data.customFoods ?? []).some((f) => f.id === food.id)

  function save() {
    if (!name.trim() || !num(vals.kcal)) return
    const f: Food = {
      id: food?.id ?? `own-${uid()}`,
      name: name.trim(),
      portion: num(portion) || 100,
      portionLabel: food?.portionLabel,
      kcal: num(vals.kcal),
      protein: num(vals.protein),
      carbs: num(vals.carbs),
      fat: num(vals.fat),
      fiber: num(vals.fiber),
      sugar: num(vals.sugar),
      salt: num(vals.salt),
    }
    update((d) => {
      d.customFoods = [f, ...(d.customFoods ?? []).filter((x) => x.id !== f.id)]
      return d
    })
    onSaved(f)
  }

  function remove() {
    if (!food) return
    update((d) => {
      d.customFoods = (d.customFoods ?? []).filter((x) => x.id !== food.id)
      return d
    })
    onClose()
  }

  return (
    <div className="overlay">
      <div className="scanner">
        <div className="scanner-head">
          <h2>{food ? 'Lebensmittel bearbeiten' : 'Eigenes Lebensmittel'}</h2>
          <button className="ghost small" onClick={onClose}>
            Schließen
          </button>
        </div>
        <label className="field">
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Proteinriegel" />
        </label>
        <label className="field">
          Übliche Portion (g)
          <input inputMode="decimal" value={portion} onChange={(e) => setPortion(e.target.value)} />
        </label>
        <h3>Nährwerte pro 100 g</h3>
        <div className="form-grid">
          {FIELDS.map((f) => (
            <label className="field" key={f.key}>
              {f.label}
              <input inputMode="decimal" value={vals[f.key]} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} />
            </label>
          ))}
        </div>
        <div className="row">
          <button className="primary" style={{ flex: 1 }} onClick={save}>
            Speichern
          </button>
          {isOwn && (
            <button className="ghost" onClick={remove}>
              {food!.id.startsWith('own-') || food!.id.startsWith('ean-') ? 'Löschen' : 'Zurücksetzen'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------- Rezepte ---------- */

export function RecipeList({ onAdd, query = '' }: { onAdd: (title: string, m: Macros) => void; query?: string }) {
  const { data, update } = useStore()
  const [open, setOpen] = useState<string | null>(null)
  const [filter, setFilter] = useState('Alle')
  const [search, setSearch] = useState(query)
  const [form, setForm] = useState<{ recipe: Recipe | null } | null>(null)
  const tags = ['Alle', ...RECIPE_TAGS]
  const q = search.trim().toLowerCase()
  const list = getRecipes(data).filter((r) => (filter === 'Alle' || r.tags.includes(filter)) && (!q || r.title.toLowerCase().includes(q) || r.ingredients.some((i) => i.toLowerCase().includes(q))))
  return (
    <>
      {form && <RecipeForm recipe={form.recipe} onClose={() => setForm(null)} />}
      <input className="search" placeholder="Rezept oder Zutat suchen …" value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="chips">
        {tags.map((t) => (
          <button key={t} className={`chip ${filter === t ? 'active' : ''}`} onClick={() => smooth(() => setFilter(t))}>
            {t}
          </button>
        ))}
      </div>
      {list.length === 0 && <p className="muted">Kein Rezept gefunden.</p>}
      {list.map((r) => {
        const isOpen = open === r.id
        return (
          <section className="card" key={r.id}>
            <button className="week-head" onClick={() => smooth(() => setOpen(isOpen ? null : r.id))}>
              <span>
                <strong>{r.title}</strong>
                <br />
                <span className="muted small">
                  {r.kcal} kcal · {r.protein} g P · {r.portions} Portionen · {r.minutes} Min.
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
                  <span className="badge">hält {r.keeps}</span>
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
                {r.tip && <p className="hint">Tipp: {r.tip}</p>}
                <div className="row">
                  <button className="primary" style={{ flex: 1 }} onClick={() => onAdd(r.title, r)}>
                    + 1 Portion eintragen
                  </button>
                  <button className="ghost" onClick={() => setForm({ recipe: r })}>
                    Bearbeiten
                  </button>
                </div>
              </div>
            )}
          </section>
        )
      })}
      <button className="soft wide" onClick={() => setForm({ recipe: null })}>
        + Eigenes Rezept anlegen
      </button>
      {data.recipes && (
        <button
          className="ghost small"
          onClick={() =>
            update((d) => {
              delete d.recipes
              return d
            })
          }
        >
          Rezepte auf Vorgabe zurücksetzen
        </button>
      )}
      <p className="hint">Nährwerte pro Portion, aus Rohgewichten berechnet und gerundet.</p>
    </>
  )
}

/* ---------- Ziele: Abnehmen / Halten / Aufbauen ---------- */

export function Goals() {
  const { data, update } = useStore()
  const s = data.settings
  const today = todayKey()
  const weekday = getTargets(s, mondayOf(today))
  const weekend = getTargets(s, addDays(mondayOf(today), 5))
  const m = MODES[s.mode]
  const est = estimateTdee(data, today)
  const [maint, setMaint] = useState(String(s.maintenance))
  const [protein, setProtein] = useState(s.protein != null ? String(s.protein) : '')
  const [fat, setFat] = useState(s.fat != null ? String(s.fat) : '')

  function setMode(mode: Mode) {
    update((d) => {
      d.settings = { mode, maintenance: d.settings.maintenance }
      return d
    })
    setProtein('')
    setFat('')
  }

  function saveNumbers() {
    const k = num(maint)
    update((d) => {
      if (k >= 1500 && k <= 6000) d.settings.maintenance = Math.round(k)
      d.settings.protein = num(protein) || undefined
      d.settings.fat = num(fat) || undefined
      return d
    })
  }

  return (
    <>
      <section className="card">
        <h2>Mein Ziel</h2>
        <div className="modes">
          {(Object.keys(MODES) as Mode[]).map((id) => (
            <button key={id} className={`mode ${s.mode === id ? 'active' : ''}`} onClick={() => setMode(id)}>
              <strong>{MODES[id].label}</strong>
              <span>{MODES[id].desc}</span>
            </button>
          ))}
        </div>
        <p className="hint">
          Erwartete Veränderung: <strong>{m.rate}</strong>. {m.tip}
        </p>
      </section>

      <section className="card">
        <h2>Tagesziele ({m.label})</h2>
        <div className="stats">
          <div className="stat">
            <span className="stat-value">{weekday.kcal}</span>
            <span className="stat-label">kcal Mo–Fr</span>
          </div>
          <div className="stat">
            <span className="stat-value">{weekend.kcal}</span>
            <span className="stat-label">kcal Sa/So</span>
          </div>
          <div className="stat">
            <span className="stat-value">{weekday.protein} g</span>
            <span className="stat-label">Protein</span>
          </div>
        </div>
        <ul className="list small">
          <li>
            Kohlenhydrate: ca. {weekday.carbs} g{weekend.carbs !== weekday.carbs && ` (Wochenende ca. ${weekend.carbs} g)`}
          </li>
          <li>Fett: ca. {weekday.fat} g</li>
          <li>
            Ballaststoffe: mind. {weekday.fiber} g · Zucker: max. ~{weekday.sugarMax} g · Salz: max. {weekday.saltMax} g
          </li>
        </ul>
      </section>

      <section className="card">
        <h2>Dein echter Verbrauch</h2>
        {est.ready ? (
          <>
            <div className="stats">
              <div className="stat">
                <span className="stat-value">{est.tdee} kcal</span>
                <span className="stat-label">geschätzter Verbrauch</span>
              </div>
              <div className="stat">
                <span className="stat-value">
                  {est.trendPerWeek! > 0 ? '+' : ''}
                  {est.trendPerWeek!.toFixed(2).replace('.', ',')} kg
                </span>
                <span className="stat-label">Trend pro Woche</span>
              </div>
            </div>
            <p className="hint">
              Berechnet aus {est.weighIns} Wiegungen und {est.intakeDays} getrackten Tagen der letzten 4 Wochen (Ø {est.avgIntake} kcal
              gegessen). Eingestellt sind {s.maintenance} kcal.
            </p>
            {Math.abs(est.tdee! - s.maintenance) >= 100 ? (
              <button
                className="primary wide"
                onClick={() => {
                  update((d) => {
                    d.settings.maintenance = est.tdee!
                    return d
                  })
                  setMaint(String(est.tdee))
                }}
              >
                {est.tdee} kcal als Erhaltungskalorien übernehmen
              </button>
            ) : (
              <p className="hint">Das passt zu deiner Einstellung. Nichts zu ändern.</p>
            )}
            <p className="hint">Die Schätzung stimmt nur, wenn du an den gezählten Tagen wirklich alles eingetragen hast, auch am Wochenende.</p>
          </>
        ) : (
          <>
            <p className="hint">
              Die App kann deinen Verbrauch aus deinen eigenen Daten berechnen, sobald genug da ist. Das ist genauer als jede Formel.
            </p>
            <div className="bar">
              <div className="bar-head">
                <span>Wiegungen (letzte 4 Wochen, über mind. 14 Tage)</span>
                <span>
                  {est.weighIns} / {est.needWeighIns}
                </span>
              </div>
              <div className="bar-track">
                <div className="bar-fill ok" style={{ width: `${Math.min(100, (est.weighIns / est.needWeighIns) * 100)}%` }} />
              </div>
            </div>
            <div className="bar">
              <div className="bar-head">
                <span>Vollständig getrackte Tage</span>
                <span>
                  {est.intakeDays} / {est.needIntakeDays}
                </span>
              </div>
              <div className="bar-track">
                <div className="bar-fill ok" style={{ width: `${Math.min(100, (est.intakeDays / est.needIntakeDays) * 100)}%` }} />
              </div>
            </div>
          </>
        )}
      </section>

      <section className="card">
        <h2>Feineinstellung</h2>
        <label className="field">
          Erhaltungskalorien (dein Verbrauch pro Tag)
          <input inputMode="numeric" value={maint} onChange={(e) => setMaint(e.target.value)} />
        </label>
        <div className="form-grid">
          <label className="field">
            Protein (g), leer = {m.protein}
            <input inputMode="numeric" value={protein} placeholder={String(m.protein)} onChange={(e) => setProtein(e.target.value)} />
          </label>
          <label className="field">
            Fett (g), leer = {m.fat}
            <input inputMode="numeric" value={fat} placeholder={String(m.fat)} onChange={(e) => setFat(e.target.value)} />
          </label>
        </div>
        <button className="primary wide" onClick={saveNumbers}>
          Übernehmen
        </button>
        <p className="hint">
          Passt der Wochenschnitt auf der Waage 2–3 Wochen lang nicht zur erwarteten Veränderung, ändere die Erhaltungskalorien um
          100–200 kcal: Nimmst du zu langsam ab, Wert senken. Nimmst du zu schnell ab oder zu langsam zu, Wert erhöhen.
        </p>
      </section>

      <section className="card">
        <h2>Wann umstellen?</h2>
        <ul className="list small">
          <li>
            <strong>Abnehmen → Halten:</strong> wenn du dein Zielgewicht erreicht hast, oder nach 8–12 Wochen Diät für 1–2 Wochen als
            Pause.
          </li>
          <li>
            <strong>Halten → Aufbauen:</strong> wenn du schlank genug bist (Bauch flach, Bauchmuskeln angedeutet) und das Gewicht 2–4
            Wochen stabil war.
          </li>
          <li>
            <strong>Aufbauen → Abnehmen:</strong> wenn der Bauchumfang deutlich schneller wächst als deine Kraftwerte.
          </li>
          <li>Das Training bleibt in allen Phasen gleich hart. Es ändert sich nur das Essen.</li>
        </ul>
      </section>
    </>
  )
}
