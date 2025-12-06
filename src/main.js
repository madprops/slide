const App = {}

import "./process-env.js"
import * as strudelMini from "@strudel.cycles/mini"
import {initAudio, samples, registerSynthSounds} from "superdough"
import {webaudioRepl} from "@strudel.cycles/webaudio"
import {transpiler} from "@strudel.cycles/transpiler"
import {registerSoundfonts} from "@strudel.cycles/soundfonts"
import {cleanupDraw} from "@strudel.cycles/draw"
import {initHydra, clearHydra, H as H_hydra} from "@strudel.cycles/hydra"

App.last_eval_error = ``

App.handle_eval_error = (err) => {
  App.has_error = true
  App.last_eval_error = err?.message || `${err}`

  if (typeof App.set_status === `function`) {
    App.set_status(App.last_eval_error)
  }
  else {
    console.error(`Strudel evaluation error`, App.last_eval_error)
  }
}

const {evaluate, scheduler} = webaudioRepl({
  transpiler,
  onEvalError: (err) => {
    App.handle_eval_error(err)
  },
})

App.app_name = `Slide`
App.song_query_key = `song`
App.cpm_query_key = `cpm`
App.current_song = ``
App.events_started = false
App.audio_started = false
App.fetch_in_flight = false
App.status_watch_cancelled = false
App.default_cpm = 60
App.tempo_cpm = App.default_cpm
App.tempo_debounce_timer = undefined
App.is_playing = false
App.color_index = 0
App.color_cycle_timer = undefined
App.do_partial_updates = false
App.fetch_delay_seconds = 5

App.cycle_colors = [
  `#94dd94`,
  `rgb(197, 187, 106)`,
  `rgb(222, 143, 143)`,
  `rgb(127, 155, 210)`,
]

App.clear_status_watch = (set_cancelled = true) => {
  if (!App.fetch_timer) {
    return
  }

  console.info(`Interval cleared.`)
  clearInterval(App.fetch_timer)
  App.fetch_timer = undefined

  if (set_cancelled) {
    App.status_watch_cancelled = true
  }
}

App.apply_color = (color) => {
  let code_input = DOM.el(`#code-input`)
  let volume_value = DOM.el(`#volume-value`)
  let volume_slider = DOM.el(`#volume-slider`)
  let tempo_value = DOM.el(`#tempo-value`)
  let tempo_slider = DOM.el(`#tempo-slider`)
  let status_el = DOM.el(`#status`)
  let image_el = DOM.el(`#image`)
  let scope_container = DOM.el(`#scope-visualizer`)
  let scope_canvas = DOM.el(`#scope-canvas`)

  if (code_input) {
    code_input.style.color = color
  }

  if (volume_value) {
    volume_value.style.color = color
  }

  if (volume_slider) {
    volume_slider.style.accentColor = color
  }

  if (tempo_value) {
    tempo_value.style.color = color
  }

  if (tempo_slider) {
    tempo_slider.style.accentColor = color
  }

  if (status_el) {
    status_el.style.color = color
  }

  if (image_el) {
    image_el.style.filter = `drop-shadow(0 0 0.15rem ${color})`
  }

  if (scope_container) {
    scope_container.style.borderColor = App.scope_border_color
    scope_container.style.boxShadow = `0 0 0.35rem ${App.scope_border_color}33`
  }

  if (scope_canvas) {
    scope_canvas.style.boxShadow = `inset 0 0 0.4rem ${App.scope_border_color}1a`
  }
}

App.start_color_cycle = () => {
  if (App.color_cycle_timer) {
    return
  }

  App.is_playing = true
  App.color_index = 0
  App.apply_color(App.cycle_colors[0], 0)

  App.color_cycle_timer = setInterval(() => {
    App.color_index = (App.color_index + 1) % App.cycle_colors.length
    App.apply_color(App.cycle_colors[App.color_index], App.color_index)
  }, 3 * 1000)
}

App.stop_color_cycle = () => {
  if (App.color_cycle_timer) {
    clearInterval(App.color_cycle_timer)
    App.color_cycle_timer = undefined
  }

  App.is_playing = false
  App.color_index = 0

  let color = App.cycle_colors[0]
  let code_input = DOM.el(`#code-input`)
  let volume_value = DOM.el(`#volume-value`)
  let volume_slider = DOM.el(`#volume-slider`)
  let tempo_value = DOM.el(`#tempo-value`)
  let tempo_slider = DOM.el(`#tempo-slider`)
  let status_el = DOM.el(`#status`)
  let image_el = DOM.el(`#image`)

  if (code_input) {
    code_input.style.color = color
  }

  if (volume_value) {
    volume_value.style.color = color
  }

  if (volume_slider) {
    volume_slider.style.accentColor = color
  }

  if (tempo_value) {
    tempo_value.style.color = color
  }

  if (tempo_slider) {
    tempo_slider.style.accentColor = color
  }

  if (status_el) {
    status_el.style.color = color
  }

  if (image_el) {
    image_el.style.filter = ``
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
    App.try_start_scope_visualizer()
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

  App.status_debouncer = App.create_debouncer((status) => {
    App.do_set_status(status)
  }, 300)
}

App.playing = (extra) => {
  let msg = `Playing 🥁`

  if (App.current_song) {
    msg = `Playing: ${App.underspace(App.current_song)}`
  }

  if (extra) {
    msg = `${msg} - ${extra}`.trim()
  }

  App.set_status(msg)
}

App.set_tempo = () => {
  try {
    scheduler.setCps(App.tempo_cpm / 60)
  }
  catch (err) {
    console.debug(`Tempo will be applied when audio starts`, err)
  }
}

// 2. Export the update function
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

App.clear_draw_context = () => {
  try {
    cleanupDraw(true)
  }
  catch (err) {
    console.warn(`Failed to clear draw context`, err)
  }
}

App.stop_strudel = () => {
  App.stop_color_cycle()
  App.clear_draw_context()
  scheduler.stop()
  App.clean_canvas()
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

App.normalize_code = (code = ``) => {
  return code.replace(/\r\n/g, `\n`).trim()
}

App.strip_set_cpm = (code) => {
  return code
    .split(`\n`)
    .filter((line) => !line.trim().match(/^setCpm\s*\(/))
    .join(`\n`)
}

App.split_by_newlines = (block) => {
  let buffer = ``
  let quote = null
  let round = 0
  let square = 0
  let curly = 0
  const parts = []

  const flush = () => {
    const trimmed = buffer.trim()

    if (trimmed) {
      parts.push(trimmed)
    }

    buffer = ``
  }

  for (let i = 0; i < block.length; i += 1) {
    const char = block[i]
    const prev = block[i - 1]
    buffer += char

    if (quote) {
      if ((char === quote) && (prev !== `\\`)) {
        quote = null
      }

      continue
    }

    if ((char === `"`) || (char === `'`) || (char === `\``)) {
      quote = char
      continue
    }

    if (char === `(`) {
      round += 1
    }
    else if (char === `)`) {
      round = Math.max(0, round - 1)
    }
    else if (char === `[`) {
      square += 1
    }
    else if (char === `]`) {
      square = Math.max(0, square - 1)
    }
    else if (char === `{`) {
      curly += 1
    }
    else if (char === `}`) {
      curly = Math.max(0, curly - 1)
    }

    if (char !== `\n`) {
      continue
    }

    const nextChar = block[i + 1]
    const depthClear = (round === 0) && (square === 0) && (curly === 0)
    const nextIsIndent = (nextChar === ` `) || (nextChar === `\t`)
    const nextIsNewline = nextChar === `\n`

    if (depthClear && !nextIsIndent && !nextIsNewline) {
      flush()
    }
  }

  flush()
  return parts
}

App.segment_code = (code) => {
  const normalized = App.normalize_code(code)

  if (!normalized) {
    return []
  }

  const coarse = normalized.split(/\n{2,}/g).map((block) => block.trim()).filter(Boolean)
  const segments = []

  for (const block of coarse) {
    if (!block.includes(`\n`)) {
      segments.push(block)
      continue
    }

    const refined = App.split_by_newlines(block)

    if (refined.length) {
      segments.push(...refined)
    }
    else {
      segments.push(block)
    }
  }

  if ((segments.length <= 1) && normalized.includes(`\n`)) {
    const fallback = normalized.split(/\n+/g).map((line) => line.trim()).filter(Boolean)

    if (fallback.length > 1) {
      return fallback
    }
  }

  return segments
}

App.apply_partial_update = async (code) => {
  const segments = App.segment_code(code)

  if (!segments.length) {
    return false
  }

  const applied = []
  let skipped = 0

  for (const segment of segments) {
    const result = await App.run_eval(segment)

    if (result.ok) {
      applied.push(segment)
      continue
    }

    skipped += 1
    console.warn(`Skipping segment due to error`, result.error)
  }

  if (!applied.length) {
    return false
  }

  const sanitized = applied.join(`\n\n`)
  App.set_input(sanitized)

  if (skipped > 0) {
    App.playing(`Skipped ${skipped} segment(s)`)
  }
  else {
    App.playing()
  }

  return true
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

App.restart_code_scroll = () => {
  let code_input = App.get_input()

  if (code_input) {
    code_input.scrollTop = 0
  }

  if (App.code_scroll_active) {
    App.defer_code_scroll(App.code_scroll_song_pause_ms)
    App.reset_code_scroll_for_content(App.code_scroll_song_pause_ms)
  }
}

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

App.start_events = () => {
  if (App.events_started) {
    return
  }

  App.events_started = true
  App.create_modals()
  App.start_visual()

  DOM.ev(`#btn-play`, `click`, () => {
    App.stop_status_watch()

    let code_input = App.get_input()
    let next_code = code_input ? code_input.value : ``

    App.play_action(next_code, true)
  })

  DOM.ev(`#btn-auto`, `click`, () => {
    App.open_auto_modal()
  })

  DOM.ev(`#btn-stop`, `click`, () => {
    App.stop_status_watch()
    App.stop_action()
  })

  DOM.ev(`#btn-songs`, `click`, () => {
    App.stop_status_watch()
    App.open_songs_modal()
  })

  DOM.ev(`#btn-visual`, `click`, () => {
    App.open_visual_modal()
  })

  let about_image = DOM.el(`#image`)

  if (about_image) {
    DOM.ev(about_image, `click`, () => {
      App.open_about_modal()
    })
  }

  App.setup_auto()
  App.init_volume_controls()
  App.init_tempo_controls()
  App.init_code_input_controls()
  App.init_scope_checkbox()
  App.setup_scope_canvas()

  DOM.ev(window, `resize`, () => {
    App.handle_scope_resize()
  })

  App.load_song_from_query()
  App.load_all_storage()
}

App.set_title = (title) => {
  if (title) {
    document.title = `${App.app_name} - ${title}`
    return
  }

  document.title = App.app_name
}

App.update_song_query_param = (song_name = ``) => {
  if (!window?.history?.replaceState) {
    return
  }

  let next_url = new URL(window.location.href)

  if (song_name) {
    next_url.searchParams.set(App.song_query_key, song_name)
  }
  else {
    next_url.searchParams.delete(App.song_query_key)
  }

  if (song_name) {
    next_url.searchParams.set(App.cpm_query_key, `${App.tempo_cpm}`)
  }
  else {
    next_url.searchParams.delete(App.cpm_query_key)
  }

  window.history.replaceState({}, document.title, `${next_url.pathname}${next_url.search}${next_url.hash}`)
}

App.create_debouncer = (func, delay) => {
  if (typeof func !== `function`) {
    App.error(`Invalid debouncer function`)
    return
  }

  if ((typeof delay !== `number`) || (delay < 1)) {
    App.error(`Invalid debouncer delay`)
    return
  }

  let timer
  let obj = {}

  function clear() {
    clearTimeout(timer)
    timer = undefined
  }

  function run(...args) {
    func(...args)
  }

  obj.call = (...args) => {
    clear()

    timer = setTimeout(() => {
      run(...args)
    }, delay)
  }

  obj.call_2 = (...args) => {
    if (timer) {
      return
    }

    obj.call(args)
  }

  obj.now = (...args) => {
    clear()
    run(...args)
  }

  obj.cancel = () => {
    clear()
  }

  return obj
}

window.initHydra = initHydra
window.clearHydra = clearHydra
window.H = H_hydra
window.App = App