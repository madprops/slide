App.start_keyboard = () => {
  DOM.ev(document, `keydown`, (e) => {
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
        App.show_sounds_context()
      }
    }
    else if (e.key === `2`) {
      if (e.ctrlKey) {
        App.show_banks_context()
      }
    }
    else if (e.key === `3`) {
      if (e.ctrlKey) {
        App.show_notes_context()
      }
    }
  })
}