export enum Notation {
  C = 'C',
  Cis = 'C#',
  D = 'D',
  Dis = 'D#',
  E = 'E',
  F = 'F',
  Fis = 'F#',
  G = 'G',
  Gis = 'G#',
  A = 'A',
  Ais = 'A#',
  B = 'B',
}

export const OctaveZeroNotes: Notation[] = [Notation.A, Notation.Ais, Notation.B]
export const OctaveNotes: Notation[] = [
  Notation.C,
  Notation.Cis,
  Notation.D,
  Notation.Dis,
  Notation.E,
  Notation.F,
  Notation.Fis,
  Notation.G,
  Notation.Gis,
  Notation.A,
  Notation.Ais,
  Notation.B,
]
