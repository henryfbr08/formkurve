export const TARGETS = {
  weekdayKcal: 2500,
  weekendKcal: 2850,
  protein: 180,
  fatMin: 65,
}

export interface Food {
  id: string
  name: string
  /** pro 100 g */
  kcal: number
  protein: number
  /** übliche Portion in g */
  portion: number
  portionLabel?: string
}

export const FOODS: Food[] = [
  { id: 'quark', name: 'Magerquark', kcal: 67, protein: 12, portion: 250 },
  { id: 'whey', name: 'ESN Whey', kcal: 380, protein: 76, portion: 30, portionLabel: '1 Scoop' },
  { id: 'haehnchen', name: 'Hähnchenbrust (roh)', kcal: 105, protein: 23, portion: 200 },
  { id: 'hack', name: 'Rinderhack light 5 % (roh)', kcal: 125, protein: 21, portion: 200 },
  { id: 'ei', name: 'Ei', kcal: 145, protein: 12.5, portion: 60, portionLabel: '1 Ei' },
  { id: 'lachs', name: 'Lachs (roh)', kcal: 200, protein: 20, portion: 150 },
  { id: 'seelachs', name: 'Seelachs/Kabeljau (roh)', kcal: 80, protein: 18, portion: 250 },
  { id: 'thunfisch', name: 'Thunfisch (Dose, abgetropft)', kcal: 110, protein: 25, portion: 130, portionLabel: '1 Dose' },
  { id: 'reis', name: 'Reis (roh)', kcal: 350, protein: 7, portion: 100 },
  { id: 'nudeln', name: 'Nudeln (roh)', kcal: 355, protein: 12, portion: 100 },
  { id: 'kartoffeln', name: 'Kartoffeln (roh)', kcal: 75, protein: 2, portion: 300 },
  { id: 'hafer', name: 'Haferflocken', kcal: 370, protein: 13, portion: 60 },
  { id: 'brot', name: 'Vollkornbrot', kcal: 220, protein: 8, portion: 50, portionLabel: '1 Scheibe' },
  { id: 'reiswaffel', name: 'Reiswaffel', kcal: 385, protein: 8, portion: 8, portionLabel: '1 Stück' },
  { id: 'erbsen-moehren', name: 'Erbsen & Möhren (TK)', kcal: 55, protein: 3.5, portion: 200 },
  { id: 'gurke', name: 'Gurke', kcal: 12, protein: 0.6, portion: 150 },
  { id: 'banane', name: 'Banane', kcal: 95, protein: 1, portion: 120, portionLabel: '1 Banane' },
  { id: 'apfel', name: 'Apfel', kcal: 55, protein: 0.3, portion: 150, portionLabel: '1 Apfel' },
  { id: 'beeren', name: 'Beeren', kcal: 45, protein: 1, portion: 150 },
  { id: 'erdnussbutter', name: 'Erdnussbutter', kcal: 600, protein: 25, portion: 15 },
  { id: 'oel', name: 'Öl', kcal: 884, protein: 0, portion: 10, portionLabel: '1 EL' },
]

export interface MealOption {
  title: string
  kcal: number
  protein: number
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
      { title: 'Protein-Quark-Bowl', kcal: 620, protein: 49, items: ['300 g Magerquark (mit Wasser cremig)', '60 g Haferflocken', '1 Banane + Beeren', '15 g Erdnussbutter/Nüsse'] },
      { title: 'Eier & Brot', kcal: 620, protein: 45, items: ['3 Eier', '2 Scheiben Vollkornbrot', '150 g Kräuterquark', 'Gurke + 1 Obst'] },
    ],
  },
  {
    name: 'Mittagessen',
    options: [
      { title: 'Hähnchen, Reis, Erbsen-Möhren', kcal: 770, protein: 59, items: ['200 g Hähnchenbrust', '100 g Reis/Nudeln (roh) oder 450 g Kartoffeln', '200 g Erbsen & Möhren', '10 g Öl'] },
    ],
  },
  {
    name: 'Snack / nach dem Training',
    options: [
      { title: 'Whey + Obst', kcal: 260, protein: 25, items: ['1 Scoop Whey in Wasser', '1 Apfel + 2 Reiswaffeln'] },
    ],
  },
  {
    name: 'Abendessen',
    options: [
      { title: 'Hack-Kartoffel-Pfanne', kcal: 620, protein: 52, items: ['200 g Rinderhack light', '300 g Kartoffeln', 'Karotten + Gurkensalat', '5–10 g Öl'] },
      { title: 'Fisch mit Kartoffeln', kcal: 600, protein: 45, items: ['150 g Lachs oder 250 g Seelachs (+10 g Öl)', '300 g Kartoffeln', '150 g Erbsen & Möhren'] },
    ],
  },
  {
    name: 'Spätsnack',
    options: [
      { title: 'Whey-Quark-Pudding', kcal: 260, protein: 38, items: ['200 g Magerquark', '½ Scoop Whey + etwas Wasser', '100 g Beeren'] },
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
