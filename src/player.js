App.play_action = async (code = ``, force = false) => {
  let ready = await App.ensure_strudel_ready()

  if (!ready) {
    return
  }

  if (!code) {
    let code_input = App.get_input()
    code = code_input.value
  }

  if (!code) {
    return
  }

  if (!force && (code === App.last_code)) {
    return
  }

  App.stop_strudel()
  App.restart_code_scroll()
  App.last_code = code
  App.clear_draw_context()
  App.start_color_cycle()
  App.clean_canvas()

  try {
    await App.strudel_update(code)
  }
  catch (e) {
    App.set_status(`Error: ${e.message}`)
  }
}

App.stop_action = () => {
  if (!App.stop_strudel) {
    App.set_status(`Bundle not loaded. Cannot stop audio`)
    return
  }

  if (App.strudel_stop_status_watch) {
    App.strudel_stop_status_watch()
  }

  App.stop_strudel()
  App.stop_code_scroll()
  App.last_code = null
  App.clear_draw_context()
  App.set_status(`Stopped`)
  App.set_song_context()
}