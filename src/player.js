import * as strudelMini from "@strudel.cycles/mini"
import {initAudio, samples, registerSynthSounds} from "superdough"
import {registerSoundfonts} from "@strudel.cycles/soundfonts"

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
      App.update_url(cache.name)
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

App.ensure_strudel_ready = async () => {
  if (!App.strudel_init) {
    App.set_status(`Bundle not loaded. Check console for errors`)
    console.error(`strudel.bundle.js is missing or failed to load`)
    return false
  }

  await App.strudel_init()
  return true
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
    const ds = `https://raw.githubusercontent.com/felixroos/dough-samples/main`

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

App.set_tempo = () => {
  try {
    App.scheduler.setCps(App.tempo / 60)
  }
  catch (err) {
    console.debug(`Tempo will be applied when audio starts`, err)
  }
}

App.reset_eval_state = () => {
  App.has_error = false
}

App.report_eval_failure = (error) => {
  const message = error?.message || App.last_eval_error || `Failed to evaluate Strudel code`
  App.last_eval_error = message
  App.set_status(message)
}

App.run_eval = async (code) => {
  App.reset_eval_state()
  code = App.filter_code(code)
  App.set_input(code)

  try {
    await evaluate(code)
  }
  catch (err) {
    return {ok: false, error: err}
  }

  if (App.has_error) {
    return {ok: false, error: new Error(App.last_eval_error || `Evaluation error`)}
  }

  return {ok: true}
}