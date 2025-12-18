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

  let scope_colors = App.register_setting(`Scope Color`,
    `Select scope color`, () => {
      App.show_scope_color_modal()
    })

  let colors = App.register_setting(`Toggle Colors`,
    `Enable or disable the color animation`, () => {
      App.toggle_colors()
    })

  let lines = App.register_setting(`Toggle Lines`,
    `Enable or disable the line numbers`, () => {
      App.toggle_lines()
    })

  let mirror = App.register_setting(`Toggle Mirror`,
    `Enable or disable the code execution reflection on the code`, () => {
      App.toggle_mirror()
    })

  body.appendChild(visual)
  body.appendChild(scope)
  body.appendChild(scope_colors)
  body.appendChild(colors)
  body.appendChild(lines)
  body.appendChild(mirror)
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