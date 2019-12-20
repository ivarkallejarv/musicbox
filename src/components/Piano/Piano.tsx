import React, { useState } from 'react'
import { OctaveNotes, OctaveZeroNotes } from './Notation'
import PianoPreset from './PianoPreset'
import 'webaudiofont'

import './Piano.scss'

function PianoReducer() {
  const [octave, setOctave] = useState(4)
  const notes = octave === 0 ? OctaveZeroNotes : OctaveNotes

  const AudioContext = window.AudioContext
  const audioContext = new AudioContext()

  const player = new window.WebAudioFontPlayer()
  player.adjustPreset(audioContext, PianoPreset)

  function changeOctave(action: 'increment' | 'decrement') {
    if ((action === 'increment' && octave === 8) || (action === 'decrement' && octave === 0)) {
      return
    }
    const change = action === 'increment' ? 1 : -1
    setOctave(octave + change)
  }

  function playNote(note: number) {
    const pitch = note - 1 + 12 * octave
    const { destination, currentTime } = audioContext

    player.queueWaveTable(audioContext, destination, PianoPreset, currentTime, pitch, 4)
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
        {notes.map((i, index) => (
          <button
            key={`note-${i}`}
            className={i.length === 1 ? 'piano__white-key' : 'piano__black-key'}
            onClick={() => playNote(index)}
          />
        ))}
      </div>
    </div>
  )
}
