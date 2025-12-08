App.start_keyboard = () => {
  DOM.ev(document, `keydown`, (e) => {
    if (e.key === `s`) {
      App.play_action()
      e.preventDefault()
    }
    else if (e.key === `Escape`) {
      App.close_current_modal()
      e.preventDefault()
    }
  })
}