import type { Food } from '../data/nutrition'

// Nährwerte über Open Food Facts (offene Datenbank, kostenlos, ohne Konto)
const FIELDS = 'code,product_name,product_name_de,brands,nutriments,serving_quantity'

/* eslint-disable @typescript-eslint/no-explicit-any */
function parse(code: string, p: any): Food | null {
  const n = p?.nutriments ?? {}
  const kcal = n['energy-kcal_100g'] ?? (n['energy_100g'] ? n['energy_100g'] / 4.184 : null)
  const title = p?.product_name_de || p?.product_name
  if (kcal == null || !title) return null
  const r1 = (v: unknown) => Math.round((Number(v) || 0) * 10) / 10
  const brand = typeof p.brands === 'string' ? p.brands.split(',')[0].trim() : ''
  return {
    id: `ean-${code}`,
    name: [brand, title].filter(Boolean).join(' – '),
    kcal: Math.round(kcal),
    protein: r1(n['proteins_100g']),
    carbs: r1(n['carbohydrates_100g']),
    fat: r1(n['fat_100g']),
    fiber: r1(n['fiber_100g']),
    sugar: r1(n['sugars_100g']),
    salt: Math.round((Number(n['salt_100g']) || 0) * 100) / 100,
    portion: Math.round(Number(p.serving_quantity) || 100),
  }
}

export async function lookupBarcode(code: string): Promise<Food | null> {
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${FIELDS}`)
  if (!res.ok) return null
  const json = await res.json()
  if (json.status !== 1 || !json.product) return null
  return parse(code, json.product)
}

async function getProducts(url: string): Promise<Food[]> {
  const res = await fetch(url, { signal: AbortSignal.timeout(9000) })
  if (!res.ok) throw new Error('Suche fehlgeschlagen')
  const json = await res.json()
  const out: Food[] = []
  for (const p of json.products ?? []) {
    const f = p.code ? parse(String(p.code), p) : null
    if (f) out.push(f)
  }
  return out
}

const tag = (q: string) =>
  encodeURIComponent(
    q
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9äöüß]+/g, '-'),
  )

/**
 * Produktsuche. Zuerst die Volltextsuche; ist die überlastet (kommt bei Open Food Facts
 * öfter vor), wird nach Kategorie und Marke gesucht.
 */
export async function searchProducts(query: string): Promise<Food[]> {
  try {
    const hits = await getProducts(
      'https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=24&lc=de&cc=de' +
        `&fields=${FIELDS}&search_terms=${encodeURIComponent(query)}`,
    )
    if (hits.length) return hits
  } catch {
    /* weiter mit der Ersatzsuche */
  }
  const base = `https://world.openfoodfacts.org/api/v2/search?page_size=20&fields=${FIELDS}&countries_tags_en=germany&sort_by=unique_scans_n&`
  const results = await Promise.allSettled([
    getProducts(`${base}categories_tags_de=${tag(query)}`),
    getProducts(`${base}brands_tags=${tag(query)}`),
  ])
  if (results.every((r) => r.status === 'rejected')) throw new Error('Suche fehlgeschlagen')
  const seen = new Set<string>()
  return results
    .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    .filter((f) => (seen.has(f.id) ? false : (seen.add(f.id), true)))
}
