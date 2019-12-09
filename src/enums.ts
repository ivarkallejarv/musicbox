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

export const SynthOptions = {
  harmonicity: 8,
  modulationIndex: 2,
  oscillator: { type: 'sine' },
  envelope: { attack: 0.001, decay: 2, sustain: 0.1, release: 2 },
  modulation: { type: 'square' },
  modulationEnvelope: { attack: 0.002, decay: 0.2, sustain: 0, release: 0.2 },
}
