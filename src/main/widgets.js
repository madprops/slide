App.setup_custom_numbers = () => {
  let containers = DOM.els(`.custom-number`)

  for (let container of containers) {
    let input = DOM.el(`input[type=text]`, container)
    let decrease = DOM.el(`.custom-number-decrease`, container)
    let increase = DOM.el(`.custom-number-increase`, container)

    DOM.ev(decrease, `click`, () => {
      input.value = parseInt(input.value) - 1
      input.dispatchEvent(new Event(`change`))
    })

    DOM.ev(increase, `click`, () => {
      input.value = parseInt(input.value) + 1
      input.dispatchEvent(new Event(`change`))
    })
  }
}