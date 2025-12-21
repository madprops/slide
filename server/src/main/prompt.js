App.create_prompt_modal = () => {
  let modal = App.create_modal(`prompt`)
  let title = DOM.el(`.modal-title`, modal)
  title.id = `modal-title-prompt`
  let body = DOM.el(`.modal-body`, modal)
  body.id = `modal-body-prompt`
  let input = DOM.create(`input`, `modal-input`, `modal-input-prompt`)

  DOM.ev(input, `keydown`, (event) => {
    if (event.key === `Enter`) {
      App.do_prompt_action()
    }
  })

  let buttons = DOM.create(`div`, `modal-buttons`)

  let cancel_button = DOM.create(`button`, `modal-button`, `modal-button-prompt`)
  cancel_button.textContent = `Cancel`

  let ok_button = DOM.create(`button`, `modal-button`, `modal-button-prompt`)
  ok_button.textContent = `Ok`

  DOM.ev(cancel_button, `click`, () => {
    App.close_modal(`prompt`)
  })

  DOM.ev(ok_button, `click`, () => {
    App.do_prompt_action()
  })

  buttons.appendChild(cancel_button)
  buttons.appendChild(ok_button)
  body.appendChild(input)
  body.appendChild(buttons)
}

App.show_prompt = (args = {}) => {
  let def_args = {
    title: `Enter Text`,
    placeholder: `Text`,
    value: ``,
  }

  App.def_args(def_args, args)
  App.check_create_modal(`prompt`)
  let title_el = DOM.el(`#modal-title-prompt`)
  title_el.textContent = args.title
  let input = DOM.el(`#modal-input-prompt`)
  input.placeholder = args.placeholder
  input.value = args.value
  App.prompt_action = args.action
  App.open_modal(`prompt`)
  input.focus()
}

App.do_prompt_action = () => {
  if (!App.prompt_action) {
    return
  }

  let input = DOM.el(`#modal-input-prompt`)
  let text = input.value
  App.close_modal(`prompt`)
  App.prompt_action(text)
}