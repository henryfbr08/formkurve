export interface Exercise {
  id: string
  name: string
  sets: number
  repMin: number
  repMax: number
  /** optionaler Hinweis aus der Plan-Analyse */
  hint?: string
  /** Messart: Gewicht × Wdh. (Standard), nur Wdh. oder Sekunden halten */
  mode?: 'weight' | 'reps' | 'sec'
  /** Angabe gilt pro Seite */
  perSide?: boolean
}

export interface Workout {
  id: string
  name: string
  exercises: Exercise[]
}

const RUN_HINT = 'Grundübungen mit 1–2 Wdh. Reserve, nicht bis zum Versagen: Freitag ist der Tempolauf.'

const ISO_HINT = 'Tipp: Bei Isolationsübungen sind 10–15 Wdh. gelenkschonender und genauso effektiv.'

export const WORKOUTS: Workout[] = [
  {
    id: 'push',
    name: 'Push',
    exercises: [
      { id: 'bank-multi', name: 'Bankdrücken an der Multipresse', sets: 2, repMin: 4, repMax: 6 },
      { id: 'butterfly', name: 'Butterfly', sets: 3, repMin: 4, repMax: 6, hint: ISO_HINT },
      { id: 'schulterpresse', name: 'Schulterpresse', sets: 2, repMin: 4, repMax: 6 },
      { id: 'seitheben-kh', name: 'Seitheben (Kurzhanteln)', sets: 3, repMin: 4, repMax: 6, hint: ISO_HINT },
      { id: 'trizeps-trx', name: 'Trizepsdrücken (TRX-Band)', sets: 2, repMin: 4, repMax: 6 },
      { id: 'trizeps-einarmig', name: 'Trizepsdrücken am Kabelzug (einarmig)', sets: 1, repMin: 4, repMax: 6, hint: ISO_HINT },
      { id: 'trizeps-stange', name: 'Trizepsdrücken am Kabelzug (gerade Stange)', sets: 2, repMin: 4, repMax: 6, hint: ISO_HINT },
    ],
  },
  {
    id: 'pull',
    name: 'Pull',
    exercises: [
      { id: 'latzug-eng', name: 'Latzug (breiter Griff, enge Ausführung)', sets: 3, repMin: 4, repMax: 6 },
      { id: 'rudern-sitzend', name: 'Rudern (sitzend, Rudergriff)', sets: 2, repMin: 4, repMax: 6 },
      { id: 'tbar', name: 'T-Bar Rudern (breiter Griff)', sets: 2, repMin: 4, repMax: 6 },
      { id: 'reverse-butterfly', name: 'Butterfly reverse', sets: 2, repMin: 4, repMax: 6, hint: ISO_HINT },
      { id: 'hammer', name: 'Hammer-Curls (sitzend, Kurzhanteln)', sets: 2, repMin: 4, repMax: 6, hint: ISO_HINT },
      { id: 'bizepsmaschine', name: 'Bizepsmaschine', sets: 3, repMin: 4, repMax: 6, hint: ISO_HINT },
    ],
  },
  {
    id: 'legs',
    name: 'Beine (lauf-angepasst)',
    exercises: [
      { id: 'beinpresse', name: 'Beinpresse 45°', sets: 3, repMin: 6, repMax: 10, hint: RUN_HINT },
      { id: 'rdl', name: 'Rumänisches Kreuzheben', sets: 3, repMin: 6, repMax: 10, hint: 'Hintere Kette (Po, Beinbeuger) treibt dich beim Laufen nach vorne. Rücken gerade, Stange nah am Bein.' },
      { id: 'bulgarian', name: 'Bulgarian Split Squat', sets: 2, repMin: 8, repMax: 12, perSide: true, hint: 'Einbeinig wie beim Laufen: trainiert Kraft und Stabilität von Knie und Hüfte.' },
      { id: 'beinbeuger', name: 'Beinbeuger', sets: 2, repMin: 8, repMax: 12 },
      { id: 'beinstrecker', name: 'Beinstrecker', sets: 2, repMin: 10, repMax: 15 },
      { id: 'waden-stehend', name: 'Wadenheben (stehend)', sets: 3, repMin: 8, repMax: 12, hint: 'Schwer und langsam (3 Sek. runter). Die Waden fangen beim Laufen ein Vielfaches deines Körpergewichts ab.' },
      { id: 'waden-sitzend', name: 'Wadenheben (sitzend)', sets: 2, repMin: 12, repMax: 15, hint: 'Sitzend trifft vor allem den Schollenmuskel, der für Läufer besonders wichtig ist.' },
      { id: 'abduktoren', name: 'Abduktorenmaschine', sets: 2, repMin: 12, repMax: 15, hint: 'Seitliche Hüftmuskeln halten das Becken und das Knie beim Laufen stabil.' },
    ],
  },
  {
    id: 'brust-ruecken',
    name: 'Brust / Rücken',
    exercises: [
      { id: 'brustpresse', name: 'Brustpresse', sets: 3, repMin: 4, repMax: 6 },
      { id: 'schraegbank-multi', name: 'Schrägbankdrücken an der Multipresse', sets: 2, repMin: 4, repMax: 6 },
      { id: 'dips', name: 'Dips', sets: 2, repMin: 4, repMax: 6 },
      { id: 'kreuzheben', name: 'Kreuzheben', sets: 2, repMin: 4, repMax: 6, hint: 'Tipp: Kreuzheben besser als 1. Übung machen, mit 1–2 Wdh. Reserve.' },
      { id: 'latzug-brust', name: 'Latzug (breit zur Brust)', sets: 3, repMin: 4, repMax: 6 },
      { id: 'rudern-sitzend', name: 'Rudern (sitzend, Rudergriff)', sets: 2, repMin: 4, repMax: 6 },
      { id: 'tbar', name: 'T-Bar Rudern (breiter Griff)', sets: 2, repMin: 4, repMax: 6 },
    ],
  },
  {
    id: 'arme',
    name: 'Arme / Schultern',
    exercises: [
      { id: 'bizepsmaschine', name: 'Bizepsmaschine', sets: 3, repMin: 4, repMax: 6, hint: ISO_HINT },
      { id: 'hammer', name: 'Hammer-Curls (sitzend, Kurzhanteln)', sets: 2, repMin: 4, repMax: 6, hint: ISO_HINT },
      { id: 'trizeps-stange', name: 'Trizepsdrücken am Kabelzug (gerade Stange)', sets: 2, repMin: 4, repMax: 6, hint: ISO_HINT },
      { id: 'trizeps-ueberkopf', name: 'Trizepsdrücken am Kabelzug (Seil, überkopf)', sets: 2, repMin: 4, repMax: 6, hint: ISO_HINT },
      { id: 'trizeps-einarmig', name: 'Trizepsdrücken am Kabelzug (einarmig)', sets: 1, repMin: 4, repMax: 6, hint: ISO_HINT },
      { id: 'reverse-butterfly', name: 'Butterfly reverse', sets: 2, repMin: 4, repMax: 6, hint: ISO_HINT },
      { id: 'schulterpresse', name: 'Schulterpresse', sets: 2, repMin: 4, repMax: 6 },
      { id: 'seitheben-kh', name: 'Seitheben (Kurzhanteln)', sets: 2, repMin: 4, repMax: 6, hint: ISO_HINT },
    ],
  },
  {
    id: 'stabi',
    name: 'Stabilität',
    exercises: [
      { id: 'rueckenstrecker', name: 'Rückenstrecker', sets: 3, repMin: 4, repMax: 6 },
      { id: 'beinheben', name: 'Beinheben im Unterarmstütz', sets: 2, repMin: 8, repMax: 8 },
      { id: 'crunch-kabel', name: 'Crunches am Kabelzug', sets: 2, repMin: 6, repMax: 8 },
      { id: 'russian-twist', name: 'Russian Twists', sets: 2, repMin: 8, repMax: 8 },
      { id: 'liegestuetz', name: 'Liegestütz', sets: 3, repMin: 30, repMax: 30 },
      { id: 'klimmzuege', name: 'Klimmzüge', sets: 3, repMin: 10, repMax: 10 },
    ],
  },
]

export const MOBILITY: Workout = {
  id: 'mobility',
  name: 'Mobility',
  exercises: [
    { id: 'cat-cow', name: 'Katze-Kuh', sets: 1, repMin: 10, repMax: 10, mode: 'reps' },
    { id: 'bws-rotation', name: 'BWS-Rotation im Vierfüßlerstand', sets: 2, repMin: 8, repMax: 8, mode: 'reps', perSide: true },
    { id: 'worlds-greatest', name: "World's Greatest Stretch", sets: 2, repMin: 5, repMax: 5, mode: 'reps', perSide: true },
    { id: 'hip-90-90', name: '90/90 Hüftrotation', sets: 2, repMin: 8, repMax: 8, mode: 'reps', perSide: true },
    { id: 'couch-stretch', name: 'Hüftbeuger-Dehnung (Couch Stretch)', sets: 2, repMin: 45, repMax: 60, mode: 'sec', perSide: true },
    { id: 'knie-zur-wand', name: 'Sprunggelenk: Knie zur Wand', sets: 2, repMin: 10, repMax: 10, mode: 'reps', perSide: true },
    { id: 'tiefe-hocke', name: 'Tiefe Hocke halten', sets: 2, repMin: 30, repMax: 45, mode: 'sec' },
    { id: 'waden-dehnung', name: 'Wadendehnung an der Wand', sets: 2, repMin: 30, repMax: 45, mode: 'sec', perSide: true },
    { id: 'band-dislocates', name: 'Schulterkreisen mit Band (Dislocates)', sets: 2, repMin: 10, repMax: 12, mode: 'reps' },
  ],
}

WORKOUTS.push(MOBILITY)

/** Wochentag (0 = So … 6 = Sa) → Workout-ID */
export const WEEK_SCHEDULE: Record<number, string | null> = {
  1: 'push',
  2: 'pull',
  3: 'legs',
  4: 'brust-ruecken',
  5: 'arme',
  6: 'stabi',
  0: 'mobility',
}

export function workoutById(id: string): Workout | undefined {
  return WORKOUTS.find((w) => w.id === id)
}
