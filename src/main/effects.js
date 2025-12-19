App.eq_range_min = -12
App.eq_range_max = 12
App.effects_enabled = true
App.reverb_enabled = false
App.eq_value = ``

App.setup_effects = () => {
  App.setup_eq()
  App.setup_reverb()
}

App.setup_eq = () => {
  let low = DOM.el(`#eq-low`)
  let mid = DOM.el(`#eq-mid`)
  let high = DOM.el(`#eq-high`)

  if (App.eq_value) {
    low.value = App.eq_value.low || 0
    mid.value = App.eq_value.mid || 0
    high.value = App.eq_value.high || 0
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
    apply_eq()
  }

  function decrease(el, amount) {
    let value = parseInt(el.value)
    el.value = Math.max(App.eq_range_min, value - amount)
    apply_eq()
  }

  function register(what) {
    let container = what.closest(`.custom-number`)

    DOM.ev(what, `change`, () => {
      let value = parseInt(what.value)

      if (value < App.eq_range_min) {
        what.value = App.eq_range_min
      }
      else if (value > App.eq_range_max) {
        what.value = App.eq_range_max
      }

      apply_eq()
    })

    DOM.ev(container, `mousedown`, (event) => {
      if (event.button === 1) {
        what.value = 0
        apply_eq()
        what.blur()
        event.preventDefault()
      }
    })

    DOM.ev(container, `wheel`, (event) => {
      let amount = 1

      if (event.deltaY < 0) {
        if (event.shiftKey) {
          amount = 2
        }

        increase(what, amount)
      }
      else if (event.deltaY > 0) {
        if (event.shiftKey) {
          amount = 2
        }

        decrease(what, amount)
      }

      event.preventDefault()
    })
  }

  register(low)
  register(mid)
  register(high)
  App.check_effects()
}

App.setup_reverb = () => {
  let el = DOM.el(`#reverb`)

  DOM.ev(el, `click`, () => {
    App.toggle_reverb()
  })

  App.check_reverb()
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