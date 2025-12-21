import * as strudelMini from "@strudel/mini"
import {aliasBank} from "@strudel/webaudio"

App.play_state = `stopped`
App.play_running = false
App.last_playing = ``

App.setup_player = () => {
  App.setup_drawer()
}

App.reset_playing = () => {
  App.play_running = false
}

App.play_action = async (code = ``, force = false, args = {}) => {
  console.info(`🔮 Play Action`)

  let def_args = {
    // Empty for now
  }

  App.def_args(def_args, args)

  if (App.play_running) {
    return
  }

  App.play_running = true

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
  App.stor_save_code()
  App.clear_draw_context()
  App.update_title()

  try {
    await App.strudel_update(code)
    await App.resume_audio()
    App.play_state = `playing`
    App.update_effects()
    App.update_url()
  }
  catch (e) {
    App.set_status(`Error: ${e.message}`)
  }

  App.reset_playing()
}

App.stop_action = () => {
  console.info(`🔮 Stop Action`)
  App.play_state = `stopped`
  App.stop_strudel()
  App.stop_code_scroll()
  App.clear_draw_context()
  App.set_song_context(``)
  App.suspend_audio()
  App.playing()
}

App.stop_strudel = async () => {
  // 1. Activate the Zombie Canvas Guard
  // This watches for canvases created by late-resolving async library code
  App.clear_draw_context()
  App.scheduler.stop()
  await App.scheduler.setPattern(null)

  if (window.clearHydra) {
    await window.clearHydra()

    try {
      window.hush()
    }
    catch (err) {
      // Hushn't
    }
  }

  App.stop_drawer()
  App.clean_mirror()
}

App.pause_action = () => {
  console.info(`🔮 Pause Action`)
  App.play_state = `paused`
  App.pause_strudel()
  App.stop_code_scroll()
}

App.pause_strudel = () => {
  App.scheduler.pause()
  App.stop_drawer()
}

App.strudel_update = async (code) => {
  await App.init_player()

  if (!App.audio_started) {
    console.warn(`Audio not started yet. Call init_player() first.`)
    return
  }

  console.info(`Updating 💨`)
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
  App.set_play_status(extra)
}

App.set_play_status = (extra) => {
  let msg = ``
  let song_name = App.get_song_name(true)

  msg = App.cond([
    [() => App.beat_title, App.beat_title],
    [() => song_name, song_name],
    [true, `Untitled`],
  ])

  App.last_playing = msg

  if (extra) {
    msg = `${msg} - ${extra}`.trim()
  }

  App.set_status(msg)
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

App.init_player = async () => {
  if (App.audio_started) {
    console.info(`Audio already initialized`)
    return
  }

  console.info(`Initializing Audio...`)

  try {
    await App.setup_eval()
    await initAudio()

    strudelMini.miniAllStrings()
    let sd = `/samples`

    await registerSynthSounds(),
    await registerSoundfonts(),
    await samples(`${sd}/tidal-drum-machines.json`),
    await samples(`${sd}/piano.json`),
    await samples(`${sd}/Dirt-Samples.json`),
    await samples(`${sd}/vcsl.json`),
    await samples(`${sd}/mridangam.json`),
    samples(`${sd}/strudel.json`),
    aliasBank(`${sd}/tidal-drum-machines-alias.json`)

    App.audio_started = true
    App.apply_volume()
    App.init_scope()
    console.info(`Audio Ready.`)
    App.playing()
  }
  catch (err) {
    console.error(`Audio Failed:`, err)
    throw err
  }
}

App.run_eval = async (code) => {
  App.reset_eval_state()
  code = App.filter_code(code)
  App.last_code = code
  App.set_input(code)

  try {
    App.pattern = await App.evaluate(code)

    if (App.pattern) {
      if (App.is_stopped()) {
        let now = App.scheduler.now()
        let cps = App.scheduler.cps || 1
        App.seek_offset = now * cps
      }

      App.start_drawer()
    }
    else {
      App.seek_offset = 0
      App.stop_action()
    }
  }
  catch (err) {
    App.seek_offset = 0
    App.stop_action()
    return {ok: false, error: err}
  }

  if (App.has_error) {
    return {ok: false, error: new Error(App.last_eval_error || `Evaluation error`)}
  }

  return {ok: true}
}

App.rewind_player = (seconds = 1) => {
  let current_cps = App.scheduler.cps || 1
  let cycles_to_shift = seconds * current_cps

  App.seek_offset += cycles_to_shift
  App.update_playback()
}

App.forward_player = (seconds = 1) => {
  let current_cps = App.scheduler.cps || 1
  let cycles_to_shift = seconds * current_cps

  App.seek_offset -= cycles_to_shift
  App.update_playback()
}

App.update_playback = () => {
  if (App.pattern) {
    App.scheduler.setPattern(App.pattern.late(App.seek_offset))
  }
}

App.is_playing = () => {
  return App.play_state === `playing`
}

App.is_paused = () => {
  return App.play_state === `paused`
}

App.is_stopped = () => {
  return App.play_state === `stopped`
}