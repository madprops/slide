import "./process-env.js"
import * as strudelCore from "@strudel.cycles/core"
import * as strudelMini from "@strudel.cycles/mini"
import * as strudelWebAudio from "@strudel.cycles/webaudio"
import {getSuperdoughAudioController, initAudio, samples} from "superdough"
import {webaudioRepl} from "@strudel.cycles/webaudio"

const {evalScope} = strudelCore
const App = {}

const {evaluate} = webaudioRepl({
    onEvalError: (err) => {
        App.has_error = true
        App.set_status(err)
    }
})

App.poll_minutes = 0.25
App.audio_started = false
App.poll_in_flight = false
App.volume_percent = 100
App.volume_storage_key = `slide.volumePercent`

App.clear_status_watch = () => {
    if (!App.poll_timer) {
        return
    }

    clearInterval(App.poll_timer)
    App.poll_timer = undefined
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
}

App.ensure_scope = () => {
    if (!App.scope_promise) {
        App.scope_promise = evalScope(strudelCore, strudelMini, strudelWebAudio).catch((err) => {
            App.scope_promise = undefined
            console.error(`Strudel scope failed to load`, err)
            throw err
        })
    }

    return App.scope_promise
}

// 1. Export a setup function to the global window object
// This allows your HTML/Flask templates to call it easily.
App.strudel_init = async () => {
    if (App.audio_started) {
        return
    }

    console.info(`Initializing Audio...`)

    try {
        await App.ensure_scope()

        // This must be called in response to a user interaction
        await initAudio()

        // Enable mini-notation for strings
        strudelMini.miniAllStrings()

        // Load default samples
        await samples(`github:tidalcycles/dirt-samples`)

        App.audio_started = true
        App.apply_volume()
        App.strudel_watch_status()
        console.info(`Audio Ready.`)
    }
    catch (err) {
        console.error(`Audio Failed:`, err)
        throw err
    }
}

App.playing = () => {
    App.set_status(`Playing 🥁`)
}

// 2. Export the update function
App.strudel_update = async (code) => {
    if (!App.audio_started) {
        console.warn(`Audio not started yet. Call strudel_init() first.`)
        return
    }

    console.info(`Updating 💨`)
    App.has_error = false

    try {
        await evaluate(code)

        if (App.has_error) {
            return
        }

        App.set_input(code)
        App.playing()
    }
    catch (err) {
        App.set_status(err)
    }
}

App.set_input = (code) => {
    const code_input = App.get_input()
    code_input.value = code
}

// 3. Export stop
App.strudel_stop = () => {
    App.stop_status_watch()
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

App.strudel_watch_status = () => {
    if (!App.poll_minutes || (App.poll_minutes <= 0)) {
        console.error(`Provide a polling interval in minutes greater than zero`)
        return
    }

    const interval_ms = App.poll_minutes * 60 * 1000

    const poll_status = async () => {
        if (App.poll_in_flight) {
            return
        }

        if (!App.audio_started) {
            console.warn(`Audio not started yet.`)
            return
        }

        App.poll_in_flight = true

        try {
            const code = await App.fetch_status_code()
            const next_code = code.trim()

            if (!next_code) {
                return
            }

            if (next_code === App.last_status) {
                return
            }

            App.last_status = next_code
            App.strudel_update(next_code)
        }
        catch (err) {
            console.error(`Failed to update Strudel status`, err)
        }
        finally {
            App.poll_in_flight = false
        }
    }

    App.clear_status_watch()
    poll_status()

    App.poll_timer = setInterval(() => {
        poll_status()
    }, interval_ms)

    console.info(`Interval started.`)
}

App.set_status = (status) => {
    let status_el = document.getElementById(`status`)
    status_el.innerText = status
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

App.update_action = async () => {
    const code_input = App.get_input()
    const ready = await App.ensure_strudel_ready()

    if (!ready) {
        return
    }

    const code = code_input.value

    try {
        App.strudel_update(code)
        App.playing()
    } catch (e) {
        App.set_status(`Error: ${e.message}`)
    }
}

App.stop_action = () => {
    if (!window.strudel_stop) {
        App.set_status(`Bundle not loaded. Cannot stop audio`)
        return
    }

    if (window.strudel_stopStatusWatch) {
        window.strudel_stopStatusWatch()
    }

    window.strudel_stop()
    App.set_status(`Stopped`)
}

App.start_action = async () => {
    const start_status_watch = () => {
        if (!window.strudel_watchStatus) {
            console.warn(`Polling function missing. Did strudel bundle load?`)
            return
        }

        const minutes = (window.App && window.App.statusPollMinutes) || 1
        window.strudel_watchStatus(minutes)
    }

    const ready = await App.ensure_strudel_ready()

    if (!ready) {
        return
    }

    start_status_watch()
    App.update_action()
}

App.start_events = () => {
    document.getElementById(`btn-start`).addEventListener(`click`, async () => {
        App.start_action()
    })

    document.getElementById(`btn-update`).addEventListener(`click`, async () => {
        App.update_action()
    })

    document.getElementById(`btn-stop`).addEventListener(`click`, () => {
        App.stop_action()
    })

    App.init_volume_controls()
}

// Export functions to window for use in HTML
window.strudel_init = App.strudel_init
window.strudel_update = App.strudel_update
window.strudel_stop = App.strudel_stop
window.strudel_watchStatus = App.strudel_watch_status
window.strudel_stopStatusWatch = App.stop_status_watch
window.App = App

App.start_events()