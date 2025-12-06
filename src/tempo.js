App.tempo = App.default_cpm
App.tempo_debounce_timer = undefined
App.tempo_commit_delay_ms = 500
App.min_tempo = 20
App.max_tempo = 120
App.tempo_step = 5
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
    display.textContent = `${App.tempo} cpm`
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

      if (App.current_song) {
        App.update_song_query_param(App.current_song)
      }

      App.set_tempo()
    })
  }
}

App.init_tempo_controls = () => {
  let slider = App.get_tempo_slider()
  let container = DOM.el(`#tempo-control`)
  let decrement_button = DOM.el(`#tempo-decrement`)
  let increment_button = DOM.el(`#tempo-increment`)

  if (!slider) {
    return
  }

  App.refresh_tempo_ui()
  App.persist_tempo()

  DOM.ev(slider, `input`, (event) => {
    App.update_tempo(event.target.value)
  })

  DOM.ev(container, `auxclick`, (event) => {
    if (event.button === 1) {
      slider.value = App.default_cpm
      App.update_tempo(App.default_cpm)
      App.set_tempo()
    }
  })

  DOM.ev(container, `wheel`, (event) => {
    event.preventDefault()

    if (!slider) {
      return
    }

    let slider_step = parseInt(slider.step, 10)

    if (!Number.isFinite(slider_step) || (slider_step <= 0)) {
      slider_step = App.tempo_step
    }

    let current_value = slider.valueAsNumber

    if (!Number.isFinite(current_value)) {
      current_value = App.tempo
    }

    if (event.deltaY < 0) {
      current_value += slider_step
    }
    else if (event.deltaY > 0) {
      current_value -= slider_step
    }
    else {
      return
    }

    App.on_tempo_change(false, current_value)
    App.schedule_tempo_wheel_commit()
  }, {passive: false})

  DOM.ev(container, `change`, () => {
    App.on_tempo_change(true)
  })

  let step_tempo = (direction) => {
    let next_value = App.tempo + (direction * App.tempo_step)
    App.on_tempo_change(true, next_value)
  }

  if (decrement_button) {
    DOM.ev(decrement_button, `click`, () => {
      step_tempo(-1)
    })
  }

  if (increment_button) {
    DOM.ev(increment_button, `click`, () => {
      step_tempo(1)
    })
  }
}