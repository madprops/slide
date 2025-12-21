App.volume = 100
App.volume_step = 1

App.setup_volume = () => {
  App.update_volume(App.volume)
}

App.get_volume_slider = () => {
  return DOM.el(`#volume-slider`)
}

App.get_volume_value = () => {
  return DOM.el(`#volume-value`)
}

App.read_volume_value = (input_el) => {
  if (!input_el) {
    return App.volume
  }

  let slider_value = input_el.valueAsNumber

  if (Number.isFinite(slider_value)) {
    return slider_value
  }

  let numeric_value = parseInt(input_el.value, 10)

  if (Number.isFinite(numeric_value)) {
    return numeric_value
  }

  return App.volume
}

App.refresh_volume_ui = () => {
  let slider = App.get_volume_slider()
  let display = App.get_volume_value()

  if (slider) {
    slider.value = `${App.volume}`
  }

  if (display) {
    display.innerText = App.volume
  }
}

App.apply_volume = () => {
  if (!App.audio_started) {
    return
  }

  try {
    let vol = App.volume / 100
    App.set_gain(vol)
  }
  catch (err) {
    console.error(`Failed to apply volume`, err)
  }
}

App.update_volume = (percent) => {
  let next_value = Number(percent)

  if (!Number.isFinite(next_value)) {
    next_value = App.volume
  }

  next_value = Math.min(100, Math.max(0, next_value))

  if (App.volume === next_value) {
    return
  }

  App.volume = next_value
  App.refresh_volume_ui()
  App.stor_save_volume()
  App.apply_volume()
}

App.init_volume_controls = () => {
  let slider = App.get_volume_slider()
  let container = DOM.el(`#volume-control`)
  let decrement_button = DOM.el(`#volume-decrement`)
  let increment_button = DOM.el(`#volume-increment`)

  if (!slider) {
    return
  }

  App.refresh_volume_ui()
  App.stor_save_volume()

  DOM.ev(slider, `input`, (event) => {
    App.update_volume(App.read_volume_value(event.target))
  })

  let step_volume = (direction) => {
    App.update_volume(App.volume + (direction * App.volume_step))
  }

  App.make_control_button(decrement_button, () => {
    step_volume(-1)
  })

  App.make_control_button(increment_button, () => {
    step_volume(1)
  })

  App.setup_slider(container, () => {
    App.update_volume(50)
  }, () => {
    App.update_volume(App.read_volume_value(slider))
  })
}