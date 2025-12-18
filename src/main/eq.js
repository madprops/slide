App.eq_range = 12

App.setup_eq = () => {
  let low = DOM.el(`#eq-low`)
  let mid = DOM.el(`#eq-mid`)
  let high = DOM.el(`#eq-high`)

  function apply_eq() {
    let low_val = parseInt(low.value)
    let mid_val = parseInt(mid.value)
    let high_val = parseInt(high.value)
    App.set_eq(low_val, mid_val, high_val)
  }

  function increase(el) {
    let value = parseInt(el.value)
    el.value = Math.min(App.eq_range, value + 1)
    apply_eq()
  }

  function decrease(el) {
    let value = parseInt(el.value)
    el.value = Math.max(-App.eq_range, value - 1)
    apply_eq()
  }

  function register(what) {
    DOM.ev(what, `change`, () => {
      apply_eq()
    })

    DOM.ev(what, `mousedown`, (event) => {
      if (event.button === 1) {
        event.target.value = 0
        apply_eq()
        event.target.blur()
        event.preventDefault()
      }
    })

    DOM.ev(what, `wheel`, (event) => {
      if (event.deltaY < 0) {
        increase(event.target)
      }
      else if (event.deltaY > 0) {
        decrease(event.target)
      }
    })
  }

  register(low)
  register(mid)
  register(high)
}