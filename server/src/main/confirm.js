App.create_confirm_modal = () => {
  let modal = App.create_modal(`confirm`)
  let title = DOM.el(`.modal-title`, modal)
  title.id = `modal-title-confirm`
  let body = DOM.el(`.modal-body`, modal)
  body.id = `modal-body-confirm`
  let message = DOM.create(`div`, ``, `modal-message-confirm`)
  let buttons = DOM.create(`div`, `modal-buttons`)

  let cancel_button = DOM.create(`button`, `modal-button`, `modal-button-confirm`)
  cancel_button.textContent = `Cancel`

  let ok_button = DOM.create(`button`, `modal-button`, `modal-button-confirm`)
  ok_button.textContent = `Ok`

  DOM.ev(cancel_button, `click`, () => {
    App.do_confirm_cancel_action()
  })

  DOM.ev(ok_button, `click`, () => {
    App.do_confirm_ok_action()
  })

  buttons.appendChild(cancel_button)
  buttons.appendChild(ok_button)
  body.appendChild(message)
  body.appendChild(buttons)
}

App.show_confirm = (args = {}) => {
  let def_args = {
    title: `Confirm`,
    message: ``,
    cancel_action: () => {},
    ok_action: () => {},
  }

  App.def_args(def_args, args)
  App.check_create_modal(`confirm`)
  let title = DOM.el(`#modal-title-confirm`)
  title.textContent = args.title
  App.confirm_ok_action = args.ok_action
  App.confirm_cancel_action = args.cancel_action
  let message = DOM.el(`#modal-message-confirm`)
  message.textContent = args.message

  if (args.message) {
    message.classList.add(`modal-text-filled`)
  }
  else {
    message.classList.remove(`modal-text-filled`)
  }

  App.open_modal(`confirm`)
}

App.do_confirm_cancel_action = () => {
  if (!App.confirm_cancel_action) {
    return
  }

  App.close_modal(`confirm`)
  App.confirm_cancel_action()
}

App.do_confirm_ok_action = () => {
  if (!App.confirm_ok_action) {
    return
  }

  App.close_modal(`confirm`)
  App.confirm_ok_action()
}