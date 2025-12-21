App.colors_enabled = true
App.border_color = `#444`

App.apply_color = (color) => {
  App.scope_color = color
  App.set_css_var(`theme-color`, color)
}

App.color_interface = (level) => {
  let color = App[`scope_click_color_${level}`]
  App.do_color_interface(color)
}

App.restore_interface_colors = () => {
  App.do_color_interface(App.border_color)
}

App.do_color_interface = (color) => {
  App.set_css_var(`border-color`, color)
}