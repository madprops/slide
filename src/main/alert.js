App.create_alert_modal = () => {
  let modal = App.create_modal(`alert`)
  let title = DOM.el(`.modal-title`, modal)
  title.id = `modal-title-alert`
  let body = DOM.el(`.modal-body`, modal)
  body.id = `modal-body-alert`
}

App.show_alert = (msg, title = `Message`) => {
  App.check_create_modal(`alert`)
  DOM.el(`#modal-title-alert`).textContent = title
  DOM.el(`#modal-body-alert`).textContent = msg
  App.open_modal(`alert`)
}