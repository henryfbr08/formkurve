export const TARGETS = {
  weekdayKcal: 2500,
  weekendKcal: 2850,
  protein: 180,
  fatMin: 65,
  /** Kohlenhydrate = Rest der Kalorien */
  carbsWeekday: 300,
  carbsWeekend: 385,
  fiber: 30,
  /** Obergrenzen */
  sugarMax: 60,
  saltMax: 6,
}

/** Nährwerte (bei Food: pro 100 g, sonst pro Portion) */
export interface Macros {
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
  salt: number
}

export const MACRO_LABELS: { key: keyof Macros; label: string; unit: string }[] = [
  { key: 'kcal', label: 'Kalorien', unit: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Kohlenhydrate', unit: 'g' },
  { key: 'fat', label: 'Fett', unit: 'g' },
  { key: 'fiber', label: 'Ballaststoffe', unit: 'g' },
  { key: 'sugar', label: 'Zucker', unit: 'g' },
  { key: 'salt', label: 'Salz', unit: 'g' },
]

export interface Food extends Macros {
  id: string
  name: string
  /** übliche Portion in g */
  portion: number
  portionLabel?: string
}

export const FOODS: Food[] = [
  { id: 'quark', name: 'Magerquark', kcal: 67, protein: 12, carbs: 4, fat: 0.2, fiber: 0, sugar: 4, salt: 0.1, portion: 250 },
  { id: 'whey', name: 'ESN Whey', kcal: 380, protein: 76, carbs: 6, fat: 6, fiber: 0, sugar: 4, salt: 0.5, portion: 30, portionLabel: '1 Scoop' },
  { id: 'haehnchen', name: 'Hähnchenbrust (roh)', kcal: 105, protein: 23, carbs: 0, fat: 1.2, fiber: 0, sugar: 0, salt: 0.15, portion: 200 },
  { id: 'hack', name: 'Rinderhack light 5 % (roh)', kcal: 125, protein: 21, carbs: 0, fat: 5, fiber: 0, sugar: 0, salt: 0.15, portion: 200 },
  { id: 'ei', name: 'Ei', kcal: 145, protein: 12.5, carbs: 0.7, fat: 10, fiber: 0, sugar: 0.7, salt: 0.35, portion: 60, portionLabel: '1 Ei' },
  { id: 'lachs', name: 'Lachs (roh)', kcal: 200, protein: 20, carbs: 0, fat: 13, fiber: 0, sugar: 0, salt: 0.1, portion: 150 },
  { id: 'seelachs', name: 'Seelachs/Kabeljau (roh)', kcal: 80, protein: 18, carbs: 0, fat: 1, fiber: 0, sugar: 0, salt: 0.2, portion: 250 },
  { id: 'thunfisch', name: 'Thunfisch (Dose, abgetropft)', kcal: 110, protein: 25, carbs: 0, fat: 1, fiber: 0, sugar: 0, salt: 0.9, portion: 130, portionLabel: '1 Dose' },
  { id: 'reis', name: 'Reis (roh)', kcal: 350, protein: 7, carbs: 78, fat: 0.6, fiber: 1.4, sugar: 0.2, salt: 0, portion: 100 },
  { id: 'nudeln', name: 'Nudeln (roh)', kcal: 355, protein: 12, carbs: 70, fat: 1.5, fiber: 3, sugar: 3, salt: 0, portion: 100 },
  { id: 'kartoffeln', name: 'Kartoffeln (roh)', kcal: 75, protein: 2, carbs: 16, fat: 0.1, fiber: 2, sugar: 0.8, salt: 0, portion: 300 },
  { id: 'hafer', name: 'Haferflocken', kcal: 370, protein: 13, carbs: 59, fat: 7, fiber: 10, sugar: 1, salt: 0, portion: 60 },
  { id: 'brot', name: 'Vollkornbrot', kcal: 220, protein: 8, carbs: 40, fat: 1.5, fiber: 7, sugar: 3, salt: 1.1, portion: 50, portionLabel: '1 Scheibe' },
  { id: 'reiswaffel', name: 'Reiswaffel', kcal: 385, protein: 8, carbs: 80, fat: 3, fiber: 3, sugar: 0.3, salt: 0.1, portion: 8, portionLabel: '1 Stück' },
  { id: 'erbsen-moehren', name: 'Erbsen & Möhren (TK)', kcal: 55, protein: 3.5, carbs: 8, fat: 0.5, fiber: 4, sugar: 4, salt: 0.05, portion: 200 },
  { id: 'gurke', name: 'Gurke', kcal: 12, protein: 0.6, carbs: 2, fat: 0.1, fiber: 0.5, sugar: 1.7, salt: 0, portion: 150 },
  { id: 'banane', name: 'Banane', kcal: 95, protein: 1, carbs: 21, fat: 0.3, fiber: 2, sugar: 17, salt: 0, portion: 120, portionLabel: '1 Banane' },
  { id: 'apfel', name: 'Apfel', kcal: 55, protein: 0.3, carbs: 12, fat: 0.3, fiber: 2.3, sugar: 10, salt: 0, portion: 150, portionLabel: '1 Apfel' },
  { id: 'beeren', name: 'Beeren', kcal: 45, protein: 1, carbs: 7, fat: 0.4, fiber: 4, sugar: 6, salt: 0, portion: 150 },
  { id: 'erdnussbutter', name: 'Erdnussbutter', kcal: 600, protein: 25, carbs: 12, fat: 50, fiber: 7, sugar: 5, salt: 0.3, portion: 15 },
  { id: 'oel', name: 'Öl', kcal: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, sugar: 0, salt: 0, portion: 10, portionLabel: '1 EL' },
]

export interface MealOption extends Macros {
  title: string
  items: string[]
}

export interface MealSlot {
  name: string
  options: MealOption[]
}

export const MEAL_PLAN: MealSlot[] = [
  {
    name: 'Frühstück',
    options: [
      { title: 'Protein-Quark-Bowl', kcal: 670, protein: 50, carbs: 81, fat: 13, fiber: 13, sugar: 40, salt: 0.3, items: ['300 g Magerquark (mit Wasser cremig)', '60 g Haferflocken', '1 Banane + Beeren', '15 g Erdnussbutter/Nüsse'] },
      { title: 'Eier & Brot', kcal: 680, protein: 50, carbs: 68, fat: 20, fiber: 11, sugar: 28, salt: 1.9, items: ['3 Eier', '2 Scheiben Vollkornbrot', '150 g Kräuterquark', 'Gurke + 1 Obst'] },
    ],
  },
  {
    name: 'Mittagessen',
    options: [
      { title: 'Hähnchen, Reis, Erbsen-Möhren', kcal: 760, protein: 60, carbs: 94, fat: 14, fiber: 9, sugar: 8, salt: 0.4, items: ['200 g Hähnchenbrust', '100 g Reis/Nudeln (roh) oder 450 g Kartoffeln', '200 g Erbsen & Möhren', '10 g Öl'] },
    ],
  },
  {
    name: 'Snack / nach dem Training',
    options: [
      { title: 'Whey + Obst', kcal: 260, protein: 25, carbs: 33, fat: 3, fiber: 4, sugar: 16, salt: 0.2, items: ['1 Scoop Whey in Wasser', '1 Apfel + 2 Reiswaffeln'] },
    ],
  },
  {
    name: 'Abendessen',
    options: [
      { title: 'Hack-Kartoffel-Pfanne', kcal: 595, protein: 50, carbs: 58, fat: 18, fiber: 10, sugar: 10, salt: 0.4, items: ['200 g Rinderhack light', '300 g Kartoffeln', 'Karotten + Gurkensalat', '5–10 g Öl'] },
      { title: 'Fisch mit Kartoffeln', kcal: 610, protein: 41, carbs: 60, fat: 21, fiber: 12, sugar: 8, salt: 0.2, items: ['150 g Lachs oder 250 g Seelachs (+10 g Öl)', '300 g Kartoffeln', '150 g Erbsen & Möhren'] },
    ],
  },
  {
    name: 'Spätsnack',
    options: [
      { title: 'Whey-Quark-Pudding', kcal: 235, protein: 36, carbs: 16, fat: 2, fiber: 4, sugar: 15, salt: 0.3, items: ['200 g Magerquark', '½ Scoop Whey + etwas Wasser', '100 g Beeren'] },
    ],
  },
]

export const WEEKEND_RULES = [
  'Frühstück & Snacks selbst machen (Quark/Whey) → ~90 g Protein vor dem Familienessen',
  'Teller: 2 Handflächen Fleisch/Fisch · ½ Teller Gemüse · 1–2 Fäuste Beilage',
  'Soße 2–3 EL · einmal nachnehmen ok (Fleisch/Gemüse)',
  'Ein normales Stück Nachtisch ist drin',
  'Getränke: Wasser / Zero',
  'Montags +0,5–1 kg auf der Waage = Wasser. Nur der Wochenschnitt zählt.',
]
