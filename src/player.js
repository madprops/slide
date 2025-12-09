App.is_playing = false
App.play_running = false

App.reset_playing = () => {
  App.play_running = false
}

App.play_action = async (code = ``, force = false) => {
  if (App.play_running) {
    return
  }

  App.play_running = true
  App.update_url()
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

  App.stop_status_watch()
  App.restart_code_scroll()
  App.last_code = code
  App.stor_save_code()
  App.clear_draw_context()
  App.start_color_cycle()
  App.clean_canvas()
  App.update_title()
  App.is_playing = true

  try {
    await App.strudel_update(code)
  }
  catch (e) {
    App.set_status(`Error: ${e.message}`)
  }

  App.reset_playing()
}

App.stop_action = () => {
  App.stop_status_watch()
  App.stop_strudel()
  App.stop_code_scroll()
  App.clear_draw_context()
  App.set_stop_status()
  App.set_song_context(``)
  App.is_playing = false
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
  let full_result = await App.run_eval(code)

  if (full_result.ok) {
    App.playing()
    return
  }

  if (App.do_partial_updates) {
    let partial_applied = await App.apply_partial_update(code)

    if (partial_applied) {
      return
    }
  }

  App.report_eval_failure(full_result.error)
}

App.playing = (extra) => {
  let msg = ``
  let ms = App.get_matched_song()

  if (ms) {
    msg = `Playing: ${ms.clean_name}`
    App.update_url(ms.name)
  }

  if (!msg) {
    if (App.beat_title) {
      msg = `Playing: ${App.beat_title}`
    }
    else {
      msg = `Playing 🥁`
    }

    App.update_url()
  }

  if (extra) {
    msg = `${msg} - ${extra}`.trim()
  }

  App.set_status(msg)
}

App.set_stop_status = () => {
  let ms = App.get_matched_song()

  if (ms) {
    App.set_status(`Stopped: ${ms.clean_name}`)
  }
  else {
    App.set_status(`Stopped`)
  }
}

App.load_last_code = () => {
  if (!App.last_code) {
    return
  }

  App.set_input(App.last_code)
}

App.load_code_from_query = () => {
  let query_params = new URLSearchParams(window.location.search)
  let requested_code = query_params.get(App.code_query_key)

  if (!requested_code) {
    return false
  }

  try {
    App.last_code = requested_code
    App.load_last_code()
    return true
  }
  catch (err) {
    App.set_status(`Failed to load song: ${err.message}`)
    console.error(`Failed to load song:`, err)
  }

  return false
}

App.set_cpm_from_query = () => {
  let query_params = App.get_query_params()
  let requested_cpm = query_params.get(App.cpm_query_key)

  if (requested_cpm) {
    let parsed_cpm = parseInt(requested_cpm, 10)

    if (Number.isFinite(parsed_cpm)) {
      App.update_tempo(parsed_cpm)
      App.set_tempo()
    }
  }
}

App.set_beat_title_from_query = () => {
  let query_params = App.get_query_params()
  let beat_title = query_params.get(App.beat_query_key)

  if (beat_title) {
    App.beat_title = beat_title
  }
}