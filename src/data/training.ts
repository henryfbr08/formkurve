export interface Exercise {
  id: string
  name: string
  sets: number
  repMin: number
  repMax: number
  /** optionaler Hinweis aus der Plan-Analyse */
  hint?: string
}

export interface Workout {
  id: string
  name: string
  exercises: Exercise[]
}

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
    name: 'Legs + Schultern',
    exercises: [
      { id: 'seitheben-maschine', name: 'Seitheben (Maschine)', sets: 3, repMin: 4, repMax: 6, hint: ISO_HINT },
      { id: 'schulterpresse', name: 'Schulterpresse', sets: 2, repMin: 4, repMax: 6 },
      { id: 'reverse-butterfly', name: 'Butterfly reverse', sets: 2, repMin: 4, repMax: 6, hint: ISO_HINT },
      { id: 'beinbeuger', name: 'Beinbeuger', sets: 2, repMin: 4, repMax: 6, hint: 'Beine bekommen aktuell sehr wenig Volumen – siehe Plan-Analyse (09).' },
      { id: 'beinstrecker', name: 'Beinstrecker', sets: 2, repMin: 4, repMax: 6 },
      { id: 'waden-sitzend', name: 'Wadenheben (sitzend)', sets: 2, repMin: 4, repMax: 6 },
      { id: 'beinpresse', name: 'Beinpresse 45°', sets: 2, repMin: 4, repMax: 6 },
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

/** Wochentag (0 = So … 6 = Sa) → Workout-ID */
export const WEEK_SCHEDULE: Record<number, string | null> = {
  1: 'push',
  2: 'pull',
  3: 'legs',
  4: 'brust-ruecken',
  5: 'arme',
  6: 'stabi',
  0: null,
}

export function workoutById(id: string): Workout | undefined {
  return WORKOUTS.find((w) => w.id === id)
}
