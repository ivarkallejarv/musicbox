let audioContext = null
let isPlaying = false
let sourceNode = null
let analyser = null
let mediaStreamSource = null
let detectorElem, pitchElem, noteElem, detuneElem, detuneAmount

window.onload = () => {
  audioContext = new AudioContext()
  const request = new XMLHttpRequest()
  request.open('GET', '../sounds/whistling3.ogg', true)
  request.responseType = 'arraybuffer'
  request.onload = () => {
    audioContext.decodeAudioData(request.response, () => {}).catch((e) => console.log(e))
  }
  request.send()

  detectorElem = document.getElementById('detector')
  pitchElem = document.getElementById('pitch')
  noteElem = document.getElementById('note')
  detuneElem = document.getElementById('detune')
  detuneAmount = document.getElementById('detune_amt')

  detectorElem.ondragenter = () => {
    this.classList.add('droptarget')
    return false
  }
  detectorElem.ondragleave = () => {
    this.classList.remove('droptarget')
    return false
  }
  detectorElem.ondrop = (e) => {
    this.classList.remove('droptarget')
    e.preventDefault()

    const reader = new FileReader()
    reader.onload = (event) => {
      audioContext
        .decodeAudioData(
          event.target.result,
          () => {},
          () => {
            alert('error loading!')
          },
        )
        .catch((e) => console.log(e))
    }
    reader.onerror = () => {
      alert('Error: ' + reader.error)
    }
    reader.readAsArrayBuffer(e.dataTransfer.files[0])
    return false
  }
}

function error() {
  alert('Stream generation failed.')
}

function getUserMedia(dictionary, callback) {
  try {
    navigator.getUserMedia(dictionary, callback, error)
  } catch (e) {
    alert('getUserMedia threw exception :' + e)
  }
}

function gotStream(stream) {
  mediaStreamSource = audioContext.createMediaStreamSource(stream)

  analyser = audioContext.createAnalyser()
  analyser.fftSize = 2048
  mediaStreamSource.connect(analyser)
  updatePitch()
}

export function toggleLiveInput() {
  if (isPlaying) {
    sourceNode.stop(0)
    sourceNode = null
    analyser = null
    isPlaying = false
    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = window.webkitCancelAnimationFrame
    }
    window.cancelAnimationFrame(rafID)
  }
  getUserMedia(
    {
      audio: {
        mandatory: {
          googEchoCancellation: 'false',
          googAutoGainControl: 'false',
          googNoiseSuppression: 'false',
          googHighpassFilter: 'false',
        },
        optional: [],
      },
    },
    gotStream,
  )
}

let rafID = null
let buflen = 1024
let buf = new Float32Array(buflen)

let noteStrings = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function noteFromPitch(frequency) {
  const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2))
  return Math.round(noteNum) + 69
}

function frequencyFromNoteNumber(note) {
  return 440 * Math.pow(2, (note - 69) / 12)
}

function centsOffFromPitch(frequency, note) {
  return Math.floor((1200 * Math.log(frequency / frequencyFromNoteNumber(note))) / Math.log(2))
}

let MIN_SAMPLES = 0
let GOOD_ENOUGH_CORRELATION = 0.9

function autoCorrelate(buf, sampleRate) {
  let SIZE = buf.length
  let MAX_SAMPLES = Math.floor(SIZE / 2)
  let best_offset = -1
  let best_correlation = 0
  let rms = 0
  let foundGoodCorrelation = false
  let correlations = new Array(MAX_SAMPLES)

  for (let i = 0; i < SIZE; i++) {
    let val = buf[i]
    rms += val * val
  }
  rms = Math.sqrt(rms / SIZE)
  if (rms < 0.01) return -1

  let lastCorrelation = 1
  for (let offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
    let correlation = 0

    for (let i = 0; i < MAX_SAMPLES; i++) {
      correlation += Math.abs(buf[i] - buf[i + offset])
    }
    correlation = 1 - correlation / MAX_SAMPLES
    correlations[offset] = correlation // store it, for the tweaking we need to do below.
    if (correlation > GOOD_ENOUGH_CORRELATION && correlation > lastCorrelation) {
      foundGoodCorrelation = true
      if (correlation > best_correlation) {
        best_correlation = correlation
        best_offset = offset
      }
    } else if (foundGoodCorrelation) {
      let shift = (correlations[best_offset + 1] - correlations[best_offset - 1]) / correlations[best_offset]
      return sampleRate / (best_offset + 8 * shift)
    }
    lastCorrelation = correlation
  }
  if (best_correlation > 0.01) {
    return sampleRate / best_offset
  }
  return -1
}

function updatePitch() {
  analyser.getFloatTimeDomainData(buf)
  let ac = autoCorrelate(buf, audioContext.sampleRate)
  let pitch

  if (ac === -1) {
    detectorElem.className = 'vague'
    pitchElem.innerText = '--'
    noteElem.innerText = '-'
    detuneElem.className = ''
    detuneAmount.innerText = '--'
  } else {
    detectorElem.className = 'confident'
    pitch = ac
    pitchElem.innerText = Math.round(pitch)
    let note = noteFromPitch(pitch)
    noteElem.innerHTML = noteStrings[note % 12]
    let detune = centsOffFromPitch(pitch, note)
    if (detune === 0) {
      detuneElem.className = ''
      detuneAmount.innerHTML = '--'
    } else {
      if (detune < 0) detuneElem.className = 'flat'
      else detuneElem.className = 'sharp'
      detuneAmount.innerHTML = Math.abs(detune)
    }
  }

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = window.webkitRequestAnimationFrame
  }
  rafID = window.requestAnimationFrame(updatePitch)
}
