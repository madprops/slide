App.create_alert_modal = () => {
  let modal = App.create_modal(`alert`)
  let title = DOM.el(`.modal-title`, modal)
  title.id = `modal-title-alert`
  let body = DOM.el(`.modal-body`, modal)
  body.id = `modal-body-alert`
  let message = DOM.create(`div`, ``, `modal-message-alert`)
  let copy = DOM.create(`button`)
  copy.textContent = `Copy`

  DOM.ev(copy, `click`, () => {
    App.copy_alert()
  })

  let buttons = DOM.create(`div`, `modal-buttons`)
  buttons.appendChild(copy)
  body.appendChild(message)
  body.appendChild(buttons)
}

App.show_alert = (msg, title = `Message`) => {
  App.check_create_modal(`alert`)
  DOM.el(`#modal-title-alert`).textContent = title
  DOM.el(`#modal-message-alert`).textContent = msg
  App.open_modal(`alert`)
}

App.copy_alert = () => {
  let text = DOM.el(`#modal-message-alert`).textContent
  navigator.clipboard.writeText(text)
  App.close_modal(`alert`)
}