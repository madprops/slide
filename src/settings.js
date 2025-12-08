App.create_settings_modal = () => {
  let modal = App.create_modal(`settings`)
  let title = DOM.el(`.modal-title`, modal)
  title.textContent = `Settings`
  let body = DOM.el(`.modal-body`, modal)

  let visual = App.register_setting(`Select Visual`,
    `Change the background animation`, () => {
    App.open_visual_modal()
  })

  let scope = App.register_setting(`Toggle Scope`,
    `Show or hide the scope visualizer`, () => {
    App.toggle_scope()
  })

  let colors = App.register_setting(`Toggle Colors`,
    `Enable or disable the color animation`, () => {
    App.toggle_colors()
  })

  body.appendChild(visual)
  body.appendChild(scope)
  body.appendChild(colors)
}

App.register_setting = (text, title, action) => {
  let el = DOM.create(`button`)
  el.textContent = text
  el.title = title

  DOM.ev(el, `click`, () => {
    action()
    App.close_modal(`settings`)
  })

  return el
}

App.open_settings_modal = () => {
  App.open_modal(`settings`)
}