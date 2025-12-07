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
      super(...args)
      let ctx = this

      const is_main_context = !window.master_fx

      if (is_main_context) {
        console.log(`Intercepted MAIN AudioContext (Seamless Reverb Mode)`)
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

      let panner = ctx.createStereoPanner()
      panner.pan.value = 0

      // Reverb setup
      let convolver = ctx.createConvolver()
      convolver.buffer = create_reverb_buffer(ctx)

      let reverb_gain = ctx.createGain()
      reverb_gain.gain.value = 0

      let master_gain = ctx.createGain()
      master_gain.gain.value = 1.0

      // --- 2. Routing ---

      // Dry Chain
      eq_low.connect(eq_mid)
      eq_mid.connect(eq_high)
      eq_high.connect(panner)
      panner.connect(master_gain)
      master_gain.connect(super.destination)

      // Wet chain is disconnected initially

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
        // Internal state to manage rapid clicking
        let reverb_state = {
          timer: null,
          is_connected: false,
        }

        window.master_fx = {
          context: ctx,
          nodes: {eq_low, eq_mid, eq_high, panner, reverb_gain, master_gain},
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
            panner.pan.setTargetAtTime(val, ctx.currentTime, 0.1)
          },
          splash_reverb: (duration = 3) => {
            let now = ctx.currentTime
            let fade_in_time = 0.1
            let fade_out_time = 0.5
            let target_volume = 0.5

            // 1. Clear any pending disconnects from previous clicks
            if (reverb_state.timer) {
              clearTimeout(reverb_state.timer)
              reverb_state.timer = null
            }

            // 2. Cancel audio scheduled values (stop any current fading out)
            reverb_gain.gain.cancelScheduledValues(now)

            // 3. Connect if not already connected
            if (!reverb_state.is_connected) {
              panner.connect(convolver)
              convolver.connect(reverb_gain)
              reverb_gain.connect(master_gain)

              // Start from 0 if fresh connection
              reverb_gain.gain.setValueAtTime(0, now)
              reverb_state.is_connected = true
              console.log(`Reverb Connected`)
            }
            else {
              // If already connected, we might be fading out.
              // We grab the current value implicitly by not setting it,
              // and ramping back up to target.
              // Note: WebAudio needs a starting anchor point for ramps usually,
              // but setValueAtTime(reverb_gain.gain.value) is unreliable during ramps.
              // So we just ramp immediately to target.
            }

            // 4. Ramp to "On" Volume (Reset the clock)
            // If it was already on, this keeps it on.
            // If it was fading out, this pulls it back up.
            reverb_gain.gain.linearRampToValueAtTime(target_volume, now + fade_in_time)

            // 5. Schedule the NEW fade out
            let fade_start = now + duration
            reverb_gain.gain.setValueAtTime(target_volume, fade_start)
            reverb_gain.gain.linearRampToValueAtTime(0, fade_start + fade_out_time)

            // 6. Set the new cleanup timer
            reverb_state.timer = setTimeout(() => {
              reverb_gain.disconnect()
              convolver.disconnect()
              reverb_state.is_connected = false
              console.log(`Reverb Disconnected (Clean)`)
            }, (duration + fade_out_time) * 1000 + 100) // Buffer ms for safety
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