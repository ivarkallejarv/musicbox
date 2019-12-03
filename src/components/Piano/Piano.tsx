import React from 'react'
import { Button, View, Text } from 'react-native'
import { FMSynth, Frequency, Time } from 'tone/tone'

// Roadmap
// Fix styling, make it an actual keyboard
// Adjust Synth options to sound more like a piano

const NormalPiano = {
  harmonicity: 8,
  modulationIndex: 2,
  oscillator: { type: 'sine' },
  envelope: { attack: 0.001, decay: 2, sustain: 0.1, release: 2 },
  modulation: { type: 'square' },
  modulationEnvelope: { attack: 0.002, decay: 0.2, sustain: 0, release: 0.2 },
}

export function Piano() {
  const keyboard = [...Array(88).keys()]

  const playNote = (midi: number) => () => {
    // const synth = new Tone.Synth({ oscillator: { type: 'sine' } })
    const synth = new FMSynth(NormalPiano)
    synth.toMaster()

    // Play Middle C
    const note = Frequency.mtof(midi)
    const duration = new Time(2).toNotation()
    synth.triggerAttackRelease(note, duration)
  }

  const getLabel = (note: number) => {
    const OctaveZeroNotes = ['A', 'A#', 'B']
    const OctaveNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

    // Octave 0 (A, A#, B) 7 Regular Octaves + Octave 8 (C) = 88 notes
    const Octave = Math.floor((note - 3) / OctaveNotes.length) + 1
    const NoteName = OctaveNotes[(note - 3) % OctaveNotes.length]

    return note <= 2 ? `${OctaveZeroNotes[note]}${0}` : `${NoteName}${Octave}`
  }

  return (
    <View>
      <Text>Piano - TODO Fix the styling</Text>

      {keyboard.map((i) => (
        <Button key={`note-${i}`} title={getLabel(i)} onPress={playNote(i)} />
      ))}
    </View>
  )
}
