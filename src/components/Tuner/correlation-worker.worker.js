self.onmessage = ({ data }) => {
  const { timeseries, testFrequencies, sampleRate } = data
  const frequencyAmplitudes = computeCorrelations(timeseries, testFrequencies, sampleRate)
  self.postMessage({ timeseries, frequencyAmplitudes })
}

function computeCorrelations(timeseries, testFrequencies, sampleRate) {
  // 2pi * frequency gives the appropriate period to sine.
  // timeseries index / sample_rate gives the appropriate time coordinate.
  const scaleFactor = (2 * Math.PI) / sampleRate

  // Amplitudes
  return testFrequencies.map(({ frequency }) => {
    // Represent a complex number as a length-2 array [ real, imaginary ].
    const accumulator = [0, 0]
    for (let t = 0; t < timeseries.length; t++) {
      accumulator[0] += timeseries[t] * Math.cos(scaleFactor * frequency * t)
      accumulator[1] += timeseries[t] * Math.sin(scaleFactor * frequency * t)
    }

    return accumulator
  })
}

export default {}
