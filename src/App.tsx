import React from 'react'
import { Piano } from './Components/Piano/Piano'
import { Tuner } from './Components/Tuner/Tuner'

import './App.scss'

const App: React.FC = () => {
  return (
    <div className="App">
      <Tuner />
      <Piano />
    </div>
  )
}

export default App
