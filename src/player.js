App.play_running = false

App.reset_playing = () => {
  App.play_running = false
}

App.play_action = async (code = ``, force = false) => {
  if (App.play_running) {
    return
  }

  App.play_running = true
  let ready = await App.ensure_strudel_ready()

  if (!ready) {
    App.reset_playing()
    return
  }

  if (!code) {
    let code_input = App.get_input()
    code = code_input.value
  }

  if (!code) {
    App.reset_playing()
    return
  }

  if (!force && (code === App.last_code)) {
    App.reset_playing()
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

  App.reset_playing()
}

App.stop_action = () => {
  App.stop_strudel()
  App.stop_code_scroll()
  App.clear_draw_context()
  App.set_status(`Stopped`)
  App.set_song_context(``)
}

App.stop_strudel = () => {
  App.stop_color_cycle()
  App.clear_draw_context()
  App.scheduler.stop()
  App.clean_canvas()
}

App.strudel_update = async (code) => {
  if (!App.audio_started) {
    console.warn(`Audio not started yet. Call strudel_init() first.`)
    return
  }

  console.info(`Updating 💨`)
  await App.ensure_scope()

  App.set_tempo()
  const full_result = await App.run_eval(code)

  if (full_result.ok) {
    App.playing()
    return
  }

  if (App.do_partial_updates) {
    const partial_applied = await App.apply_partial_update(code)

    if (partial_applied) {
      return
    }
  }

  App.report_eval_failure(full_result.error)
}

App.playing = (extra) => {
  let msg = ``
  let matched_song = App.get_matched_song()

  if (matched_song) {
    msg = `Playing: ${App.underspace(matched_song.name)}`
    App.update_url(matched_song.name)
  }

  if (!msg) {
    msg = `Playing 🥁`
  }

  if (extra) {
    msg = `${msg} - ${extra}`.trim()
  }

  App.set_status(msg)
}