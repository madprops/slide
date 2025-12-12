App.is_playing = false
App.play_running = false

App.setup_player = () => {
  App.drawer = new Drawer((active_haps) => {
    let locations = []

    for (let hap of active_haps) {
      // 1. Check for PLURAL 'locations'
      if (hap.context && hap.context.locations) {
        // 2. Add all locations from this event to our master list
        locations.push(...hap.context.locations)
      }
      // Fallback for older versions or different event types
      else if (hap.context && hap.context.location) {
        locations.push(hap.context.location)
      }
    }

    if (App.editor) {
      // 3. Dispatch the list (which is now full of objects like {start: 1746, end: 1749})
      App.editor.dispatch({
        effects: App.set_highlight.of(locations),
      })
    }
  }, [0, 0])
}

App.reset_playing = () => {
  App.play_running = false
}

App.play_action = async (code = ``, force = false) => {
  console.info(`🔮 Play Action`)

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
    code = App.get_input_value()
  }

  if (!code) {
    App.last_code = ``
    App.current_song = ``
    App.reset_playing()
    App.stop_action()
    return
  }

  if (!force && (code === App.last_code)) {
    App.reset_playing()
    return
  }

  App.restart_code_scroll(false)
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
  console.info(`🔮 Stop Action`)
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
  App.set_song_tempo(code)
  App.update_url()
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
  let name = App.get_song_name(true)

  if (name) {
    msg = `Playing: ${name}`
  }

  if (!msg) {
    if (App.fetch_timer) {
      msg = `Playing 🤖`
    }
    else if (App.beat_title) {
      msg = `Playing: ${App.beat_title}`
    }
    else {
      msg = `Playing 🥁`
    }
  }

  if (extra) {
    msg = `${msg} - ${extra}`.trim()
  }

  App.set_status(msg)
}

App.set_stop_status = () => {
  let name = App.get_song_name(true)

  if (name) {
    App.set_status(`Stopped: ${name}`)
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

App.restart_code_scroll = (to_top = true) => {
  if (to_top) {
    App.scroll_input_to_top()
  }

  if (App.code_scroll_active) {
    App.defer_code_scroll(App.code_scroll_song_pause_ms)
    App.reset_code_scroll_for_content(App.code_scroll_song_pause_ms)
  }
}

// 1. Export a setup function to the global window object
// This allows your HTML/Flask templates to call it easily.
App.strudel_init = async () => {
  if (App.audio_started) {
    console.info(`Audio already initialized`)
    return
  }

  console.info(`Initializing Audio...`)

  try {
    console.info(`Loading scope...`)
    await App.ensure_scope()
    console.info(`Scope loaded`)

    // This must be called in response to a user interaction
    console.info(`Initializing audio context...`)
    await initAudio()

    // Enable mini-notation for strings
    strudelMini.miniAllStrings()

    // Load samples and sounds in parallel
    let ds = `https://raw.githubusercontent.com/felixroos/dough-samples/main`

    console.info(`Loading samples and soundfonts...`)

    await Promise.all([
      registerSynthSounds(),
      registerSoundfonts(),
      samples(`github:tidalcycles/dirt-samples`),
      samples(`${ds}/tidal-drum-machines.json`),
    ])

    App.audio_started = true
    App.apply_volume()
    console.info(`Audio Ready.`)

    if (App.code_to_play) {
      App.play_action(App.code_to_play)
      App.code_to_play = ``
    }
  }
  catch (err) {
    console.error(`Audio Failed:`, err)
    throw err
  }
}

App.run_eval = async (code) => {
  App.reset_eval_state()
  code = App.filter_code(code)
  App.set_input(code)

  try {
    await App.evaluate(code)

    if (!App.draw_started) {
      App.drawer.start(App.scheduler)
      App.draw_started = true
    }
  }
  catch (err) {
    return {ok: false, error: err}
  }

  if (App.has_error) {
    return {ok: false, error: new Error(App.last_eval_error || `Evaluation error`)}
  }

  return {ok: true}
}