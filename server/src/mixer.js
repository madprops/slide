(function() {
  let OriginalAudioContext = window.AudioContext || window.webkitAudioContext

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
      if (window.master_fx && window.master_fx.context) {
        return window.master_fx.context
      }

      super(...args)
      let ctx = this
      let is_main_context = !window.master_fx

      // --- 1. Create Nodes ---

      let filter_node = ctx.createBiquadFilter()
      filter_node.type = `lowpass`
      filter_node.frequency.value = 22050 // Start fully open
      filter_node.Q.value = 0

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

      let panner_node = ctx.createStereoPanner()
      panner_node.pan.value = 0

      // LFO for auto-panning
      let lfo = ctx.createOscillator()
      lfo.type = `sine`
      lfo.frequency.value = 0

      let lfo_gain = ctx.createGain()
      lfo_gain.gain.value = 0

      lfo.connect(lfo_gain)
      lfo_gain.connect(panner_node.pan)
      lfo.start()

      // Reverb Setup
      let convolver = ctx.createConvolver()
      convolver.buffer = create_reverb_buffer(ctx)

      let reverb_gain = ctx.createGain()
      reverb_gain.gain.value = 0

      // Delay Setup
      let delay_node = ctx.createDelay(5.0)
      delay_node.delayTime.value = 0.3 // Default 300ms

      let delay_feedback = ctx.createGain()
      delay_feedback.gain.value = 0.4 // Default 40% feedback

      // Feedback Tone (makes repeats darker/analog style)
      let delay_filter = ctx.createBiquadFilter()
      delay_filter.type = `lowpass`
      delay_filter.frequency.value = 3500

      let delay_wet_gain = ctx.createGain()
      delay_wet_gain.gain.value = 0

      let master_gain = ctx.createGain()
      master_gain.gain.value = 1.0

      let analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      let buffer_length = analyser.frequencyBinCount
      let data_array = new Uint8Array(buffer_length)

      // --- 2. Routing ---

      // Chain: Input -> Filter -> EQ -> Panning -> Master
      filter_node.connect(eq_low)
      eq_low.connect(eq_mid)
      eq_mid.connect(eq_high)
      eq_high.connect(panner_node)
      panner_node.connect(master_gain)

      // Master -> Analyser -> Speakers
      master_gain.connect(analyser)
      analyser.connect(super.destination)

      // Delay Internal Routing
      // 1. Send from Panner to Delay
      // 2. Delay -> Feedback -> Filter -> Delay (Loop)
      // 3. Delay -> WetGain -> Master

      // We connect these dynamically in toggle_delay to save CPU when unused,
      // or we can leave the loop connected but silence the WetGain.
      // For delay, leaving the loop connected is often safer to avoid clicking.

      delay_node.connect(delay_feedback)
      delay_feedback.connect(delay_filter)
      delay_filter.connect(delay_node) // Loop closed

      delay_node.connect(delay_wet_gain)
      delay_wet_gain.connect(master_gain)

      // --- 3. Compatibility ---

      Object.defineProperty(filter_node, `maxChannelCount`, {
        get: () => super.destination.maxChannelCount,
      })

      Object.defineProperty(ctx, `destination`, {
        get: () => filter_node,
        configurable: true,
      })

      // --- 4. Expose Controls ---

      if (is_main_context) {
        let reverb_state = {
          timer: null,
          is_connected: false,
        }

        let delay_state = {
          is_connected: false,
        }

        window.master_fx = {
          context: ctx,
          nodes: {
            filter: filter_node,
            eq_low,
            eq_mid,
            eq_high,
            panner: panner_node,
            reverb_gain,
            delay_wet_gain,
            delay_feedback,
            delay_node,
            master_gain,
            lfo,
            lfo_gain,
            analyser,
          },
          toggle_cutoff: (enable) => {
            let now = ctx.currentTime
            let ramp_time = 0.4

            filter_node.frequency.cancelScheduledValues(now)
            filter_node.Q.cancelScheduledValues(now)

            if (enable) {
              filter_node.frequency.setTargetAtTime(600, now, ramp_time)
              filter_node.Q.setTargetAtTime(10, now, ramp_time)
            }
            else {
              filter_node.frequency.setTargetAtTime(22050, now, ramp_time)
              filter_node.Q.setTargetAtTime(0, now, ramp_time)

              filter_node.frequency.setValueAtTime(22050, now + (ramp_time * 5))
              filter_node.Q.setValueAtTime(0, now + (ramp_time * 5))
            }
          },
          get_volume: () => {
            analyser.getByteTimeDomainData(data_array)
            let sum = 0

            for (let i = 0; i < buffer_length; i++) {
              let x = (data_array[i] - 128) / 128
              sum += x * x
            }

            return Math.sqrt(sum / buffer_length)
          },
          set_eq: (low_db, mid_db, high_db) => {
            let now = ctx.currentTime
            let ramp = 0.1

            if (low_db !== undefined) {
              eq_low.gain.cancelScheduledValues(now)
              eq_low.gain.setTargetAtTime(low_db, now, ramp)

              if (low_db === 0) {
                eq_low.gain.setValueAtTime(0, now + 0.5)
              }
            }

            if (mid_db !== undefined) {
              eq_mid.gain.cancelScheduledValues(now)
              eq_mid.gain.setTargetAtTime(mid_db, now, ramp)

              if (mid_db === 0) {
                eq_mid.gain.setValueAtTime(0, now + 0.5)
              }
            }

            if (high_db !== undefined) {
              eq_high.gain.cancelScheduledValues(now)
              eq_high.gain.setTargetAtTime(high_db, now, ramp)

              if (high_db === 0) {
                eq_high.gain.setValueAtTime(0, now + 0.5)
              }
            }
          },
          set_volume: (val) => {
            master_gain.gain.cancelScheduledValues(ctx.currentTime)
            master_gain.gain.setTargetAtTime(val, ctx.currentTime, 0.1)
          },
          set_panning: (val) => {
            panner_node.pan.cancelScheduledValues(ctx.currentTime)
            panner_node.pan.setTargetAtTime(val, ctx.currentTime + 0.02, 0.1)
          },
          set_auto_pan: (rate_hz, depth) => {
            let now = ctx.currentTime
            lfo.frequency.cancelScheduledValues(now)
            lfo_gain.gain.cancelScheduledValues(now)

            lfo.frequency.setTargetAtTime(rate_hz, now, 0.1)
            lfo_gain.gain.setTargetAtTime(depth, now, 0.1)
          },
          toggle_reverb: (enable, volume = 0.5, ramp = 0.1) => {
            let now = ctx.currentTime

            reverb_gain.gain.cancelScheduledValues(now)

            if (enable) {
              if (!reverb_state.is_connected) {
                panner_node.connect(convolver)
                convolver.connect(reverb_gain)
                reverb_gain.connect(master_gain)
                reverb_gain.gain.setValueAtTime(0, now)
                reverb_state.is_connected = true
              }

              reverb_gain.gain.setTargetAtTime(volume, now, ramp)
            }
            else {
              reverb_gain.gain.setTargetAtTime(0, now, ramp)
              let disconnect_delay = Math.max(500, ramp * 1000 * 5)

              setTimeout(() => {
                if (reverb_gain.gain.value < 0.01) {
                  reverb_gain.disconnect()
                  convolver.disconnect()
                  reverb_state.is_connected = false
                  reverb_gain.gain.setValueAtTime(0, ctx.currentTime)
                }
              }, disconnect_delay)
            }
          },
          splash_reverb: (duration = 3) => {
            if (reverb_state.timer) {
              clearTimeout(reverb_state.timer)
              reverb_state.timer = null
            }

            window.master_fx.toggle_reverb(true, 0.5, 0.2)

            reverb_state.timer = setTimeout(() => {
              window.master_fx.toggle_reverb(false, 0, 2.0)
            }, duration * 1000)
          },
          toggle_delay: (enable, volume = 0.5, time = 0.3, feedback = 0.4) => {
            let now = ctx.currentTime
            let ramp = 0.1

            delay_wet_gain.gain.cancelScheduledValues(now)
            delay_node.delayTime.setTargetAtTime(time, now, ramp)
            delay_feedback.gain.setTargetAtTime(feedback, now, ramp)

            if (enable) {
              if (!delay_state.is_connected) {
                panner_node.connect(delay_node)
                delay_state.is_connected = true
              }

              delay_wet_gain.gain.setTargetAtTime(volume, now, ramp)
            }
            else {
              delay_wet_gain.gain.setTargetAtTime(0, now, ramp)

              // We disconnect the input after a short while so the tails
              // can naturally decay without cutting off abruptly.
              setTimeout(() => {
                if (delay_wet_gain.gain.value < 0.01) {
                  try {
                    panner_node.disconnect(delay_node)
                    delay_state.is_connected = false
                  }
                  catch (e) {
                    // Ignore already disconnected errors
                  }
                }
              }, 2000)
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