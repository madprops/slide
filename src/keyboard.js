App.keyboard_popup_delay = 5 * 1000

App.start_keyboard = () => {
  let input_buffer = []

  DOM.ev(document, `keydown`, (e) => {
    let now = Date.now()

    // Add printable characters to buffer
    if ((e.key.length === 1)) {
      input_buffer.push({char: e.key, time: now})
    }

    // Keep only keys pressed in the last 3000ms
    input_buffer = input_buffer.filter((item) => {
      return ((now - item.time) < App.keyboard_popup_delay)
    })

    let recent_text = input_buffer.map((item) => item.char).join(``)

    if (recent_text.endsWith(`sound(`)) {
      App.show_sound_context(e)
      input_buffer = []
    }
    else if (recent_text.endsWith(`bank(`)) {
      App.show_bank_context(e)
      input_buffer = []
    }

    if (e.key === `s`) {
      if (e.ctrlKey) {
        App.play_action()
        e.preventDefault()
      }
    }
    else if (e.key === `Escape`) {

      if (App.modal_open()) {
        App.close_current_modal()
      }
      else {
        App.stop_action()
      }

      e.preventDefault()
    }
  })
}