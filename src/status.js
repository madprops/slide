App.beat_title = ``

App.setup_status = () => {
  App.status_debouncer = App.create_debouncer((status) => {
    App.do_set_status(status)
  }, 300)

  DOM.ev(`#status`, `click`, () => {
    App.ask_for_title()
  })
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

App.ask_for_title = () => {
  let ms = App.get_matched_song()

  if (ms) {
    return
  }

  let title = prompt(`Title of this beat`)

  if (!title) {
    return
  }

  App.beat_title = title.trim()
  App.update_url()

  if (App.is_playing) {
    App.playing()
  }
}