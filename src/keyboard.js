App.start_keyboard = () => {
  DOM.ev(document, `keydown`, (e) => {
    if (e.key === `s`) {
      App.play_action()
      e.preventDefault()
    }
  })
}