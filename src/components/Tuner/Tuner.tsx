import React, { useEffect } from 'react'
import { toggleLiveInput } from './pitch-detect'

import './Tuner.scss'

export default function Tuner() {
  useEffect(() => {
    toggleLiveInput()
  })

  return (
    <div>
      <button onClick={toggleLiveInput}>Click me</button>
      <div id="detector" className="vague">
        <div className="pitch">
          <span id="pitch">--</span>Hz
        </div>
        <div className="note">
          <span id="note">--</span>
        </div>
        <div id="detune">
          <span id="detune_amt">--</span>
          <span id="flat">cents &#9837;</span>
          <span id="sharp">cents &#9839;</span>
        </div>
      </div>
    </div>
  )
}
