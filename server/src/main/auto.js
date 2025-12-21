App.auto_delay = 5
App.auto_endpoint = `/status`
App.fetch_cancelled = false

App.setup_auto = () => {
  let auto_start = DOM.el(`#auto-start`)

  if (auto_start) {
    DOM.ev(auto_start, `click`, () => {
      let input = DOM.el(`#auto-input`)

      if (input) {
        App.start_auto(input.value)
      }
    })
  }

  let auto_stop = DOM.el(`#auto-stop`)

  if (auto_stop) {
    DOM.ev(auto_stop, `click`, () => {
      App.stop_auto()
    })
  }

  let auto_default = DOM.el(`#auto-default`)

  if (auto_default) {
    DOM.ev(auto_default, `click`, () => {
      App.start_auto(`/status`)
    })
  }

  let auto_input = DOM.el(`#auto-input`)

  if (auto_input) {
    DOM.ev(auto_input, `keydown`, (event) => {
      if (event.key === `Enter`) {
        event.preventDefault()
        let input = DOM.el(`#auto-input`)

        if (input) {
          App.start_auto(input.value)
        }
      }
    })
  }

  let auto_delay_select = DOM.el(`#auto-delay`)

  if (auto_delay_select) {
    DOM.ev(auto_delay_select, `change`, (event) => {
      App.auto_delay = parseInt(event.target.value, 10)
      App.stor_save_auto_delay()

      // Restart interval if it's currently runni\ng
      if (App.fetch_timer) {
        App.fetch_status()
      }
    })
  }
}

App.create_auto_modal = () => {
  let modal = App.create_modal(`auto`)
  let title = DOM.el(`.modal-title`, modal)
  title.textContent = `Auto Mode`
  let body = DOM.el(`.modal-body`, modal)
  body.id = `modal-body-auto`
  let info = DOM.create(`div`, ``, `auto-info`)
  info.textContent = `Code will be fetched periodically`
  let select = DOM.create(`select`, `modal-select`, `auto-delay`)

  select.innerHTML = `
    <option value="1">1 second</option>
    <option value="5" selected>5 seconds</option>
    <option value="10">10 seconds</option>
    <option value="30">30 seconds</option>
    <option value="60">1 minute</option>
    <option value="300">5 minutes</option>
    <option value="600">10 minutes</option>
    <option value="900">15 minutes</option>
    <option value="1200">20 minutes</option>
    <option value="1800">30 minutes</option>
    <option value="3600">1 hour</option>
  `

  let input = DOM.create(`input`, ``, `auto-input`)
  input.classList.add(`modal-input`)
  input.placeholder = `Endpoint URL`
  let buttons = DOM.create(`div`, `modal-buttons`, `auto-buttons`)

  buttons.innerHTML = `
    <button id="auto-default">Default</button>
    <button id="auto-stop">Stop</button>
    <button id="auto-start">Start</button>
  `

  body.appendChild(info)
  body.appendChild(select)
  body.appendChild(input)
  body.appendChild(buttons)
  App.setup_auto()
}

App.show_auto = () => {
  App.open_modal(`auto`)
  DOM.el(`#auto-delay`).value = App.auto_delay
  DOM.el(`#auto-input`).value = App.auto_endpoint

  if (App.fetch_timer) {
    DOM.hide(`#auto-start`)
    DOM.show(`#auto-stop`)
  }
  else {
    DOM.show(`#auto-start`)
    DOM.hide(`#auto-stop`)
  }
}

App.start_auto = async (endpoint) => {
  App.close_modal(`auto`)

  if (!endpoint || !endpoint.trim()) {
    App.set_status(`Invalid endpoint`)
    return
  }

  App.auto_endpoint = endpoint.trim()
  App.stor_save_auto_endpoint()
  App.fetch_status()
}

App.fetch_status_code = async () => {
  const response = await fetch(App.auto_endpoint, {cache: `no-store`})

  if (!response.ok) {
    throw new Error(`Status endpoint returned ${response.status}`)
  }

  return response.text()
}

App.fetch_status = () => {
  if (!App.auto_delay || (App.auto_delay <= 0)) {
    console.error(`Provide a fetch interval in seconds greater than zero`)
    return
  }

  App.fetch_cancelled = false
  let interval_ms = App.auto_delay * 1000

  let fetch_status = async () => {
    console.info(`🤖 Fetching auto code`)

    if (App.fetch_in_flight) {
      return
    }

    App.fetch_in_flight = true

    try {
      let code = await App.fetch_status_code()

      if (App.fetch_cancelled) {
        console.info(`Status watch was cancelled, skipping play action`)
        return
      }

      if (!code) {
        return
      }

      code = code.trim()

      if (!code) {
        return
      }

      await App.play_action(code, true)
    }
    catch (err) {
      console.error(`Failed to update Strudel status`, err)
    }
    finally {
      App.fetch_in_flight = false
    }
  }

  App.stop_auto(false) // Don't set cancelled flag for restart
  fetch_status()

  App.fetch_timer = setInterval(() => {
    fetch_status()
  }, interval_ms)

  console.info(`Interval started.`)
}

App.stop_auto = (set_cancelled = true) => {
  App.close_modal(`auto`)

  if (!App.fetch_timer) {
    return
  }

  console.info(`Interval cleared 🖐`)
  clearInterval(App.fetch_timer)
  App.fetch_timer = undefined

  if (set_cancelled) {
    App.fetch_cancelled = true
  }
}