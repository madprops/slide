App.colors_enabled = true

App.apply_color = (color) => {
  let code_input = App.get_input()
  let volume_value = DOM.el(`#volume-value`)
  let volume_slider = DOM.el(`#volume-slider`)
  let tempo_value = DOM.el(`#tempo-value`)
  let tempo_slider = DOM.el(`#tempo-slider`)
  let status_el = DOM.el(`#status`)
  let image_el = DOM.el(`#image`)
  let scope_container = DOM.el(`#scope-container`)
  let scope_canvas = DOM.el(`#scope-canvas`)

  if (code_input) {
    code_input.style.color = color
  }

  if (volume_value) {
    volume_value.style.color = color
  }

  if (volume_slider) {
    volume_slider.style.accentColor = color
  }

  if (tempo_value) {
    tempo_value.style.color = color
  }

  if (tempo_slider) {
    tempo_slider.style.accentColor = color
  }

  if (status_el) {
    status_el.style.color = color
  }

  if (image_el) {
    image_el.style.filter = `drop-shadow(0 0 0.15rem ${color})`
  }

  if (scope_container) {
    scope_container.style.borderColor = App.scope_border_color
    scope_container.style.boxShadow = `0 0 0.35rem ${App.scope_border_color}33`
  }

  if (scope_canvas) {
    scope_canvas.style.boxShadow = `inset 0 0 0.4rem ${App.scope_border_color}1a`
  }
}

App.start_color_cycle = () => {
  if (!App.colors_enabled) {
    return
  }

  if (App.color_cycle_timer) {
    return
  }

  App.color_index = 0
  App.apply_color(App.cycle_colors[0], 0)

  App.color_cycle_timer = setInterval(() => {
    App.color_index = (App.color_index + 1) % App.cycle_colors.length
    App.apply_color(App.cycle_colors[App.color_index], App.color_index)
  }, 3 * 1000)
}

App.stop_color_cycle = () => {
  if (App.color_cycle_timer) {
    clearInterval(App.color_cycle_timer)
    App.color_cycle_timer = undefined
  }

  App.color_index = 0
  let color = App.cycle_colors[0]
  let code_input = App.get_input()
  let volume_value = DOM.el(`#volume-value`)
  let volume_slider = DOM.el(`#volume-slider`)
  let tempo_value = DOM.el(`#tempo-value`)
  let tempo_slider = DOM.el(`#tempo-slider`)
  let status_el = DOM.el(`#status`)
  let image_el = DOM.el(`#image`)

  if (code_input) {
    code_input.style.color = color
  }

  if (volume_value) {
    volume_value.style.color = color
  }

  if (volume_slider) {
    volume_slider.style.accentColor = color
  }

  if (tempo_value) {
    tempo_value.style.color = color
  }

  if (tempo_slider) {
    tempo_slider.style.accentColor = color
  }

  if (status_el) {
    status_el.style.color = color
  }

  if (image_el) {
    image_el.style.filter = ``
  }
}

App.toggle_colors = () => {
  App.colors_enabled = !App.colors_enabled
  App.stor_save_colors()

  if (App.is_playing) {
    if (App.colors_enabled) {
      App.start_color_cycle()
    }
    else if (App.is_playing) {
      App.stop_color_cycle()
    }
  }
}