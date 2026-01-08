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

App.play_action = async (code = ``, args = {}) => {
  console.info(`🔮 Play Action`)

  let def_args = {
    force: false,
    fresh: false,
  }

  App.def_args(def_args, args)

  if (App.play_running) {
    return
  }

  App.play_running = true

  // Wrap everything in a try/finally to ensure the lock is ALWAYS released
  try {
    if (!code) {
      code = App.get_input_value()
    }

    if (!code) {
      App.last_code = ``
      App.current_song = ``
      App.stop_action()
      return
    }

    if (!args.fresh && (code === App.last_code)) {
      return
    }

    if (args.fresh) {
      App.restart_code_scroll(true)
    }

    // These are now safe inside the try block
    // (e.g. localStorage full won't kill the loop forever)
    App.stor_save_code()
    App.clear_draw_context()
    App.update_title()
    App.stop_queue()

    let success = await App.strudel_update(code)

    // Only set state to playing if the update actually succeeded
    if (success) {
      await App.resume_audio()
      App.set_playing(`playing`)
      App.update_effects()
      App.update_url()
      App.start_queue()
    }
  }
  catch (e) {
    App.last_code = ``
    App.set_status(`Error: ${e.message}`)
  }
  finally {
    // This runs even if a return happened or an error was thrown above
    App.reset_playing()
  }
}

App.stop_action = () => {
  console.info(`🔮 Stop Action`)

  if (App.is_stopped()) {
    App.stop_auto()
    return
  }

  App.set_playing(`stopped`)
  App.stop_strudel()
  App.stop_code_scroll()
  App.clear_draw_context()
  App.set_song_context(``)
  App.suspend_audio()
  App.stop_queue()
  App.playing()
}

App.stop_strudel = async () => {
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
  if (!App.is_playing()) {
    return
  }

  console.info(`🔮 Pause Action`)
  App.set_playing(`paused`)
  App.pause_strudel()
  App.stop_code_scroll()
  App.stop_queue()
}

App.pause_strudel = () => {
  App.scheduler.pause()
  App.stop_drawer()
}

App.strudel_update = async (code) => {
  await App.init_player()

  if (!App.audio_started) {
    console.warn(`Audio not started yet. Call init_player() first.`)
    return false
  }

  console.info(`Updating 💨`)
  App.set_song_tempo(code)
  App.update_url()
  let full_result = await App.run_eval(code)

  if (full_result.ok) {
    App.playing()
    return true
  }

  if (App.do_partial_updates) {
    let partial_applied = await App.apply_partial_update(code)

    if (partial_applied) {
      return true
    }
  }

  App.report_eval_failure(full_result.error)
  return false
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
  App.set_input(code, false)

  try {
    App.pattern = await App.evaluate(code)

    if (App.pattern) {
      App.last_code = code

      if (App.is_stopped()) {
        let now = App.scheduler.now()
        let cps = App.scheduler.cps || 1
        App.seek_offset = now * cps
      }

      App.start_drawer()
    }
    else {
      App.last_code = ``
      App.seek_offset = 0

      if (App.stoppable()) {
        App.stop_action()
      }
    }
  }
  catch (err) {
    App.seek_offset = 0

    if (App.stoppable()) {
      App.stop_action()
    }

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

App.copy_play = async () => {
  try {
    let clipboard_text = await navigator.clipboard.readText()

    if (clipboard_text && (clipboard_text.length > 0)) {
      App.play_action(clipboard_text, {fresh: true})
    }
  }
  catch (error) {
    console.error(`Clipboard access denied or failed: ${error}`)
  }
}

App.set_playing = (what) => {
  App.play_state = what
  let btn = DOM.el(`#btn-play`)

  if (App.is_playing()) {
    btn.classList.add(`active`)
  }
  else {
    btn.classList.remove(`active`)
  }

  btn = DOM.el(`#btn-pause`)

  if (App.is_paused()) {
    btn.classList.add(`active`)
  }
  else {
    btn.classList.remove(`active`)
  }
}

App.stoppable = () => {
  if (App.auto_started) {
    return false
  }

  return true
}