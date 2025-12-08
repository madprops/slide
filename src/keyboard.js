App.keyboard_popup_delay = 5 * 1000
App.max_keboard_buffer = 25

App.start_keyboard = () => {
  let input_buffer = []

  DOM.ev(document, `keydown`, (e) => {
    let now = Date.now()

    if (e.key.length === 1) {
      input_buffer.push({char: e.key, time: now})

      if (input_buffer.length > App.max_keboard_buffer) {
        input_buffer.shift()
      }
    }

    input_buffer = input_buffer.filter((item) => {
      return (now - item.time) < App.keyboard_popup_delay
    })

    let recent_text = input_buffer.map((item) => item.char).join(``)

    if (recent_text.endsWith(`sound("`)) {
      input_buffer = []
    }
    else if (recent_text.endsWith(`bank("`)) {
      setTimeout(() => {
        App.show_bank_context()
      }, 10)

      input_buffer = []
    }

    if (e.key === `s`) {
      if (e.ctrlKey) {
        e.preventDefault()
        App.play_action()
      }
    }
    else if (e.key === `Escape`) {
      e.preventDefault()

      if (NeedContext.open) {
        return
      }

      if (App.modal_open()) {
        App.close_current_modal()
      }
      else {
        App.stop_action()
      }
    }
    else if (e.key === `Backspace`) {
      input_buffer.pop()
    }
    else if (e.key === `1`) {
      if (e.ctrlKey) {
        App.show_sound_context()
      }
    }
    else if (e.key === `2`) {
      if (e.ctrlKey) {
        App.show_bank_context()
      }
    }
    else if (e.key === `3`) {
      if (e.ctrlKey) {
        App.show_note_context()
      }
    }
  })
}