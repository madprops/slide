import "./process-env.js"
import {LZString} from "../libs/lz-string.js"
import {initAudio, samples, registerSynthSounds, getAudioContext} from "superdough"

import * as strudelCore from "@strudel/core"
import * as strudelMini from "@strudel/mini"
import * as strudelWebAudio from "@strudel/webaudio"
import * as strudelTonal from "@strudel/tonal"
import * as strudelDraw from '@strudel/draw'
import * as strudelHydra from '@strudel/hydra'
import {transpiler} from "@strudel/transpiler"

import {webaudioRepl} from "@strudel/webaudio"
import {registerSoundfonts} from "@strudel/soundfonts"
import {Drawer, cleanupDraw} from "@strudel/draw"
import {initHydra, clearHydra, H as H_hydra} from "@strudel/hydra"
import {hush} from "@strudel/web"

App.last_eval_error = ``

App.handle_eval_error = (err) => {
  App.has_error = true
  App.last_eval_error = err?.message || `${err}`
  App.set_status(App.last_eval_error)
}

const {evaluate, scheduler} = webaudioRepl({
  transpiler,
  onEvalError: (err) => {
    App.handle_eval_error(err)
  },
})

App.evaluate = evaluate
App.scheduler = scheduler

App.app_name = `Slide`
App.current_song = ``
App.events_started = false
App.audio_started = false
App.fetch_in_flight = false
App.default_cpm = 60
App.tempo = App.default_cpm
App.tempo_debounce_timer = undefined
App.color_index = 0
App.do_partial_updates = false
App.fetch_delay_seconds = 5
App.code_url_max = 1920
App.default_cpm = 30

App.on_load = () => {
  App.start_events()
}

App.get_config = async () => {
  let data = await fetch(`config/config.json`)

  try {
    App.config = await data.json()
  }
  catch (err) {
    console.error(`Failed to parse config.json`, err)
    App.config = {}
  }
}

App.clear_draw_context = () => {
  try {
    cleanupDraw(true)
  }
  catch (err) {
    console.warn(`Failed to clear draw context`, err)
  }
}

App.reset_eval_state = () => {
  App.has_error = false
}

App.report_eval_failure = (error) => {
  let message = error?.message || App.last_eval_error || `Failed to evaluate Strudel code`
  App.last_eval_error = message
  App.set_status(message)
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
  let parts = []

  let flush = () => {
    let trimmed = buffer.trim()

    if (trimmed) {
      parts.push(trimmed)
    }

    buffer = ``
  }

  for (let i = 0; i < block.length; i += 1) {
    let char = block[i]
    let prev = block[i - 1]
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

    let next_char = block[i + 1]
    let depth_clear = (round === 0) && (square === 0) && (curly === 0)
    let next_is_indent = (next_char === ` `) || (next_char === `\t`)
    let next_is_newline = next_char === `\n`

    if (depth_clear && !next_is_indent && !next_is_newline) {
      flush()
    }
  }

  flush()
  return parts
}

App.segment_code = (code) => {
  let normalized = App.normalize_code(code)

  if (!normalized) {
    return []
  }

  let coarse = normalized.split(/\n{2,}/g).map((block) => block.trim()).filter(Boolean)
  let segments = []

  for (let block of coarse) {
    if (!block.includes(`\n`)) {
      segments.push(block)
      continue
    }

    let refined = App.split_by_newlines(block)

    if (refined.length) {
      segments.push(...refined)
    }
    else {
      segments.push(block)
    }
  }

  if ((segments.length <= 1) && normalized.includes(`\n`)) {
    let fallback = normalized.split(/\n+/g).map((line) => line.trim()).filter(Boolean)

    if (fallback.length > 1) {
      return fallback
    }
  }

  return segments
}

App.apply_partial_update = async (code) => {
  let segments = App.segment_code(code)

  if (!segments.length) {
    return false
  }

  let applied = []
  let skipped = 0

  for (let segment of segments) {
    let result = await App.run_eval(segment)

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

  let sanitized = applied.join(`\n\n`)
  App.set_input(sanitized)

  if (skipped > 0) {
    App.playing(`Skipped ${skipped} segment(s)`)
  }
  else {
    App.playing()
  }

  return true
}

App.start_events = async () => {
  if (App.events_started) {
    return
  }

  App.events_started = true
  await App.get_config()
  App.load_all_storage()
  App.setup_modals()
  App.start_visual()

  DOM.ev(`#btn-play`, `click`, async () => {
    let next_code = App.get_input_value()
    App.play_action(next_code, true)
  })

  DOM.ev(`#btn-url`, `click`, () => {
    App.get_beat_url()
  })

  DOM.ev(`#btn-auto`, `click`, () => {
    App.show_auto()
  })

  DOM.ev(`#btn-pause`, `click`, () => {
    App.pause_action()
  })

  DOM.ev(`#btn-stop`, `click`, () => {
    App.stop_action()
  })

  DOM.ev(`#btn-new`, `click`, () => {
    App.new_beat()
  })

  let collections = DOM.el(`#btn-collections`)

  DOM.ev(collections, `click`, () => {
    App.show_collections()
  })

  let snapshot = DOM.el(`#btn-snapshot`)

  DOM.ev(snapshot, `click`, () => {
    App.save_snapshot()
  })

  App.remove_context(`#controls`)
  let image = DOM.el(`#image`)

  DOM.ev(image, `click`, () => {
    App.show_settings()
  })

  App.middle_click(image, () => {
    App.next_visual()
  })

  let title = DOM.el(`#title`)

  DOM.ev(title, `click`, () => {
    App.show_about()
  })

  App.middle_click(title, () => {
    App.mirror_title()
  })

  App.setup_player()
  App.setup_status()
  App.setup_volume()
  App.setup_input()
  App.setup_scope()
  App.setup_theme()
  App.setup_effects()
  App.setup_custom_numbers()
  App.init_volume_controls()
  App.init_tempo_controls()
  App.init_code_input_controls()
  App.start_keyboard()
  App.start_resize_observer()
  App.make_main_visible()
  App.set_beat_title_from_query()
  App.max_input()
  App.resize_scope()
  App.init_tooltips()

  if (!await App.load_song_from_query()) {
    if (!App.load_url_from_query()) {
      if (!App.load_code_from_query()) {
        App.load_last_code()
      }
    }
  }

  App.playing()
}

App.get_main = () => {
  return DOM.el(`#main`)
}

App.make_main_visible = () => {
  App.get_main().classList.remove(`invisible`)
}

App.set_title = (title) => {
  if (title) {
    document.title = `${App.app_name} - ${title}`
    return
  }

  document.title = App.app_name
}

App.get_query_params = () => {
  return new URLSearchParams(window.location.search)
}

App.update_title = () => {
  let title = App.app_name
  let name = App.get_song_name(true)

  if (name) {
    title = `${title} - ${name}`
  }
  else if (App.beat_title) {
    title = `${title} - ${App.beat_title}`
  }

  document.title = title
}

App.get_top_height = () => {
  let el = DOM.el(`#top`)
  return App.get_el_height(el)
}

App.get_bottom_height = () => {
  let el = DOM.el(`#bottom`)
  return App.get_el_height(el)
}

App.loading = () => {
  App.set_status(`Loading...`)
}

App.start_resize_observer = () => {
  let observer = new ResizeObserver((entries) => {
    App.max_debouncer.call()
  })

  observer.observe(App.get_main())

  DOM.ev(window, `resize`, () => {
    App.resize_scope()
    App.check_max_button()
  })
}

App.setup_eval = async () => {
  try {
    // 2. Pass them into evalScope
    await strudelCore.evalScope(
      strudelCore,
      strudelMini,
      strudelWebAudio,
      strudelTonal,
      strudelDraw,
      strudelHydra,
      transpiler,
    )

    console.log(`Setup Eval done.`)
  }
  catch (err) {
    console.error(`Strudel scope failed to load`, err)
  }
}

App.mirror_title = () => {
  DOM.el(`#title`).classList.toggle(`mirror`)
}

window.H = H_hydra
window.initHydra = initHydra
window.clearHydra = clearHydra
window.lz = LZString
window.Drawer = Drawer
window.strudelMini = strudelMini
window.registerSoundfonts = registerSoundfonts
window.registerSynthSounds = registerSynthSounds
window.initAudio = initAudio
window.samples = samples
window.getAudioContext = getAudioContext
window.hush = hush