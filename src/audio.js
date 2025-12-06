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
  // 1. Try to use the Intercepted Context (Strudel's context)
  if (window.master_fx && window.master_fx.context) {
    return window.master_fx.context
  }

  // 2. Fallback: If App.audio_context already exists (cached)
  if (App.audio_context) {
    return App.audio_context
  }

  // 3. Last Resort: Create new (Only if Strudel hasn't loaded yet)
  try {
    App.audio_context = new (AudioContext || window.webkitAudioContext)()
    return App.audio_context
  }
  catch (e) {
    console.error(`Web Audio API is not supported`)
    return null
  }
}

App.splash_reverb = (seconds) => {
  window.master_fx.splash_reverb(seconds)
}

App.set_panning = (value, delay = 0) => {
  window.master_fx.set_panning(value)

  if (delay > 0) {
    clearTimeout(App.panning_timeout)

    App.panning_timeout = setTimeout(() => {
      window.master_fx.set_panning(0)
    }, delay * 1000)
  }
}

App.set_gain = (value) => {
  window.master_fx.set_volume(value)
}

App.set_eq = (low, mid, high) => {
  window.master_fx.set_eq_freqs(low, mid, high)
}