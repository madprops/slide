App.setup_status = () => {
  App.status_debouncer = App.create_debouncer((status) => {
    App.do_set_status(status)
  }, 300)
}

App.set_status = (status) => {
  if (!App.status_debouncer) {
    return
  }

  App.status_debouncer.call(status)
}

App.do_set_status = (status) => {
  let status_el = DOM.el(`#status`)
  status_el.innerText = status
}