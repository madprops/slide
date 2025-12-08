App.start_keyboard = () => {
  DOM.ev(document, `keydown`, (e) => {
    if (e.key === `s`) {
      App.play_action()
      e.preventDefault()
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