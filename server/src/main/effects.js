App.eq_range_min = -12
App.eq_range_max = 12

App.setup_effects = () => {
  App.reset_effects()
  App.setup_eq()
  App.setup_reverb()
  App.setup_cutoff()
  App.setup_delay()
  App.setup_panning()
  App.check_effects()
}

App.check_eq_color = (el) => {
  let num = parseInt(el.value)
  el.classList.remove(`eq_negative`)
  el.classList.remove(`eq_positive`)

  if (num < 0) {
    el.classList.add(`eq_negative`)
  }
  else if (num > 0) {
    el.classList.add(`eq_positive`)
  }
}

App.check_eq_colors = () => {
  App.check_eq_color(DOM.el(`#eq-low`))
  App.check_eq_color(DOM.el(`#eq-mid`))
  App.check_eq_color(DOM.el(`#eq-high`))
}

App.setup_eq = () => {
  let low = DOM.el(`#eq-low`)
  let mid = DOM.el(`#eq-mid`)
  let high = DOM.el(`#eq-high`)

  if (App.eq) {
    low.value = App.eq.low || 0
    mid.value = App.eq.mid || 0
    high.value = App.eq.high || 0
  }

  function apply_eq() {
    let low_val = parseInt(low.value)
    let mid_val = parseInt(mid.value)
    let high_val = parseInt(high.value)
    App.set_eq(low_val, mid_val, high_val)
  }

  function increase(el, amount) {
    let value = parseInt(el.value)
    el.value = Math.min(App.eq_range_max, value + amount)
    App.check_eq_color(el)
    App.after_effect()
    apply_eq()
  }

  function decrease(el, amount) {
    let value = parseInt(el.value)
    el.value = Math.max(App.eq_range_min, value - amount)
    App.check_eq_color(el)
    App.after_effect()
    apply_eq()
  }

  function register(el) {
    let container = el.closest(`.custom-number`)

    DOM.ev(el, `change`, () => {
      let value = parseInt(el.value)

      if (value < App.eq_range_min) {
        el.value = App.eq_range_min
      }
      else if (value > App.eq_range_max) {
        el.value = App.eq_range_max
      }

      App.check_eq_color(el)
      apply_eq()
      App.after_effect()
    })

    DOM.ev(container, `mousedown`, (event) => {
      if (event.button === 1) {
        el.value = 0
        App.check_eq_color(el)
        apply_eq()
        el.blur()
        event.preventDefault()
      }
    })

    DOM.ev(container, `wheel`, (event) => {
      let amount = 1

      if (event.deltaY < 0) {
        if (event.shiftKey) {
          amount = 2
        }

        increase(el, amount)
      }
      else if (event.deltaY > 0) {
        if (event.shiftKey) {
          amount = 2
        }

        decrease(el, amount)
      }

      event.preventDefault()
    })

    App.check_eq_color(el)
  }

  register(low)
  register(mid)
  register(high)
}

App.check_eq = () => {
  DOM.el(`#eq-low`).value = App.eq.low
  DOM.el(`#eq-mid`).value = App.eq.mid
  DOM.el(`#eq-high`).value = App.eq.high
  App.check_eq_colors()
}

App.setup_reverb = () => {
  let el = DOM.el(`#reverb`)

  DOM.ev(el, `click`, () => {
    App.toggle_reverb()
  })

  App.check_reverb()
  App.after_effect()
}

App.setup_cutoff = () => {
  let el = DOM.el(`#cutoff`)

  DOM.ev(el, `click`, () => {
    App.toggle_cutoff()
  })

  App.check_cutoff()
  App.after_effect()
}

App.setup_delay = () => {
  let el = DOM.el(`#delay`)

  DOM.ev(el, `click`, () => {
    App.toggle_delay()
  })

  App.check_delay()
  App.after_effect()
}

App.setup_panning = () => {
  let el = DOM.el(`#panning`)

  DOM.ev(el, `click`, () => {
    App.toggle_panning()
  })

  App.check_panning()
  App.after_effect()
}

App.enable_effects = () => {
  DOM.show(App.get_effects())
}

App.disable_effects = () => {
  DOM.hide(App.get_effects())
}

App.check_effects = () => {
  if (App.effects_enabled) {
    App.enable_effects()
  }
  else {
    App.disable_effects()
  }
}

App.toggle_effects = () => {
  App.effects_enabled = !App.effects_enabled
  App.check_effects()
  App.stor_save_effects()
}

App.get_effects = () => {
  return DOM.el(`#effects`)
}

App.toggle_reverb = () => {
  App.reverb_enabled = !App.reverb_enabled
  App.check_reverb()
  App.stor_save_reverb()
}

App.check_reverb = () => {
  let el = DOM.el(`#reverb`)

  if (App.reverb_enabled) {
    el.classList.add(`active`)
  }
  else {
    el.classList.remove(`active`)
  }

  App.update_reverb()
}

App.toggle_panning = () => {
  App.panning_enabled = !App.panning_enabled
  App.check_panning()
  App.stor_save_panning()
}

App.check_panning = () => {
  let el = DOM.el(`#panning`)

  if (App.panning_enabled) {
    el.classList.add(`active`)
  }
  else {
    el.classList.remove(`active`)
  }

  App.update_panning()
}

App.update_effects = () => {
  App.update_eq()
  App.update_reverb()
  App.update_panning()
  App.update_cutoff()
  App.update_delay()
}

App.toggle_cutoff = () => {
  App.cutoff_enabled = !App.cutoff_enabled
  App.check_cutoff()
  App.stor_save_cutoff()
}

App.check_cutoff = () => {
  let el = DOM.el(`#cutoff`)

  if (App.cutoff_enabled) {
    el.classList.add(`active`)
  }
  else {
    el.classList.remove(`active`)
  }

  App.update_cutoff()
}

App.toggle_delay = () => {
  App.delay_enabled = !App.delay_enabled
  App.check_delay()
  App.stor_save_delay()
}

App.check_delay = () => {
  let el = DOM.el(`#delay`)

  if (App.delay_enabled) {
    el.classList.add(`active`)
  }
  else {
    el.classList.remove(`active`)
  }

  App.update_delay()
}

App.save_effects = () => {
  App.stor_save_eq()
  App.stor_save_reverb()
  App.stor_save_panning()
  App.stor_save_cutoff()
  App.stor_save_delay()
}

App.check_effects = () => {
  App.check_eq()
  App.check_reverb()
  App.check_panning()
  App.check_cutoff()
  App.check_delay()
}

App.after_effect = () => {
  // Empty for now
}

App.reset_effects = () => {
  App.eq = {low: 0, mid: 0, high: 0}
  App.reverb_enabled = false
  App.panning_enabled = false
  App.cutoff_enabled = false
  App.delay_enabled = false
}