declare module '*.worker.js' {
  // note how you load the file vs how file is loaded in the example
  class WebpackWorker extends Worker {
    constructor()
  }

  export default WebpackWorker
}
