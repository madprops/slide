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
    clearInterval(App.panning_interval)

    let step = value / (delay * 1000 / 50) // Calculate step size for 50ms intervals
    let current_value = value

    App.panning_interval = setInterval(() => {
      current_value -= step

      if (Math.abs(current_value) <= Math.abs(step)) {
        window.master_fx.set_panning(0)
        clearInterval(App.panning_interval)
      }
      else {
        window.master_fx.set_panning(current_value)
      }
    }, 50)
  }
}

App.get_panning = () => {
  return App.panning.pan.value
}

App.set_gain = (value) => {
  window.master_fx.set_volume(value)
}

App.set_eq = (low, mid, high) => {
  window.master_fx.set_eq_freqs(low, mid, high)
}

// Rate: Speed in Hz (e.g., 0.5 is once every 2 seconds)
// Depth: How far to pan (0 to 1). 1 = Full Left/Right swing
App.start_auto_pan = (rate = 2, depth = 0.8) => {
  window.master_fx.set_auto_pan(rate, depth)
}

App.stop_auto_pan = () => {
  // Smoothly fade out the LFO depth to 0
  window.master_fx.set_auto_pan(0, 0)
}

App.spin_panning = (duration_ms = 2000) => {
  // Start spinning fast (4hz) with full depth
  App.start_auto_pan(4, 1.0)

  setTimeout(() => {
    App.stop_auto_pan()
  }, duration_ms)
}

App.get_raw_volume = () => {
  return window.master_fx?.get_volume() || 0
}