import "./process-env.js"
import * as strudelCore from "@strudel.cycles/core"
import * as strudelMini from "@strudel.cycles/mini"
import * as strudelWebAudio from "@strudel.cycles/webaudio"
import {initAudio, samples} from "superdough"
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

App.clear_status_watch = () => {
    if (!App.poll_timer) {
        return
    }

    clearInterval(App.poll_timer)
    App.poll_timer = undefined
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
}

// Export functions to window for use in HTML
window.strudel_init = App.strudel_init
window.strudel_update = App.strudel_update
window.strudel_stop = App.strudel_stop
window.strudel_watchStatus = App.strudel_watch_status
window.strudel_stopStatusWatch = App.stop_status_watch
window.App = App

App.start_events()