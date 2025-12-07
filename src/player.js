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
  App.stop_strudel()
  App.stop_code_scroll()
  App.last_code = null
  App.clear_draw_context()
  App.set_status(`Stopped`)
  App.set_song_context()
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

  for (let name in App.song_cache) {
    let cache = App.song_cache[name]

    if (cache.filtered === App.last_code) {
      msg = `Playing: ${App.underspace(cache.name)}`
      App.update_song_query_param(cache.name)
      break
    }
  }

  if (!msg) {
    msg = `Playing 🥁`
  }

  if (extra) {
    msg = `${msg} - ${extra}`.trim()
  }

  App.set_status(msg)
}