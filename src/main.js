import "./process-env.js"
import * as strudelCore from "@strudel.cycles/core"
import * as strudelMini from "@strudel.cycles/mini"
import * as strudelWebAudio from "@strudel.cycles/webaudio"
import {initAudio, samples} from "superdough"
import {webaudioRepl} from "@strudel.cycles/webaudio"

const {evalScope} = strudelCore
const {evaluate} = webaudioRepl()
const App = {}

App.poll_minutes = 1
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
        await samples('github:tidalcycles/dirt-samples')

        App.audio_started = true
        App.strudel_watch_status()
        console.info(`Audio Ready.`)
    }
    catch (err) {
        console.error(`Audio Failed:`, err)
        throw err
    }
}

// 2. Export the update function
App.strudel_update = (code) => {
    if (!App.audio_started) {
        console.warn(`Audio not started yet. Call strudel_init() first.`)
        return
    }

    console.info(`Running:`, code)
    evaluate(code)
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
            const nextCode = code.trim()

            if (!nextCode) {
                return
            }

            if (nextCode === App.last_status) {
                return
            }

            App.last_status = nextCode
            window.strudel_update(nextCode)
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