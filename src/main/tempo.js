App.tempo = App.default_cpm
App.tempo_debounce_timer = undefined
App.tempo_commit_delay_ms = 500
App.min_tempo = 2
App.max_tempo = 120
App.tempo_step = 2
App.tempo_wheel_commit_timer = undefined
App.tempo_wheel_commit_delay_ms = 150

App.schedule_tempo_commit = (callback) => {
  if (typeof window === `undefined`) {
    callback()
    return
  }

  if (App.tempo_debounce_timer) {
    window.clearTimeout(App.tempo_debounce_timer)
  }

  App.tempo_debounce_timer = window.setTimeout(() => {
    App.tempo_debounce_timer = undefined
    callback()
  }, App.tempo_commit_delay_ms)
}

App.schedule_tempo_wheel_commit = () => {
  if (typeof window === `undefined`) {
    App.on_tempo_change(true, App.tempo)
    return
  }

  if (App.tempo_wheel_commit_timer) {
    window.clearTimeout(App.tempo_wheel_commit_timer)
  }

  App.tempo_wheel_commit_timer = window.setTimeout(() => {
    App.tempo_wheel_commit_timer = undefined
    App.on_tempo_change(true, App.tempo)
  }, App.tempo_wheel_commit_delay_ms)
}

App.get_tempo_slider = () => {
  return DOM.el(`#tempo-slider`)
}

App.get_tempo_value = () => {
  return DOM.el(`#tempo-value`)
}

App.refresh_tempo_ui = () => {
  let slider = App.get_tempo_slider()
  let display = App.get_tempo_value()

  if (slider) {
    slider.value = `${App.tempo}`
  }

  if (display) {
    display.textContent = parseInt(App.tempo)
  }
}

App.persist_tempo = () => {
  if (typeof window === `undefined`) {
    return
  }

  try {
    App.stor_save_tempo()
  }
  catch (err) {
    console.warn(`Failed to persist tempo`, err)
  }
}

App.update_tempo = (cpm) => {
  let next_value = parseInt(cpm, 10)

  if (!Number.isFinite(next_value)) {
    next_value = App.tempo
  }

  next_value = Math.round(next_value / App.tempo_step) * App.tempo_step
  next_value = Math.min(App.max_tempo, Math.max(App.min_tempo, next_value))
  App.tempo = next_value
  App.refresh_tempo_ui()
}

App.on_tempo_change = (is_final = false, value_override = undefined) => {
  let source_value = value_override

  if (source_value === null) {
    let slider = App.get_tempo_slider()
    source_value = slider?.value
  }

  App.update_tempo(source_value)

  if (is_final) {
    App.schedule_tempo_commit(() => {
      App.persist_tempo()
      App.set_tempo()
    })
  }
}

App.init_tempo_controls = () => {
  let slider = App.get_tempo_slider()
  let container = DOM.el(`#tempo-control`)
  let decrement_button = DOM.el(`#tempo-decrement`)
  let increment_button = DOM.el(`#tempo-increment`)
  let intended_button = DOM.el(`#tempo-intended`)

  if (!slider) {
    return
  }

  App.refresh_tempo_ui()
  App.persist_tempo()

  DOM.ev(slider, `input`, (event) => {
    App.update_tempo(event.target.value)
  })

  App.setup_slider(container, (slider) => {
    // Auxclick
    slider.value = App.default_cpm
    App.update_tempo(App.default_cpm)
    App.set_tempo()
  }, (value) => {
    // Wheel
    App.on_tempo_change(false, value)
    App.schedule_tempo_wheel_commit()
  })

  DOM.ev(container, `change`, () => {
    App.on_tempo_change(true)
  })

  let step_tempo = (direction) => {
    let next_value = App.tempo + (direction * App.tempo_step)
    App.on_tempo_change(true, next_value)
  }

  App.make_control_button(decrement_button, () => {
    step_tempo(-1)
  })

  App.make_control_button(increment_button, () => {
    step_tempo(1)
  })

  if (intended_button) {
    DOM.ev(intended_button, `click`, () => {
      App.set_song_tempo(App.last_code)
    })
  }

  App.remove_context(intended_button, () => {
    App.set_intended_tempo()
  })
}

App.set_tempo = () => {
  try {
    App.scheduler.setCps(App.tempo / 60)
  }
  catch (err) {
    console.debug(`Tempo will be applied when audio starts`, err)
  }
}

App.intended_cpm = (code) => {
  // 1. Helper to safely evaluate math strings like "120/4" or "0.5"
  let evaluate = (str) => {
    try {
      // strictly return the math result
      return Function(`"use strict"; return (${str})`)()
    }
    catch (e) {
      return null
    }
  }

  let intended_cpm = App.default_cpm // Default Strudel speed

  // 2. Regex patterns
  // We use [\d./*+ -]+ to capture complex math like "140/2" or "0.5*2"
  let cpm_match = code.match(/setcpm\(\s*([\d./*+ -]+)\s*\)/)
  let cps_match = code.match(/setcps\(\s*([\d./*+ -]+)\s*\)/)
  let bpm_match = code.match(/setbpm\(\s*([\d./*+ -]+)\s*\)/)

  // 3. Logic: Check specific formatters.
  // Note: This naive approach picks the first match found.
  // If a file has multiple setters, you might want to find the LAST match in the string.

  if (cpm_match) {
    let val = evaluate(cpm_match[1])
    if (val !== null) {
      intended_cpm = val
    }
  }
  else if (cps_match) {
    let val = evaluate(cps_match[1])
    if (val !== null) {
      intended_cpm = val * 60 // Convert CPS to CPM
    }
  }
  else if (bpm_match) {
    let val = evaluate(bpm_match[1])
    if (val !== null) {
      intended_cpm = val / 4 // Convert BPM to CPM (assuming /4)
    }
  }

  return intended_cpm
}

App.set_song_tempo = (code) => {
  App.tempo = App.intended_cpm(code)
  App.set_tempo()
  App.refresh_tempo_ui()
}

App.set_intended_tempo = () => {
  App.set_song_tempo(App.last_code)
}