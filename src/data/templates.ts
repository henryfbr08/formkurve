import { MOBILITY, WEEK_SCHEDULE, WORKOUTS, type Exercise, type Workout } from './training'

export interface PlanTemplate {
  id: string
  name: string
  days: string
  desc: string
  workouts: Workout[]
  /** Wochentag (0 = So … 6 = Sa) → Workout-ID */
  schedule: Record<number, string | null>
}

/* Gleiche Übungs-IDs wie im eigenen Plan, damit Verlauf und Bestleistungen weiterlaufen */
const ex = (id: string, name: string, sets: number, repMin: number, repMax: number, extra: Partial<Exercise> = {}): Exercise => ({
  id,
  name,
  sets,
  repMin,
  repMax,
  ...extra,
})

const RIR = 'Beinübungen mit 1–2 Wdh. Reserve: Die Beine müssen noch laufen.'

/* ---------- Ganzkörper 3× (A/B im Wechsel) ---------- */
const GK_A: Workout = {
  id: 'gk-a',
  name: 'Ganzkörper A',
  exercises: [
    ex('beinpresse', 'Beinpresse 45°', 3, 6, 10, { hint: RIR }),
    ex('bank-multi', 'Bankdrücken an der Multipresse', 3, 6, 10),
    ex('rudern-sitzend', 'Rudern (sitzend, Rudergriff)', 3, 8, 12),
    ex('rdl', 'Rumänisches Kreuzheben', 2, 8, 10),
    ex('seitheben-kh', 'Seitheben (Kurzhanteln)', 2, 12, 15),
    ex('waden-stehend', 'Wadenheben (stehend)', 2, 10, 15),
    ex('crunch-kabel', 'Crunches am Kabelzug', 2, 10, 15),
  ],
}
const GK_B: Workout = {
  id: 'gk-b',
  name: 'Ganzkörper B',
  exercises: [
    ex('bulgarian', 'Bulgarian Split Squat', 3, 8, 12, { perSide: true, hint: RIR }),
    ex('schulterpresse', 'Schulterpresse', 3, 6, 10),
    ex('latzug-brust', 'Latzug (breit zur Brust)', 3, 8, 12),
    ex('beinbeuger', 'Beinbeuger', 2, 8, 12),
    ex('hammer', 'Hammer-Curls (sitzend, Kurzhanteln)', 2, 10, 15),
    ex('trizeps-ueberkopf', 'Trizepsdrücken am Kabelzug (Seil, überkopf)', 2, 10, 15),
    ex('abduktoren', 'Abduktorenmaschine', 2, 12, 15),
  ],
}

/* ---------- Oberkörper / Unterkörper 4× ---------- */
const OK1: Workout = {
  id: 'ok-1',
  name: 'Oberkörper 1',
  exercises: [
    ex('bank-multi', 'Bankdrücken an der Multipresse', 3, 6, 8),
    ex('rudern-sitzend', 'Rudern (sitzend, Rudergriff)', 3, 8, 10),
    ex('schraegbank-multi', 'Schrägbankdrücken an der Multipresse', 2, 8, 12),
    ex('latzug-eng', 'Latzug (breiter Griff, enge Ausführung)', 2, 10, 12),
    ex('seitheben-kh', 'Seitheben (Kurzhanteln)', 3, 12, 20),
    ex('bizepsmaschine', 'Bizepsmaschine', 2, 10, 15),
    ex('trizeps-stange', 'Trizepsdrücken am Kabelzug (gerade Stange)', 2, 10, 15),
  ],
}
const UK1: Workout = {
  id: 'uk-1',
  name: 'Unterkörper 1',
  exercises: [
    ex('beinpresse', 'Beinpresse 45°', 3, 6, 10, { hint: RIR }),
    ex('rdl', 'Rumänisches Kreuzheben', 3, 6, 10),
    ex('beinstrecker', 'Beinstrecker', 2, 10, 15),
    ex('beinbeuger', 'Beinbeuger', 2, 10, 15),
    ex('waden-stehend', 'Wadenheben (stehend)', 3, 8, 12),
    ex('crunch-kabel', 'Crunches am Kabelzug', 2, 10, 15),
  ],
}
const OK2: Workout = {
  id: 'ok-2',
  name: 'Oberkörper 2',
  exercises: [
    ex('schulterpresse', 'Schulterpresse', 3, 6, 10),
    ex('klimmzuege', 'Klimmzüge', 3, 6, 10, { mode: 'reps' }),
    ex('brustpresse', 'Brustpresse', 2, 8, 12),
    ex('tbar', 'T-Bar Rudern (breiter Griff)', 2, 8, 12),
    ex('reverse-butterfly', 'Butterfly reverse', 2, 12, 20),
    ex('hammer', 'Hammer-Curls (sitzend, Kurzhanteln)', 2, 10, 15),
    ex('trizeps-ueberkopf', 'Trizepsdrücken am Kabelzug (Seil, überkopf)', 2, 10, 15),
  ],
}
const UK2: Workout = {
  id: 'uk-2',
  name: 'Unterkörper 2',
  exercises: [
    ex('bulgarian', 'Bulgarian Split Squat', 3, 8, 12, { perSide: true, hint: RIR }),
    ex('hip-thrust', 'Hip Thrust', 3, 8, 12),
    ex('beinbeuger-sitzend', 'Beinbeuger (sitzend)', 2, 10, 15),
    ex('waden-sitzend', 'Wadenheben (sitzend)', 3, 12, 15),
    ex('abduktoren', 'Abduktorenmaschine', 2, 12, 15),
    ex('beinheben', 'Beinheben im Unterarmstütz', 2, 10, 15, { mode: 'reps' }),
  ],
}

/* ---------- Wenig Zeit: 2× Ganzkörper ---------- */
const KOMPAKT_A: Workout = { ...GK_A, id: 'kompakt-a', name: 'Kompakt A', exercises: GK_A.exercises.slice(0, 5) }
const KOMPAKT_B: Workout = { ...GK_B, id: 'kompakt-b', name: 'Kompakt B', exercises: GK_B.exercises.slice(0, 5) }

/* ---------- Hybrid (Kraft + Laufen, Hyrox-Stil) ---------- */
const HYBRID_KRAFT: Workout = {
  id: 'hybrid-kraft',
  name: 'Hybrid Kraft',
  exercises: [
    ex('kniebeuge', 'Kniebeuge', 3, 5, 8, { hint: RIR }),
    ex('bank-multi', 'Bankdrücken an der Multipresse', 3, 5, 8),
    ex('klimmzuege', 'Klimmzüge', 3, 6, 10, { mode: 'reps' }),
    ex('rdl', 'Rumänisches Kreuzheben', 2, 6, 10),
    ex('waden-stehend', 'Wadenheben (stehend)', 2, 8, 12),
  ],
}
const HYBRID_ATHLETIK: Workout = {
  id: 'hybrid-athletik',
  name: 'Hybrid Athletik',
  exercises: [
    ex('ausfallschritte', 'Ausfallschritte', 3, 10, 12, { perSide: true }),
    ex('schulterpresse', 'Schulterpresse', 3, 8, 10),
    ex('rudern-sitzend', 'Rudern (sitzend, Rudergriff)', 3, 8, 12),
    ex('step-ups', 'Step-ups', 2, 10, 12, { perSide: true }),
    ex('plank', 'Plank', 3, 30, 60, { mode: 'sec' }),
    ex('abduktoren', 'Abduktorenmaschine', 2, 12, 15),
  ],
}

export const TEMPLATES: PlanTemplate[] = [
  {
    id: 'mein-split',
    name: 'Mein Split (lauf-angepasst)',
    days: '5× Gym + Stabi + Mobility',
    desc: 'Dein Push/Pull-Split mit neuem Beintag für Läufer. Viel Volumen für den Oberkörper, Beine gezielt fürs Laufen.',
    workouts: WORKOUTS,
    schedule: WEEK_SCHEDULE,
  },
  {
    id: 'ganzkoerper-3',
    name: 'Ganzkörper 3×',
    days: 'Mo · Mi · Sa',
    desc: 'A und B im Wechsel. Jeder Muskel 3× pro Woche, kurze Einheiten (ca. 50 Min.). Ideal in einer Diät oder bei viel Laufen.',
    workouts: [GK_A, GK_B, MOBILITY],
    schedule: { 1: 'gk-a', 2: null, 3: 'gk-b', 4: null, 5: null, 6: 'gk-a', 0: 'mobility' },
  },
  {
    id: 'ok-uk-4',
    name: 'Oberkörper / Unterkörper 4×',
    days: 'Mo · Mi · Do · Sa',
    desc: 'Klassiker für Fortgeschrittene. Jeder Muskel 2× pro Woche, gut mit 3 Läufen kombinierbar.',
    workouts: [OK1, UK1, OK2, UK2, MOBILITY],
    schedule: { 1: 'ok-1', 2: null, 3: 'uk-1', 4: 'ok-2', 5: null, 6: 'uk-2', 0: 'mobility' },
  },
  {
    id: 'hybrid',
    name: 'Hybrid (Kraft + Laufen)',
    days: 'Mo · Do + 3 Läufe',
    desc: 'Für Phasen, in denen das Laufen im Vordergrund steht, z. B. vor einem 10-km-Lauf oder Hyrox. Weniger Gym, Kraft bleibt erhalten.',
    workouts: [HYBRID_KRAFT, HYBRID_ATHLETIK, MOBILITY],
    schedule: { 1: 'hybrid-kraft', 2: null, 3: 'mobility', 4: 'hybrid-athletik', 5: null, 6: null, 0: null },
  },
  {
    id: 'kompakt-2',
    name: 'Wenig Zeit: 2× Ganzkörper',
    days: 'Mo · Do',
    desc: 'Für stressige Wochen (Prüfungen, Urlaub). Zwei kurze Einheiten halten Muskeln und Kraft.',
    workouts: [KOMPAKT_A, KOMPAKT_B, MOBILITY],
    schedule: { 1: 'kompakt-a', 2: null, 3: null, 4: 'kompakt-b', 5: null, 6: null, 0: 'mobility' },
  },
]
