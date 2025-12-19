(function() {
  let OriginalAudioContext = window.AudioContext || window.webkitAudioContext

  // Helper: Create a noise burst for reverb
  function create_reverb_buffer(ctx, duration = 3, decay = 2) {
    let rate = ctx.sampleRate
    let length = rate * duration
    let impulse = ctx.createBuffer(2, length, rate)
    let left = impulse.getChannelData(0)
    let right = impulse.getChannelData(1)

    for (let i = 0; i < length; i++) {
      let n = i / length
      let volume = Math.pow(1 - n, decay)
      left[i] = (Math.random() * 2 - 1) * volume
      right[i] = (Math.random() * 2 - 1) * volume
    }

    return impulse
  }

  class InterceptedAudioContext extends OriginalAudioContext {
    constructor(...args) {
      // 1. Singleton Check: If master_fx exists, return THAT context.
      // This forces Strudel (and everything else) to use the same audio graph.
      if (window.master_fx && window.master_fx.context) {
        console.log(`Returning existing MAIN AudioContext (Singleton)`)
        return window.master_fx.context
      }

      // 2. Otherwise, create the new context
      super(...args)
      let ctx = this

      let is_main_context = !window.master_fx

      if (is_main_context) {
        console.log(`Intercepted MAIN AudioContext (Seamless Reverb + LFO Mode + Metering)`)
      }
      else {
        console.log(`Intercepted SECONDARY AudioContext`)
      }

      // --- 1. Create Nodes ---

      let eq_low = ctx.createBiquadFilter()
      eq_low.type = `lowshelf`
      eq_low.frequency.value = 320
      eq_low.gain.value = 0

      let eq_mid = ctx.createBiquadFilter()
      eq_mid.type = `peaking`
      eq_mid.frequency.value = 1000
      eq_mid.Q.value = 1.0
      eq_mid.gain.value = 0

      let eq_high = ctx.createBiquadFilter()
      eq_high.type = `highshelf`
      eq_high.frequency.value = 4000
      eq_high.gain.value = 0

      App.panning = ctx.createStereoPanner()
      App.panning.pan.value = 0

      // --- LFO Panner Setup ---
      let lfo = ctx.createOscillator()
      lfo.type = `sine`
      lfo.frequency.value = 0

      let lfo_gain = ctx.createGain()
      lfo_gain.gain.value = 0

      lfo.connect(lfo_gain)
      lfo_gain.connect(App.panning.pan)
      lfo.start()

      // --- Reverb setup ---
      let convolver = ctx.createConvolver()
      convolver.buffer = create_reverb_buffer(ctx)

      let reverb_gain = ctx.createGain()
      reverb_gain.gain.value = 0

      let master_gain = ctx.createGain()
      master_gain.gain.value = 1.0

      // --- Analyser Setup (New) ---
      let analyser = ctx.createAnalyser()
      analyser.fftSize = 256 // Keep it small for performance
      let buffer_length = analyser.frequencyBinCount
      let data_array = new Uint8Array(buffer_length)

      // --- 2. Routing ---

      // Dry Chain
      eq_low.connect(eq_mid)
      eq_mid.connect(eq_high)
      eq_high.connect(App.panning)
      App.panning.connect(master_gain)

      // Route master to Analyser, then Analyser to Speakers
      master_gain.connect(analyser)
      analyser.connect(super.destination)

      // --- 3. Compatibility ---

      Object.defineProperty(eq_low, `maxChannelCount`, {
        get: () => super.destination.maxChannelCount,
      })

      Object.defineProperty(ctx, `destination`, {
        get: () => eq_low,
        configurable: true,
      })

      // --- 4. Expose Controls ---

      if (is_main_context) {
        let reverb_state = {
          timer: null,
          is_connected: false,
        }

        window.master_fx = {
          context: ctx,
          nodes: {
            eq_low,
            eq_mid,
            eq_high,
            panner: App.panning,
            reverb_gain,
            master_gain,
            lfo,
            lfo_gain,
            analyser,
          },
          // New Helper: Get Current Volume (0.0 to 1.0)
          get_volume: () => {
            analyser.getByteTimeDomainData(data_array)
            let sum = 0

            for (let i = 0; i < buffer_length; i++) {
              // Convert 128-center byte data to -1..1 float range
              let x = (data_array[i] - 128) / 128
              sum += x * x
            }

            // Return RMS (Root Mean Square)
            return Math.sqrt(sum / buffer_length)
          },
          set_eq: (low_db, mid_db, high_db) => {
            let now = ctx.currentTime
            let ramp = 0.1

            if (low_db !== undefined) {
              eq_low.gain.setTargetAtTime(low_db, now, ramp)
            }

            if (mid_db !== undefined) {
              eq_mid.gain.setTargetAtTime(mid_db, now, ramp)
            }

            if (high_db !== undefined) {
              eq_high.gain.setTargetAtTime(high_db, now, ramp)
            }
          },
          set_volume: (val) => {
            master_gain.gain.setTargetAtTime(val, ctx.currentTime, 0.1)
          },
          set_panning: (val) => {
            App.panning.pan.setTargetAtTime(val, ctx.currentTime + 0.02, 0.1)
          },
          set_auto_pan: (rate_hz, depth) => {
            let now = ctx.currentTime
            lfo.frequency.setTargetAtTime(rate_hz, now, 0.1)
            lfo_gain.gain.setTargetAtTime(depth, now, 0.1)
          },
          splash_reverb: (duration = 3) => {
            let now = ctx.currentTime
            let fade_in_time = 0.1
            let fade_out_time = 0.5
            let target_volume = 0.5

            if (reverb_state.timer) {
              clearTimeout(reverb_state.timer)
              reverb_state.timer = null
            }

            reverb_gain.gain.cancelScheduledValues(now)

            if (!reverb_state.is_connected) {
              App.panning.connect(convolver)
              convolver.connect(reverb_gain)
              reverb_gain.connect(master_gain)

              reverb_gain.gain.setValueAtTime(0, now)
              reverb_state.is_connected = true
            }

            reverb_gain.gain.linearRampToValueAtTime(target_volume, now + fade_in_time)

            let fade_start = now + duration
            reverb_gain.gain.setValueAtTime(target_volume, fade_start)
            reverb_gain.gain.linearRampToValueAtTime(0, fade_start + fade_out_time)

            reverb_state.timer = setTimeout(() => {
              reverb_gain.disconnect()
              convolver.disconnect()
              reverb_state.is_connected = false
            }, (duration + fade_out_time) * 1000 + 100)
          },
          toggle_reverb: (enable, volume = 0.5) => {
            let now = ctx.currentTime
            let ramp = 0.1

            if (enable) {
              if (!reverb_state.is_connected) {
                // Connect nodes if they aren't already
                App.panning.connect(convolver)
                convolver.connect(reverb_gain)
                reverb_gain.connect(master_gain)

                reverb_gain.gain.setValueAtTime(0, now)
                reverb_state.is_connected = true
              }

              reverb_gain.gain.setTargetAtTime(volume, now, ramp)
            }
            else {
              reverb_gain.gain.setTargetAtTime(0, now, ramp)

              // We wait for the ramp to finish before disconnecting to avoid clicks
              setTimeout(() => {
                // Check if it's still disabled to avoid race conditions
                if (reverb_gain.gain.value === 0) {
                  reverb_gain.disconnect()
                  convolver.disconnect()
                  reverb_state.is_connected = false
                }
              }, 500)
            }
          },
        }
      }
    }
  }

  window.AudioContext = InterceptedAudioContext

  if (window.webkitAudioContext) {
    window.webkitAudioContext = InterceptedAudioContext
  }
})()