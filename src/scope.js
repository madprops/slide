import * as strudelCore from "@strudel.cycles/core"
import * as strudelMini from "@strudel.cycles/mini"
import {getAudioContext, getSuperdoughAudioController} from "superdough"
import * as strudelWebAudio from "@strudel.cycles/webaudio"
import * as strudelTonal from "@strudel.cycles/tonal"

const {evalScope} = strudelCore

const resolveSharedApp = () => {
    if (typeof globalThis !== `object`) {
        return {}
    }

    if (!globalThis.App) {
        globalThis.App = {}
    }

    return globalThis.App
}

const App = resolveSharedApp()

App.scope_container_el = undefined
App.scope_canvas_el = undefined
App.scope_canvas_ctx = undefined
App.scope_analyser = undefined
App.scope_waveform = undefined
App.scope_animation_id = undefined
App.scope_connected = false
App.scope_pixel_ratio = 1
App.scope_enabled = true
App.scope_color = `rgba(204, 198, 239, 1)`

App.get_scope_container = () => {
    if (!App.scope_container_el) {
        App.scope_container_el = DOM.el(`#scope-visualizer`)
    }

    return App.scope_container_el
}

App.get_scope_canvas = () => {
    if (!App.scope_canvas_el) {
        App.scope_canvas_el = DOM.el(`#scope-canvas`)
    }

    return App.scope_canvas_el
}

App.get_scope_dimensions = () => {
    if (!App.scope_canvas_el) {
        return {width: 0, height: 0}
    }

    let width = App.scope_canvas_el.clientWidth
    let height = App.scope_canvas_el.clientHeight

    if (!width) {
        width = App.scope_canvas_el.width / App.scope_pixel_ratio
    }

    if (!height) {
        height = App.scope_canvas_el.height / App.scope_pixel_ratio
    }

    return {
        width: Math.max(0, width || 0),
        height: Math.max(0, height || 0),
    }
}

App.setup_scope_canvas = () => {
    let canvas = App.get_scope_canvas()

    if (!canvas) {
        return undefined
    }

    if (!App.scope_canvas_ctx) {
        let context = canvas.getContext(`2d`)

        if (!context) {
            console.warn(`Scope canvas context unavailable`)
            return undefined
        }

        App.scope_canvas_ctx = context
    }

    App.resize_scope_canvas()
    return canvas
}

App.resize_scope_canvas = () => {
    if (!App.scope_canvas_el || !App.scope_canvas_ctx) {
        return
    }

    let ratio = 1

    if (typeof window !== `undefined`) {
        ratio = window.devicePixelRatio || 1
    }

    App.scope_pixel_ratio = ratio

    let width = App.scope_canvas_el.clientWidth || (App.scope_canvas_el.width / ratio) || 320
    let height = App.scope_canvas_el.clientHeight || (App.scope_canvas_el.height / ratio) || 80

    let scaled_width = Math.max(1, Math.round(width * ratio))
    let scaled_height = Math.max(1, Math.round(height * ratio))

    if ((App.scope_canvas_el.width !== scaled_width) || (App.scope_canvas_el.height !== scaled_height)) {
        App.scope_canvas_el.width = scaled_width
        App.scope_canvas_el.height = scaled_height
    }

    App.scope_canvas_ctx.setTransform(1, 0, 0, 1, 0, 0)
    App.scope_canvas_ctx.scale(ratio, ratio)
    App.clear_scope_canvas()
}

App.clear_scope_canvas = () => {
    if (!App.scope_canvas_ctx) {
        return
    }

    let {width, height} = App.get_scope_dimensions()

    if (!width || !height) {
        return
    }

    App.scope_canvas_ctx.fillStyle = `rgba(21, 21, 21, 0.75)`
    App.scope_canvas_ctx.fillRect(0, 0, width, height)
}

App.ensure_scope_waveform = () => {
    if (!App.scope_analyser) {
        return undefined
    }

    if (!App.scope_waveform || (App.scope_waveform.length !== App.scope_analyser.fftSize)) {
        App.scope_waveform = new Uint8Array(App.scope_analyser.fftSize)
    }

    return App.scope_waveform
}

App.ensure_scope_analyser = () => {
    if (App.scope_analyser) {
        return App.scope_analyser
    }

    try {
        let audio_ctx = getAudioContext()
        let analyser = audio_ctx.createAnalyser()
        analyser.fftSize = 2048
        analyser.minDecibels = -90
        analyser.maxDecibels = -10
        analyser.smoothingTimeConstant = 0.85
        App.scope_analyser = analyser
        App.ensure_scope_waveform()
    }
    catch (err) {
        console.error(`Failed to create scope analyser`, err)
        App.scope_analyser = undefined
        App.scope_waveform = undefined
    }

    return App.scope_analyser
}

App.connect_scope_analyser = () => {
    if (App.scope_connected) {
        return true
    }

    let analyser = App.ensure_scope_analyser()

    if (!analyser) {
        return false
    }

    try {
        let controller = getSuperdoughAudioController()
        let destination = controller?.output?.destinationGain

        if (!destination) {
            console.warn(`Scope destination missing`)
            return false
        }

        destination.connect(analyser)
        App.scope_connected = true
        return true
    }
    catch (err) {
        console.warn(`Failed to connect scope analyser`, err)
        return false
    }
}

App.stop_scope_loop = () => {
    if (App.scope_animation_id) {
        cancelAnimationFrame(App.scope_animation_id)
        App.scope_animation_id = undefined
    }
}

App.draw_scope_frame = () => {
    if (!App.scope_enabled) {
        App.stop_scope_loop()
        return
    }

    let analyser = App.scope_analyser
    let waveform = App.ensure_scope_waveform()

    if (!analyser || !waveform || !App.scope_canvas_ctx) {
        App.stop_scope_loop()
        return
    }

    analyser.getByteTimeDomainData(waveform)

    let {width, height} = App.get_scope_dimensions()

    if (!width || !height) {
        App.scope_animation_id = requestAnimationFrame(App.draw_scope_frame)
        return
    }

    App.scope_canvas_ctx.fillStyle = `rgba(21, 21, 21, 0.33)`
    App.scope_canvas_ctx.fillRect(0, 0, width, height)

    App.scope_canvas_ctx.strokeStyle = App.scope_color
    App.scope_canvas_ctx.lineWidth = 2
    App.scope_canvas_ctx.beginPath()

    let slice_width = width / waveform.length
    let x = 0

    for (let i = 0; i < waveform.length; i += 1) {
        let value = waveform[i]
        let normalized = (value / 128) - 1
        let y = (height / 2) + (normalized * (height / 2))

        if (i === 0) {
            App.scope_canvas_ctx.moveTo(x, y)
        }
        else {
            App.scope_canvas_ctx.lineTo(x, y)
        }

        x += slice_width
    }

    App.scope_canvas_ctx.stroke()
    App.scope_animation_id = requestAnimationFrame(App.draw_scope_frame)
}

App.start_scope_loop = () => {
    if (App.scope_animation_id) {
        return
    }

    App.scope_animation_id = requestAnimationFrame(App.draw_scope_frame)
}

App.set_scope_visibility = (visible) => {
    let container = App.get_scope_container()

    if (!container) {
        return
    }

    if (visible) {
        container.classList.add(`active`)
    }
    else {
        container.classList.remove(`active`)
    }
}

App.stop_scope_visualizer = () => {
    App.stop_scope_loop()
    App.set_scope_visibility(false)
    App.clear_scope_canvas()
}

App.try_start_scope_visualizer = () => {
    if (!App.scope_enabled || !App.audio_started) {
        return
    }

    let canvas = App.setup_scope_canvas()

    if (!canvas) {
        return
    }

    if (!App.ensure_scope_analyser()) {
        return
    }

    if (!App.scope_connected) {
        let connected = App.connect_scope_analyser()

        if (!connected) {
            return
        }
    }

    App.clear_scope_canvas()
    App.start_scope_loop()
}

App.enable_scope_visualizer = () => {
    App.scope_enabled = true
    App.set_scope_visibility(true)
    App.handle_scope_resize()
    App.try_start_scope_visualizer()
}

App.disable_scope_visualizer = () => {
    App.scope_enabled = false
    App.stop_scope_visualizer()
}

App.handle_scope_resize = () => {
    if (!App.scope_canvas_el) {
        return
    }

    App.resize_scope_canvas()

    if (!App.scope_enabled) {
        App.clear_scope_canvas()
    }
}

App.init_scope_checkbox = () => {
    let checkbox = DOM.el(`#scope-checkbox`)

    if (!checkbox) {
        return
    }

    checkbox.checked = App.scope_enabled

    if (App.scope_enabled) {
        App.enable_scope_visualizer()
    }
    else {
        App.set_scope_visibility(false)
    }

    checkbox.addEventListener(`change`, (event) => {
        if (event.target.checked) {
            App.enable_scope_visualizer()
        }
        else {
            App.disable_scope_visualizer()
        }
    })
}

App.ensure_scope = () => {
    if (!App.scope_promise) {
        App.scope_promise = evalScope(strudelCore, strudelMini, strudelWebAudio, strudelTonal).catch((err) => {
            App.scope_promise = undefined
            console.error(`Strudel scope failed to load`, err)
            throw err
        })
    }

    return App.scope_promise
}