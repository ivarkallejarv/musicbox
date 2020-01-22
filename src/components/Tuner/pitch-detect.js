window.AudioContext = window.AudioContext || window.webkitAudioContext

let audioContext = null
let isPlaying = false
let sourceNode = null
let analyser = null
let mediaStreamSource = null
let detectorElem, pitchElem, noteElem, detuneElem, detuneAmount

window.onload = function() {
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
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia
    navigator.getUserMedia(dictionary, callback, error)
  } catch (e) {
    alert('getUserMedia threw exception :' + e)
  }
}

function gotStream(stream) {
  // Create an AudioNode from the stream.
  mediaStreamSource = audioContext.createMediaStreamSource(stream)

  // Connect it to the destination.
  analyser = audioContext.createAnalyser()
  analyser.fftSize = 2048
  mediaStreamSource.connect(analyser)
  updatePitch()
}

export function toggleLiveInput() {
  if (isPlaying) {
    //stop playing and return
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

// this is a float version of the algorithm below - but it's not currently used.
/*
function autoCorrelateFloat( buf, sampleRate ) {
	var MIN_SAMPLES = 4;	// corresponds to an 11kHz signal
	var MAX_SAMPLES = 1000; // corresponds to a 44Hz signal
	var SIZE = 1000;
	var best_offset = -1;
	var best_correlation = 0;
	var rms = 0;

	if (buf.length < (SIZE + MAX_SAMPLES - MIN_SAMPLES))
		return -1;  // Not enough data

	for (var i=0;i<SIZE;i++)
		rms += buf[i]*buf[i];
	rms = Math.sqrt(rms/SIZE);

	for (var offset = MIN_SAMPLES; offset <= MAX_SAMPLES; offset++) {
		var correlation = 0;

		for (var i=0; i<SIZE; i++) {
			correlation += Math.abs(buf[i]-buf[i+offset]);
		}
		correlation = 1 - (correlation/SIZE);
		if (correlation > best_correlation) {
			best_correlation = correlation;
			best_offset = offset;
		}
	}
	if ((rms>0.1)&&(best_correlation > 0.1)) {
		console.log("f = " + sampleRate/best_offset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")");
	}
//	var best_frequency = sampleRate/best_offset;
}
*/

let MIN_SAMPLES = 0 // will be initialized when AudioContext is created.
let GOOD_ENOUGH_CORRELATION = 0.9 // this is the "bar" for how close a correlation needs to be

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
  if (rms < 0.01)
    // not enough signal
    return -1

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
      // short-circuit - we found a good correlation, then a bad one, so we'd just be seeing copies from here.
      // Now we need to tweak the offset - by interpolating between the values to the left and right of the
      // best offset, and shifting it a bit.  This is complex, and HACKY in this code (happy to take PRs!) -
      // we need to do a curve fit on correlations[] around best_offset in order to better determine precise
      // (anti-aliased) offset.

      // we know best_offset >=1,
      // since foundGoodCorrelation cannot go to true until the second pass (offset=1), and
      // we can't drop into this clause until the following pass (else if).
      let shift = (correlations[best_offset + 1] - correlations[best_offset - 1]) / correlations[best_offset]
      return sampleRate / (best_offset + 8 * shift)
    }
    lastCorrelation = correlation
  }
  if (best_correlation > 0.01) {
    // console.log("f = " + sampleRate/best_offset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")")
    return sampleRate / best_offset
  }
  return -1
  //	var best_frequency = sampleRate/best_offset;
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

  if (!window.requestAnimationFrame) window.requestAnimationFrame = window.webkitRequestAnimationFrame
  rafID = window.requestAnimationFrame(updatePitch)
}
