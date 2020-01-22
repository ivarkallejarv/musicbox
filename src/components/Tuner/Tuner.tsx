import React from 'react'
import { toggleLiveInput } from './pitch-detect'

import './Tuner.scss'

export default function Tuner() {
  return (
    <div>
      <div>
        <button onClick={toggleLiveInput}>use live input</button>

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

      <h2 id="note-name">-</h2>

      <p>
        <span>frequency (Hz):</span>
        <span id="frequency">0</span>
      </p>
    </div>
  )
}
