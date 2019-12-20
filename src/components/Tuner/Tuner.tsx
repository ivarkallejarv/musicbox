import React from 'react'
import CorrelationWorker from './correlation-worker.worker'

// Roadmap
// Add visuals

function TunerReducer() {
  const C2 = 65.41 // C2 note, in Hz.
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  let testFrequencies: any[] = []
  for (let i = 0; i < 30; i++) {
    const noteFrequency = C2 * Math.pow(2, i / 12)
    const noteName = `${notes[i % 12]}${Math.round(i / 12) + 1}`
    const note = { frequency: noteFrequency, name: noteName }
    const just_above = { frequency: noteFrequency * Math.pow(2, 1 / 48), name: `${noteName} (a bit sharp)` }
    const just_below = { frequency: noteFrequency * Math.pow(2, -1 / 48), name: `${noteName} (a bit flat)` }
    testFrequencies = testFrequencies.concat([just_below, note, just_above])
  }

  const correlationWorker = new (CorrelationWorker as typeof Worker & (new () => Worker))()

  window.addEventListener('load', initialize)
  correlationWorker.addEventListener('message', interpretCorrelationResult)

  function initialize() {
    navigator.getUserMedia.call(navigator, { audio: true }, useStream, () => {})
  }

  function useStream(stream: MediaStream) {
    const audioContext = new AudioContext()
    const microphone = audioContext.createMediaStreamSource(stream)
    const scriptProcessorNode = audioContext.createScriptProcessor(1024, 1, 1)
    scriptProcessorNode.connect(audioContext.destination)
    microphone.connect(scriptProcessorNode)
    let timeseries: number[] = []
    const sampleLengthMilliseconds = 100
    let recording = true
    // Need to leak this function into the global namespace so it doesn't get
    // prematurely garbage-collected.
    // http://lists.w3.org/Archives/Public/public-audio/2013JanMar/0304.html
    window.captureAudio = ({ inputBuffer }) => {
      if (!recording) return

      const { sampleRate } = audioContext

      // console.log('TimeSeries: ', Math.max(...inputBuffer.getChannelData(0)))

      timeseries = timeseries.concat(Array.prototype.slice.call(inputBuffer.getChannelData(0)))
      // Stop recording after sampleLengthMilliseconds.
      if (timeseries.length > (sampleLengthMilliseconds * sampleRate) / 1000) {
        recording = false
        correlationWorker.postMessage({ timeseries, testFrequencies, sampleRate })
        timeseries = []
        setTimeout(() => (recording = true), 250)
      }
    }

    scriptProcessorNode.onaudioprocess = window.captureAudio
  }

  function interpretCorrelationResult({ data }: any) {
    // const { timeseries } = data
    const { frequencyAmplitudes } = data
    // Compute the (squared) magnitudes of the complex amplitudes for each test frequency.
    const magnitudes = frequencyAmplitudes.map((z: number[]) => z[0] * z[0] + z[1] * z[1])
    // Find the maximum in the list of magnitudes.
    let maximumIndex = -1
    let maximumMagnitude = 0
    for (let i = 0; i < magnitudes.length; i++) {
      if (magnitudes[i] <= maximumMagnitude) continue
      maximumIndex = i
      maximumMagnitude = magnitudes[i]
    }

    // Compute the average magnitude. We'll only pay attention to frequencies
    // with magnitudes significantly above average.
    const average = magnitudes.reduce((a: number, b: number) => a + b, 0) / magnitudes.length
    const confidence = maximumMagnitude / average || 0
    const confidence_threshold = 10 // empirical, arbitrary.
    if (confidence > confidence_threshold) {
      const dominantFrequency = testFrequencies[maximumIndex]
      const noteName = document.getElementById('note-name') as any
      const frequency = document.getElementById('frequency') as any
      noteName.textContent = dominantFrequency.name
      frequency.textContent = dominantFrequency.frequency
    }
  }
}

export function Tuner() {
  TunerReducer()

  return (
    <div>
      <h2 id="note-name">-</h2>

      <p>
        <span>frequency (Hz):</span>
        <span id="frequency">0</span>
      </p>
    </div>
  )
}
