App.beat_title = ``
App.status_enabled = true

App.setup_status = () => {
  App.status_debouncer = App.create_debouncer((status) => {
    App.do_set_status(status)
  }, 200)

  let status = App.get_status()

  DOM.ev(status, `click`, () => {
    App.ask_for_title()
  })

  DOM.ev(status, `wheel`, (event) => {
    if (event.deltaY < 0) {
      status.scrollLeft -= 20
    }
    else if (event.deltaY > 0) {
      status.scrollLeft += 20
    }

    event.preventDefault()
  })

  App.check_status()
}

App.get_status = () => {
  return DOM.el(`#status`)
}

App.set_status = (status) => {
  if (!App.status_debouncer) {
    return
  }

  App.status_debouncer.call(status)
}

App.do_set_status = (status) => {
  let el = App.get_status()
  el.scrollTop = 0
  el.scrollLeft = 0
  el.innerText = status
}

App.get_status_height = () => {
  let el = DOM.el(`#status`)
  return App.get_el_height(el)
}

App.enable_status = () => {
  DOM.show(App.get_status())
}

App.disable_status = () => {
  DOM.hide(App.get_status())
}

App.check_status = () => {
  if (App.status_enabled) {
    App.enable_status()
  }
  else {
    App.disable_status()
  }
}

App.toggle_status = () => {
  App.status_enabled = !App.status_enabled
  App.check_status()
  App.stor_save_status()
}