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

App.show_settings = () => {
  let select = `Select`
  let toggle = `Toggle`
  let show_or_hide = `Show or hide`
  let enable_or_disable = `Enable or disable`

  let items = [
    {
      text: `${select} Theme`,
      action: () => {App.show_theme_modal()},
      title: `${select} the theme color`,
    },
    {
      text: `${select} Visual`,
      action: () => {App.open_visual_modal()},
      title: `${select} the background animation`,
    },
    {
      text: `${toggle} Scope`,
      action: () => {App.toggle_scope()},
      title: `${show_or_hide} the scope visualizer`,
    },
    {
      text: `${toggle} Status`,
      action: () => {App.toggle_status()},
      title: `${show_or_hide} the status bar`,
    },
    {
      text: `${toggle} Effects`,
      action: () => {App.toggle_effects()},
      title: `${show_or_hide} the effects controls`,
    },
    {
      text: `${toggle} Lines`,
      action: () => {App.toggle_lines()},
      title: `${enable_or_disable} the line numbers`,
    },
    {
      text: `${toggle} Mirror`,
      action: () => {App.toggle_mirror()},
      title: `${enable_or_disable} the playback reflection on the code`,
    },
    {
      text: `Connect GitHub`,
      action: () => {App.github_login()},
      title: `Connect your GitHub account to save snapshots as gists`,
    },
  ]

  App.show_items_modal(`settings`, {
    items,
    action: (item) => {
      item.action()
    },
  })
}