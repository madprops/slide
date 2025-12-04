const App = {}
App.fetch_delay_seconds = 3

import "./process-env.js"
import * as strudelMini from "@strudel.cycles/mini"
import {getSuperdoughAudioController, initAudio, samples, registerSynthSounds} from "superdough"
import {webaudioRepl} from "@strudel.cycles/webaudio"
import {transpiler} from "@strudel.cycles/transpiler"
import {registerSoundfonts} from "@strudel.cycles/soundfonts"
import {Pattern} from "@strudel.cycles/core"
import {cleanupDraw} from "@strudel.cycles/draw"

// Generic code filter to remove or neutralize unwanted calls
App.filter_code = (code) => {
  // Remove setcps() calls with any arguments
  code = code.replace(/setcps\s*\([^)]*\)/gi, ``)

  // Remove setbpm() calls with any arguments
  code = code.replace(/setbpm\s*\([^)]*\)/gi, ``)

  // Remove setcpm() calls with any arguments
  code = code.replace(/setcpm\s*\([^)]*\)/gi, ``)

  // Remove .cpm() calls with any arguments
  code = code.replace(/\.cpm\s*\([^)]*\)/gi, ``)

  // Remove .cpm() calls with any arguments
  code = code.replace(/\.scope\s*\([^)]*\)/gi, ``)

  // Replace multiple empty lines with single empty line
  code = code.replace(/\n\s*\n\s*\n+/g, `\n\n`)

  return code.trim()
}

// No-op visualization function
Pattern.prototype._pianoroll = function (options = {}) {
  return this
}

Pattern.prototype._punchcard = function (options = {}) {
  return this
}

Pattern.prototype._spiral = function (options = {}) {
  return this
}

Pattern.prototype._scope = function (options = {}) {
  return this
}

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
    }
})

App.events_started = false
App.audio_started = false
App.fetch_in_flight = false
App.volume_percent = 100
App.volume_storage_key = `slide.volumePercent`
App.default_cpm = 60
App.tempo_cpm = App.default_cpm
App.tempo_storage_key = `slide.tempoCpm`
App.tempo_debounce_timer = undefined
App.is_playing = false
App.color_index = 0
App.color_cycle_timer = undefined
App.do_partial_updates = false

App.cycle_colors = [
    `#94dd94`,
    `rgb(197, 187, 106)`,
    `rgb(222, 143, 143)`,
    `rgb(127, 155, 210)`,
]

App.clear_status_watch = () => {
    if (!App.fetch_timer) {
        return
    }

    console.info(`Interval cleared.`)
    clearInterval(App.fetch_timer)
    App.fetch_timer = undefined
}

App.apply_color = (color) => {
    let code_input = document.getElementById(`code-input`)
    let volume_value = document.getElementById(`volume-value`)
    let volume_slider = document.getElementById(`volume-slider`)
    let tempo_value = document.getElementById(`tempo-value`)
    let tempo_slider = document.getElementById(`tempo-slider`)
    let status_el = document.getElementById(`status`)
    let image_el = document.getElementById(`image`)
    let scope_container = document.getElementById(`scope-visualizer`)
    let scope_canvas = document.getElementById(`scope-canvas`)

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

    let scolor = App.scope_color

    if (scope_container) {
        scope_container.style.borderColor = scolor
        scope_container.style.boxShadow = `0 0 0.35rem ${scolor}33`
    }

    if (scope_canvas) {
        scope_canvas.style.boxShadow = `inset 0 0 0.4rem ${scolor}1a`
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
    let code_input = document.getElementById(`code-input`)
    let volume_value = document.getElementById(`volume-value`)
    let volume_slider = document.getElementById(`volume-slider`)
    let tempo_value = document.getElementById(`tempo-value`)
    let tempo_slider = document.getElementById(`tempo-slider`)
    let status_el = document.getElementById(`status`)
    let image_el = document.getElementById(`image`)

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

App.get_volume_slider = () => {
    return document.getElementById(`volume-slider`)
}

App.get_volume_value = () => {
    return document.getElementById(`volume-value`)
}

App.read_volume_value = (input_el) => {
    if (!input_el) {
        return App.volume_percent
    }

    const slider_value = input_el.valueAsNumber

    if (Number.isFinite(slider_value)) {
        return slider_value
    }

    const numeric_value = parseInt(input_el.value, 10)

    if (Number.isFinite(numeric_value)) {
        return numeric_value
    }

    return App.volume_percent
}

App.refresh_volume_ui = () => {
    const slider = App.get_volume_slider()
    const display = App.get_volume_value()

    if (slider) {
        slider.value = `${App.volume_percent}`
    }

    if (display) {
        display.innerText = `${App.volume_percent}%`
    }
}

App.persist_volume = () => {
    if (typeof window === `undefined`) {
        return
    }

    try {
        window.localStorage?.setItem(App.volume_storage_key, `${App.volume_percent}`)
    }
    catch (err) {
        console.warn(`Failed to persist volume`, err)
    }
}

App.load_saved_volume = () => {
    if (typeof window === `undefined`) {
        return undefined
    }

    try {
        const stored_value = window.localStorage?.getItem(App.volume_storage_key)

        if (stored_value == null) {
            return undefined
        }

        const parsed_value = Number(stored_value)

        if (!Number.isFinite(parsed_value)) {
            return undefined
        }

        return parsed_value
    }
    catch (err) {
        console.warn(`Failed to load volume`, err)
        return undefined
    }
}

App.apply_volume = () => {
    if (!App.audio_started) {
        return
    }

    try {
        const controller = getSuperdoughAudioController()
        const destination_gain = controller?.output?.destinationGain

        if (!destination_gain) {
            console.warn(`Destination gain node missing`)
            return
        }

        destination_gain.gain.value = App.volume_percent / 100
    }
    catch (err) {
        console.error(`Failed to apply volume`, err)
    }
}

App.update_volume = (percent) => {
    let next_value = Number(percent)

    if (!Number.isFinite(next_value)) {
        next_value = App.volume_percent
    }

    next_value = Math.min(100, Math.max(0, next_value))
    App.volume_percent = next_value
    App.refresh_volume_ui()
    App.persist_volume()
    App.apply_volume()
}

App.init_volume_controls = () => {
    const slider = App.get_volume_slider()

    if (!slider) {
        return
    }

    const saved_volume = App.load_saved_volume()
    const slider_volume = App.read_volume_value(slider)

    if (Number.isFinite(saved_volume)) {
        App.volume_percent = saved_volume
    }
    else {
        App.volume_percent = slider_volume
    }

    App.refresh_volume_ui()
    App.persist_volume()

    slider.addEventListener(`input`, (event) => {
        App.update_volume(App.read_volume_value(event.target))
    })

    slider.addEventListener(`wheel`, (event) => {
        event.preventDefault()
        let step = parseInt(event.target.step, 10) || 1
        let current = parseInt(event.target.value, 10)

        if (event.deltaY < 0) {
            event.target.value = current + step
        }
        else {
            event.target.value = current - step
        }

        App.update_volume(App.read_volume_value(event.target))
    })
}

App.get_tempo_slider = () => {
    return document.getElementById(`tempo-slider`)
}

App.get_tempo_value = () => {
    return document.getElementById(`tempo-value`)
}

App.refresh_tempo_ui = () => {
    let slider = App.get_tempo_slider()
    let display = App.get_tempo_value()

    if (slider) {
        slider.value = `${App.tempo_cpm}`
    }

    if (display) {
        display.textContent = `${App.tempo_cpm} cpm`
    }
}

App.persist_tempo = () => {
    if (typeof window === `undefined`) {
        return
    }

    try {
        window.localStorage?.setItem(App.tempo_storage_key, `${App.tempo_cpm}`)
    }
    catch (err) {
        console.warn(`Failed to persist tempo`, err)
    }
}

App.load_saved_tempo = () => {
    if (typeof window === `undefined`) {
        return undefined
    }

    try {
        let saved = window.localStorage?.getItem(App.tempo_storage_key)

        if (saved == null) {
            return undefined
        }

        let parsed = parseInt(saved, 10)

        if (!Number.isFinite(parsed)) {
            return undefined
        }

        return parsed
    }
    catch (err) {
        console.warn(`Failed to load tempo`, err)
        return undefined
    }
}

App.update_tempo = (cpm) => {
    let next_value = parseInt(cpm, 10)

    if (!Number.isFinite(next_value)) {
        next_value = App.tempo_cpm
    }

    next_value = Math.min(200, Math.max(20, next_value))
    App.tempo_cpm = next_value
    App.refresh_tempo_ui()
    App.persist_tempo()
}

App.on_tempo_change = (event) => {
    App.update_tempo(event.target.value)

    if (App.tempo_debounce_timer) {
        clearTimeout(App.tempo_debounce_timer)
    }

    App.tempo_debounce_timer = setTimeout(() => {
        App.tempo_debounce_timer = undefined
        App.set_tempo()
    }, 10)
}

App.init_tempo_controls = () => {
    let slider = App.get_tempo_slider()

    if (!slider) {
        return
    }

    let saved_tempo = App.load_saved_tempo()

    if (Number.isFinite(saved_tempo)) {
        App.tempo_cpm = saved_tempo
    }

    App.refresh_tempo_ui()
    App.persist_tempo()

    slider.addEventListener(`input`, (event) => {
        App.update_tempo(event.target.value)
    })

    slider.addEventListener(`auxclick`, (event) => {
        if (event.button === 1) {
            event.target.value = App.default_cpm
            App.update_tempo(App.default_cpm)
            App.set_tempo()
        }
    })

    slider.addEventListener(`wheel`, (event) => {
        event.preventDefault()
        let step = parseInt(event.target.step, 10) || 1
        let current = parseInt(event.target.value, 10)

        if (event.deltaY < 0) {
            event.target.value = current + step
        }
        else {
            event.target.value = current - step
        }

        App.on_tempo_change(event)
    })

    slider.addEventListener(`change`, (event) => {
        App.on_tempo_change(event)
    })
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
}

App.playing = (extra) => {
    let msg = `Playing 🥁`

    if (extra) {
        msg = `${msg} - ${extra}`.trim()
    }

    App.set_status(msg)
}

App.set_tempo = () => {
    scheduler.setCps(App.tempo_cpm / 60)
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

App.set_input = (code) => {
    const code_input = App.get_input()
    code_input.value = code
    code_input.scrollTop = 0
}

App.clear_draw_context = () => {
    try {
        cleanupDraw(true)
    }
    catch (err) {
        console.warn(`Failed to clear draw context`, err)
    }
}

// 3. Export stop
App.strudel_stop = () => {
    App.stop_status_watch()
    App.stop_color_cycle()
    App.clear_draw_context()
    evaluate(`hush`)
}

App.fetch_status_code = async () => {
    const response = await fetch(`/status`, { cache: `no-store` })

    if (!response.ok) {
        throw new Error(`Status endpoint returned ${response.status}`)
    }

    return response.text()
}

App.stop_status_watch = () => {
    App.clear_status_watch()
}

App.strudel_watch_status = (seconds) => {
    if (Number.isFinite(seconds) && (seconds > 0)) {
        App.fetch_delay_seconds = seconds
    }

    if (App.fetch_timer) {
        return
    }

    if (!App.fetch_delay_seconds || (App.fetch_delay_seconds <= 0)) {
        console.error(`Provide a fetch interval in seconds greater than zero`)
        return
    }

    const interval_ms = App.fetch_delay_seconds * 1000

    const fetch_status = async () => {
        console.info(`Fetching status...`)

        if (App.fetch_in_flight) {
            return
        }

        App.fetch_in_flight = true

        try {
            const code = await App.fetch_status_code()
            const next_code = code.trim()

            if (!next_code) {
                return
            }

            if (!App.audio_started) {
                App.code_to_play = next_code
            }
            else {
                await App.play_action(next_code)
            }
        }
        catch (err) {
            console.error(`Failed to update Strudel status`, err)
        }
        finally {
            App.fetch_in_flight = false
        }
    }

    App.clear_status_watch()
    fetch_status()

    App.fetch_timer = setInterval(() => {
        fetch_status()
    }, interval_ms)

    console.info(`Interval started.`)
}

App.set_status = (status) => {
    let status_el = document.getElementById(`status`)
    status_el.innerText = status
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

        if ((char === `"`) || (char === `'`) || (char === "`")) {
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
        const nextIsNewline = (nextChar === `\n`)

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
    if (!window.strudel_init) {
        App.set_status(`Bundle not loaded. Check console for errors`)
        console.error(`strudel.bundle.js is missing or failed to load`)
        return false
    }

    await window.strudel_init()
    return true
}

App.get_input = () => {
    return document.getElementById(`code-input`)
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

    App.last_code = code
    App.clear_draw_context()
    App.start_color_cycle()

    try {
        await App.strudel_update(code)
    }
    catch (e) {
        App.set_status(`Error: ${e.message}`)
    }
}

App.stop_action = () => {
    if (!App.strudel_stop) {
        App.set_status(`Bundle not loaded. Cannot stop audio`)
        return
    }

    if (App.strudel_stop_status_watch) {
        App.strudel_stop_status_watch()
    }

    App.strudel_stop()
    App.last_code = null
    App.clear_draw_context()
    App.set_status(`Stopped`)
}

App.start_status_watch = () => {
    if (!App.strudel_watch_status) {
        console.warn(`Polling function missing. Did strudel bundle load?`)
        return
    }

    let seconds = window.App && window.App.statusPollSeconds

    if (!Number.isFinite(seconds) || (seconds <= 0)) {
        let minutes = window.App && window.App.statusPollMinutes

        if (Number.isFinite(minutes) && (minutes > 0)) {
            seconds = minutes * 60
        }
    }

    App.strudel_watch_status(seconds)
}

App.fetch_songs_list = async () => {
    try {
        let response = await fetch(`/songs/list`)

        if (!response.ok) {
            throw new Error(`Failed to fetch songs list`)
        }

        return await response.json()
    }
    catch (err) {
        console.error(`Error fetching songs`, err)
        return []
    }
}

App.fetch_song_content = async (song_name) => {
    try {
        let response = await fetch(`/songs/${song_name}.js`)

        if (!response.ok) {
            throw new Error(`Failed to fetch song ${song_name}`)
        }

        return await response.text()
    }
    catch (err) {
        console.error(`Error fetching song content`, err)
        throw err
    }
}

App.open_songs_modal = async () => {
    let modal = document.getElementById(`songs-modal`)
    let songs_list = document.getElementById(`songs-list`)

    modal.classList.add(`active`)
    songs_list.innerHTML = `<div class="loading">Loading songs...</div>`

    let songs = await App.fetch_songs_list()

    if (!songs.length) {
        songs_list.innerHTML = `<div class="loading">No songs found</div>`
        return
    }

    songs_list.innerHTML = ``

    for (let song of songs) {
        let item = document.createElement(`div`)
        item.className = `song-item`
        item.textContent = song
        item.addEventListener(`click`, () => App.load_song(song))
        songs_list.appendChild(item)
    }
}

App.close_songs_modal = () => {
    let modal = document.getElementById(`songs-modal`)
    modal.classList.remove(`active`)
}

App.load_song = async (song_name) => {
    App.close_songs_modal()

    try {
        App.set_status(`Loading ${song_name}...`)
        let content = await App.fetch_song_content(song_name)
        App.stop_status_watch()
        App.stop_color_cycle()
        App.clear_draw_context()
        App.last_code = null
        await App.play_action(content)
        App.set_status(`Playing: ${song_name}`)
    }
    catch (err) {
        App.set_status(`Failed to load song: ${err.message}`)
        console.error(`Failed to load song:`, err)
    }
}

App.start_events = () => {
    if (App.events_started) {
        return
    }

    App.events_started = true

    document.getElementById(`btn-play`).addEventListener(`click`, () => {
        App.stop_status_watch()

        let code_input = App.get_input()
        let next_code = code_input ? code_input.value : ``

        App.play_action(next_code, true)
    })

    document.getElementById(`btn-auto`).addEventListener(`click`, async () => {
        if (App.fetch_timer) {
            App.set_status(`Auto mode already running`)
            return
        }

        let ready = await App.ensure_strudel_ready()

        if (!ready) {
            return
        }

        App.start_status_watch()
        App.set_status(`Auto mode running`)
    })

    document.getElementById(`btn-stop`).addEventListener(`click`, () => {
        App.stop_status_watch()
        App.stop_action()
    })

    document.getElementById(`btn-songs`).addEventListener(`click`, () => {
        App.stop_status_watch()
        App.open_songs_modal()
    })

    document.getElementById(`modal-close`).addEventListener(`click`, () => {
        App.close_songs_modal()
    })

    document.getElementById(`songs-modal`).addEventListener(`click`, (event) => {
        if (event.target.id === `songs-modal`) {
            App.close_songs_modal()
        }
    })

    App.init_volume_controls()
    App.init_tempo_controls()
    App.init_scope_checkbox()
    App.setup_scope_canvas()

    window.addEventListener(`resize`, () => {
        App.handle_scope_resize()
    })
}

// Export functions to window for use in HTML
window.strudel_init = App.strudel_init
window.strudel_update = App.strudel_update
window.strudel_stop = App.strudel_stop
window.strudel_watch_status = App.strudel_watch_status
window.strudel_stop_status_watch = App.stop_status_watch
window.App = App