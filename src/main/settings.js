App.create_settings_modal = () => {
  let modal = App.create_list_modal(`settings`)
  let title = DOM.el(`.modal-title`, modal)
  title.textContent = `Settings`
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
  let items = [
    {
      text: `Select Theme`,
      action: () => {App.show_theme_modal()},
      title: `Select theme color`,
    },
    {
      text: `Select Visual`,
      action: () => {App.open_visual_modal()},
      title: `Change the background animation`,
    },
    {
      text: `Toggle Scope`,
      action: () => {App.toggle_scope()},
      title: `Show or hide the scope visualizer`,
    },
    {
      text: `Toggle Status`,
      action: () => {App.toggle_status()},
      title: `Show or hide the status bar`,
    },
    {
      text: `Toggle Lines`,
      action: () => {App.toggle_lines()},
      title: `Enable or disable the line numbers`,
    },
    {
      text: `Toggle Mirror`,
      action: () => {App.toggle_mirror()},
      title: `Enable or disable the code execution reflection on the code`,
    },
  ]

  App.show_items_modal(`settings`, {
    items,
    action: (item) => {
      item.action()
      App.close_modal(`settings`)
    },
  })
}