const App = {}
App.fetch_delay_seconds = 3

import "./process-env.js"
import * as strudelMini from "@strudel.cycles/mini"
import {initAudio, samples, registerSynthSounds} from "superdough"
import {webaudioRepl} from "@strudel.cycles/webaudio"
import {transpiler} from "@strudel.cycles/transpiler"
import {registerSoundfonts} from "@strudel.cycles/soundfonts"
import {cleanupDraw} from "@strudel.cycles/draw"

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
        App.set_song_context(song_name)
        App.handle_eval_error(err)
    }
})

App.app_name = `Slide`
App.song_query_key = `song`
App.cpm_query_key = `cpm`
App.current_song = ``
App.events_started = false
App.audio_started = false
App.fetch_in_flight = false
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
}

App.playing = (extra) => {
    let msg = `Playing 🥁`

    if (App.current_song) {
        msg = `Playing: ${App.current_song}`
    }

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

            App.set_song_context()

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
    let status_el = DOM.el(`#status`)
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
    return DOM.el(`#code-input`)
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
    App.set_song_context()
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

App.open_about_modal = () => {
    let modal = DOM.el(`#about-modal`)

    if (!modal) {
        return
    }

    modal.classList.add(`active`)
}

App.close_about_modal = () => {
    let modal = DOM.el(`#about-modal`)

    if (!modal) {
        return
    }

    modal.classList.remove(`active`)
}

App.start_events = () => {
    if (App.events_started) {
        return
    }

    App.events_started = true

    DOM.el(`#btn-play`).addEventListener(`click`, () => {
        App.stop_status_watch()

        let code_input = App.get_input()
        let next_code = code_input ? code_input.value : ``

        App.play_action(next_code, true)
    })

    DOM.el(`#btn-auto`).addEventListener(`click`, async () => {
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

    DOM.el(`#btn-stop`).addEventListener(`click`, () => {
        App.stop_status_watch()
        App.stop_action()
    })

    DOM.el(`#btn-songs`).addEventListener(`click`, () => {
        App.stop_status_watch()
        App.open_songs_modal()
    })

    DOM.el(`#modal-close`).addEventListener(`click`, () => {
        App.close_songs_modal()
    })

    DOM.el(`#songs-modal`).addEventListener(`click`, (event) => {
        if (event.target.id === `songs-modal`) {
            App.close_songs_modal()
        }
    })

    let about_image = DOM.el(`#image`)

    if (about_image) {
        about_image.addEventListener(`click`, () => {
            App.open_about_modal()
        })
    }

    DOM.el(`#about-close`).addEventListener(`click`, () => {
        App.close_about_modal()
    })

    DOM.el(`#about-modal`).addEventListener(`click`, (event) => {
        if (event.target.id === `about-modal`) {
            App.close_about_modal()
        }
    })

    App.init_volume_controls()
    App.init_tempo_controls()
    App.init_scope_checkbox()
    App.setup_scope_canvas()

    window.addEventListener(`resize`, () => {
        App.handle_scope_resize()
    })

    App.load_song_from_query()
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

    if ((App.tempo_cpm !== App.default_cpm) && song_name) {
        next_url.searchParams.set(App.cpm_query_key, `${App.tempo_cpm}`)
    }
    else {
        next_url.searchParams.delete(App.cpm_query_key)
    }

    window.history.replaceState({}, document.title, `${next_url.pathname}${next_url.search}${next_url.hash}`)
}

App.set_song_context = (song_name = ``) => {
    App.current_song = song_name || ``
    App.set_title(App.current_song)
    App.update_song_query_param(App.current_song)
}

App.load_song_from_query = async () => {
    if (!window || !window.location) {
        return
    }

    let query_params = new URLSearchParams(window.location.search)
    let requested_song = query_params.get(App.song_query_key)
    let requested_cpm = query_params.get(App.cpm_query_key)

    if (requested_cpm) {
        let parsed_cpm = parseInt(requested_cpm, 10)

        if (Number.isFinite(parsed_cpm)) {
            App.update_tempo(parsed_cpm)
            App.set_tempo()
        }
    }

    if (!requested_song) {
        return
    }

    try {
        App.set_status(`Loading ${requested_song}...`)
        let content = await App.fetch_song_content(requested_song)
        App.set_input(content)
        App.set_song_context(requested_song)
        App.code_to_play = content
        App.set_status(`Loaded: ${requested_song}`)
    }
    catch (err) {
        App.set_status(`Failed to load song: ${err.message}`)
        console.error(`Failed to load song:`, err)
    }
}

// Export functions to window for use in HTML
window.strudel_init = App.strudel_init
window.strudel_update = App.strudel_update
window.strudel_stop = App.strudel_stop
window.strudel_watch_status = App.strudel_watch_status
window.strudel_stop_status_watch = App.stop_status_watch
window.App = App