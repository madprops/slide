App.beep_sound = () => {
  try {
    // Create AudioContext if it doesn't exist.  Use a global variable or a dedicated function
    // to manage the AudioContext lifecycle.
    let audio_ctx = App.get_audio_context()

    // Create oscillator and gain nodes
    let oscillator = audio_ctx.createOscillator()
    let gain_node = audio_ctx.createGain()

    // Make the sound more interesting
    oscillator.type = `triangle` // Or 'sawtooth', 'square' for different timbres

    // Modulate the frequency slightly for a richer sound.
    oscillator.frequency.setValueAtTime(440, audio_ctx.currentTime)
    oscillator.frequency.linearRampToValueAtTime(445, audio_ctx.currentTime + 0.1) // Slight detune

    //Control the Gain for a softer, more pleasant sound with a fade-out
    gain_node.gain.setValueAtTime(0.05, audio_ctx.currentTime) //Quieter initial volume.
    gain_node.gain.exponentialRampToValueAtTime(0.001, audio_ctx.currentTime + 0.2) //Fade out quickly

    // Connect the nodes
    oscillator.connect(gain_node)
    gain_node.connect(audio_ctx.destination)

    // Start and stop the oscillator
    oscillator.start()
    oscillator.stop(audio_ctx.currentTime + 0.2)

  }
  catch (err) {
    console.error(`Failed to play sound`, err)
  }
}

App.get_audio_context = () => {
  if (!App.audio_context) {
    try {
      App.audio_context = new (window.AudioContext || window.webkitAudioContext)()
    }
    catch (e) {
      console.error("Web Audio API is not supported in this browser")
      return null // Or handle the error appropriately
    }
  }
  return App.audio_context
}

App.add_reverb = (seconds) => {
  window.master_fx.splash_reverb(seconds)
}

App.set_panning = (value) => {
  window.master_fx.set_panning(value)
}

App.set_gain = (value) => {
  window.master_fx.set_volume(value)
}