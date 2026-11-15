import { useState } from 'react'
import { uid, useStore } from '../lib/store'
import { getRecipes } from '../lib/plan'
import type { Recipe } from '../data/recipes'
import type { Macros } from '../data/nutrition'

const num = (v: string) => parseFloat(v.replace(',', '.')) || 0
const lines = (v: string) =>
  v
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

export const RECIPE_TAGS = ['Meal Prep', 'Frühstück', 'Mittag', 'Abend', 'Snack', 'Süß']

const FIELDS: { key: keyof Macros; label: string }[] = [
  { key: 'kcal', label: 'Kalorien (kcal)' },
  { key: 'protein', label: 'Protein (g)' },
  { key: 'carbs', label: 'Kohlenhydrate (g)' },
  { key: 'fat', label: 'Fett (g)' },
  { key: 'fiber', label: 'Ballaststoffe (g)' },
  { key: 'sugar', label: 'Zucker (g)' },
  { key: 'salt', label: 'Salz (g)' },
]

/** Rezept anlegen oder bearbeiten */
export default function RecipeForm({ recipe, onClose }: { recipe: Recipe | null; onClose: () => void }) {
  const { update } = useStore()
  const [title, setTitle] = useState(recipe?.title ?? '')
  const [tags, setTags] = useState<string[]>(recipe?.tags ?? ['Meal Prep'])
  const [portions, setPortions] = useState(String(recipe?.portions ?? 4))
  const [minutes, setMinutes] = useState(String(recipe?.minutes ?? 30))
  const [keeps, setKeeps] = useState(recipe?.keeps ?? '3 Tage')
  const [vals, setVals] = useState<Record<string, string>>(() =>
    Object.fromEntries(FIELDS.map((f) => [f.key, recipe ? String(recipe[f.key]) : ''])),
  )
  const [ingredients, setIngredients] = useState(recipe?.ingredients.join('\n') ?? '')
  const [steps, setSteps] = useState(recipe?.steps.join('\n') ?? '')
  const [tip, setTip] = useState(recipe?.tip ?? '')

  function toggle(t: string) {
    setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])
  }

  function save() {
    if (!title.trim()) return
    const r: Recipe = {
      id: recipe?.id ?? `own-${uid()}`,
      title: title.trim(),
      tags,
      portions: Math.max(1, Math.round(num(portions))),
      minutes: Math.round(num(minutes)),
      keeps: keeps.trim() || '–',
      kcal: num(vals.kcal),
      protein: num(vals.protein),
      carbs: num(vals.carbs),
      fat: num(vals.fat),
      fiber: num(vals.fiber),
      sugar: num(vals.sugar),
      salt: num(vals.salt),
      ingredients: lines(ingredients),
      steps: lines(steps),
      tip: tip.trim() || undefined,
    }
    update((d) => {
      const list: Recipe[] = structuredClone(getRecipes(d))
      const i = list.findIndex((x) => x.id === r.id)
      if (i >= 0) list[i] = r
      else list.unshift(r)
      d.recipes = list
      return d
    })
    onClose()
  }

  function remove() {
    if (!recipe) return
    update((d) => {
      d.recipes = structuredClone(getRecipes(d)).filter((x) => x.id !== recipe.id)
      return d
    })
    onClose()
  }

  return (
    <div className="overlay">
      <div className="scanner">
        <div className="scanner-head">
          <h2>{recipe ? 'Rezept bearbeiten' : 'Eigenes Rezept'}</h2>
          <button className="ghost small" onClick={onClose}>
            Schließen
          </button>
        </div>
        <label className="field">
          Name
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Hähnchen-Nudel-Pfanne" />
        </label>
        <div className="chips">
          {RECIPE_TAGS.map((t) => (
            <button key={t} className={`chip ${tags.includes(t) ? 'active' : ''}`} onClick={() => toggle(t)}>
              {t}
            </button>
          ))}
        </div>
        <div className="form-grid three">
          <label className="field">
            Portionen
            <input inputMode="numeric" value={portions} onChange={(e) => setPortions(e.target.value)} />
          </label>
          <label className="field">
            Minuten
            <input inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
          </label>
          <label className="field">
            Haltbar
            <input value={keeps} onChange={(e) => setKeeps(e.target.value)} />
          </label>
        </div>
        <h3>Nährwerte pro Portion</h3>
        <div className="form-grid">
          {FIELDS.map((f) => (
            <label className="field" key={f.key}>
              {f.label}
              <input inputMode="decimal" value={vals[f.key]} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} />
            </label>
          ))}
        </div>
        <label className="field">
          Zutaten (eine pro Zeile)
          <textarea rows={6} value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder={'800 g Hähnchenbrust\n320 g Reis (roh)'} />
        </label>
        <label className="field">
          Zubereitung (ein Schritt pro Zeile)
          <textarea rows={5} value={steps} onChange={(e) => setSteps(e.target.value)} />
        </label>
        <label className="field">
          Tipp (optional)
          <input value={tip} onChange={(e) => setTip(e.target.value)} />
        </label>
        <div className="row">
          <button className="primary" style={{ flex: 1 }} onClick={save}>
            Speichern
          </button>
          {recipe && (
            <button className="ghost" onClick={remove}>
              Löschen
            </button>
          )}
        </div>
        <p className="hint">Die Nährwerte pro Portion findest du am einfachsten, indem du alle Zutaten einmal im Tagebuch zusammenrechnest und durch die Portionen teilst.</p>
      </div>
    </div>
  )
}
