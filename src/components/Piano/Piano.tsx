import React, { useState } from 'react'
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native'
import { FMSynth, Frequency, Time } from 'tone/tone'
import { Notation, OctaveNotes, OctaveZeroNotes, SynthOptions } from '../../enums'

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
    <View>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navigationButton}
          disabled={octave === 0}
          onPress={() => changeOctave('decrement')}
        >
          <Text>Lower</Text>
        </TouchableOpacity>

        <Text>Current Octave: {octave}</Text>

        <TouchableOpacity
          style={styles.navigationButton}
          disabled={octave === 8}
          onPress={() => changeOctave('increment')}
        >
          <Text>Higher</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.piano}>
        {notes.map((i) => (
          <TouchableOpacity
            key={`note-${i}`}
            style={i.length === 1 ? styles.whiteKey : styles.blackKey}
            onPress={() => playNote(i)}
          >
            <Text />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navigationButton: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 16,
    paddingRight: 16,
    textAlign: 'center',
    boxShadow: '-1px 0 0 rgba(255,255,255,0.8) inset,0 0 5px #ccc inset,0 0 3px rgba(0,0,0,0.2)',
  },
  piano: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  whiteKey: {
    height: '16em',
    width: '4em',
    zIndex: 1,
    borderLeft: '1px solid #bbb',
    borderBottom: '1px solid #bbb',
    borderRadius: 5,
    backgroundColor: '#fff',
    boxShadow: '-1px 0 0 rgba(255,255,255,0.8) inset,0 0 5px #ccc inset,0 0 3px rgba(0,0,0,0.2)',
  },
  blackKey: {
    position: 'relative',
    height: '8em',
    width: '2em',
    marginLeft: '-1rem',
    marginRight: '-1rem',
    zIndex: 2,
    border: '1px solid #000',
    borderRadius: 3,
    backgroundColor: '#000',
    boxShadow:
      '-1px -1px 2px rgba(255,255,255,0.2) inset,0 -5px 2px 3px rgba(0,0,0,0.6) inset,0 2px 4px rgba(0,0,0,0.5)',
  },
})
