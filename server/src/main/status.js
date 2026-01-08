App.beat_title = ``
App.status_enabled = true

App.setup_status = () => {
  App.status_debouncer = App.create_debouncer((status) => {
    App.do_set_status(status)
  }, 200)
}

App.set_status = (status) => {
  if (!App.status_debouncer) {
    return
  }

  App.status_debouncer.call(status)
}

App.do_set_status = (status) => {
  App.status = status
}

App.toggle_status = () => {
  App.status_enabled = !App.status_enabled
  App.stor_save_status()
}