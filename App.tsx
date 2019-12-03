import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Piano } from './src/components/Piano/Piano'
import { Metronome } from './src/components/Metronome/Metronome'
import { Tuner } from './src/components/Tuner/Tuner'

// Roadmap
// Split into views and think up an actual UI

export default function App() {
  return (
    <View style={styles.container}>
      <Tuner />
      <Metronome />
      <Piano />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
