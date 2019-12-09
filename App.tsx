import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Piano } from './src/components/Piano/Piano'

// Roadmap
// Split into views and think up an actual UI

export default function App() {
  return (
    <View style={styles.container}>
      {/* <Tuner /> */}
      {/* <Metronome /> */}
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
