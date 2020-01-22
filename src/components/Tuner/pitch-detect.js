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
    audioContext.decodeAudioData(request.response, () => {})
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
      audioContext.decodeAudioData(
        event.target.result,
        () => {},
        () => {
          alert('error loading!')
        },
      )
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
  audioContext.resume()
  if (isPlaying) {
    sourceNode.stop(0)
    sourceNode = null
    analyser = null
    isPlaying = false
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
let buflen = 2048
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

function autoCorrelate(buf, sampleRate) {
  // Implements the ACF2+ algorithm
  let SIZE = buf.length
  let rms = 0

  for (let i = 0; i < SIZE; i++) {
    let val = buf[i]
    rms += val * val
  }
  rms = Math.sqrt(rms / SIZE)
  if (rms < 0.01) return -1

  let r1 = 0
  let r2 = SIZE - 1
  let threshold = 0.2
  for (let i = 0; i < SIZE / 2; i++)
    if (Math.abs(buf[i]) < threshold) {
      r1 = i
      break
    }
  for (let i = 1; i < SIZE / 2; i++)
    if (Math.abs(buf[SIZE - i]) < threshold) {
      r2 = SIZE - i
      break
    }

  buf = buf.slice(r1, r2)
  SIZE = buf.length

  let c = new Array(SIZE).fill(0)
  for (let i = 0; i < SIZE; i++) for (let j = 0; j < SIZE - i; j++) c[i] = c[i] + buf[j] * buf[j + i]

  let d = 0
  while (c[d] > c[d + 1]) d++
  let maxval = -1
  let maxpos = -1
  for (let i = d; i < SIZE; i++) {
    if (c[i] > maxval) {
      maxval = c[i]
      maxpos = i
    }
  }
  let T0 = maxpos

  let x1 = c[T0 - 1]
  let x2 = c[T0]
  let x3 = c[T0 + 1]
  let a = (x1 + x3 - 2 * x2) / 2
  let b = (x3 - x1) / 2
  if (a) T0 = T0 - b / (2 * a)

  return sampleRate / T0
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

  rafID = window.requestAnimationFrame(updatePitch)
}
