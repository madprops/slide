App.eq_range_min = -12
App.eq_range_max = 12

App.setup_eq = () => {
  App.stor_load_eq()
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
}