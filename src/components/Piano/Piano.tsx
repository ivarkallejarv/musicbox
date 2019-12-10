import React, { useState } from 'react'
import { FMSynth, Frequency, Time } from 'tone/Tone'
import { Notation, OctaveNotes, OctaveZeroNotes, SynthOptions } from '../../enums'

import './Piano.scss'

function PianoReducer() {
  const [octave, setOctave] = useState(4)
  const notes = octave === 0 ? OctaveZeroNotes : OctaveNotes

  // Alternative piano sound
  // const synth = new Tone.Synth();
  // synth.oscillator.type = "sine";
  const synth = new FMSynth(SynthOptions)
  synth.toMaster()

  function changeOctave(action: 'increment' | 'decrement') {
    if ((action === 'increment' && octave === 8) || (action === 'decrement' && octave === 0)) {
      return
    }
    const change = action === 'increment' ? 1 : -1
    setOctave(octave + change)
  }

  function playNote(note: Notation) {
    const leftOver = 3 + (octave - 1) * OctaveNotes.length
    const midi = octave === 0 ? OctaveZeroNotes.indexOf(note) : OctaveNotes.indexOf(note) + leftOver

    const tone = Frequency.mtof(midi)
    const duration = new Time(2).toNotation()

    // Can separate to triggerAttack on mouseDown
    // And triggerRelease on mouseUp
    synth.triggerAttackRelease(tone, duration)
  }

  return { octave, notes, changeOctave, playNote }
}

// Roadmap
// Fix styling, make it an actual keyboard
// Adjust Synth options to sound more like a piano
// Middle C is the 1st note of 4th Octave, mark it accordingly

export function Piano() {
  const { octave, notes, changeOctave, playNote } = PianoReducer()

  return (
    <div className="piano">
      <div className="piano__controls">
        <button disabled={octave === 0} onClick={() => changeOctave('decrement')}>
          Lower
        </button>

        <p>Current Octave: {octave}</p>

        <button disabled={octave === 8} onClick={() => changeOctave('increment')}>
          Higher
        </button>
      </div>

      <div className="piano__keys">
        {notes.map((i) => (
          <button
            key={`note-${i}`}
            className={i.length === 1 ? 'piano__white-key' : 'piano__black-key'}
            onClick={() => playNote(i)}
          />
        ))}
      </div>
    </div>
  )
}
