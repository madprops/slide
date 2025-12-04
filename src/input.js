App.get_input = () => {
    return DOM.el(`#code-input`)
}

App.defer_code_scroll = (delay_ms) => {
    if (!Number.isFinite(delay_ms) || (delay_ms <= 0)) {
        App.code_scroll_pending_delay_ms = 0
        return
    }

    App.code_scroll_pending_delay_ms = delay_ms
}

App.reset_code_scroll_for_content = (delay_ms = 0) => {
    App.code_scroll_direction = 1
    App.code_scroll_last_ts = 0

    if ((delay_ms <= 0) || (typeof window === `undefined`)) {
        App.code_scroll_pause_until = 0
        return
    }

    if (window.performance?.now) {
        App.code_scroll_pause_until = window.performance.now() + delay_ms
    }
    else {
        App.code_scroll_pause_until = delay_ms
    }
}

App.set_input = (code, options = {}) => {
    const code_input = App.get_input()

    if (!code_input) {
        return
    }

    code_input.value = code
    code_input.scrollTop = 0
    let delay_ms = 0

    if (App.code_scroll_active) {
        if (Number.isFinite(App.code_scroll_pending_delay_ms) && (App.code_scroll_pending_delay_ms > 0)) {
            delay_ms = App.code_scroll_pending_delay_ms
        }
        else if (Number.isFinite(options.scroll_delay_ms) && (options.scroll_delay_ms > 0)) {
            delay_ms = options.scroll_delay_ms
        }
    }

    App.code_scroll_pending_delay_ms = 0
    App.reset_code_scroll_for_content(delay_ms)
}

App.set_code_scroll_button_active = (is_active) => {
    let button = DOM.el(`#code-input-scroll`)

    if (!button) {
        return
    }

    if (is_active) {
        button.classList.add(`active`)
        return
    }

    button.classList.remove(`active`)
}

App.code_scroll_tick = (timestamp) => {
    if (!App.code_scroll_active) {
        App.code_scroll_frame = undefined
        return
    }

    let input = App.get_input()

    if (!input) {
        App.stop_code_scroll()
        return
    }

    if (!App.code_scroll_last_ts) {
        App.code_scroll_last_ts = timestamp
    }

    if (App.code_scroll_pause_until && (timestamp < App.code_scroll_pause_until)) {
        App.code_scroll_last_ts = timestamp
        App.code_scroll_frame = window.requestAnimationFrame(App.code_scroll_tick)
        return
    }

    App.code_scroll_pause_until = 0

    let delta = timestamp - App.code_scroll_last_ts
    App.code_scroll_last_ts = timestamp
    let distance = (App.code_scroll_speed_px_per_second * delta) / 1000
    let target = input.scrollTop + (distance * App.code_scroll_direction)
    input.scrollTop = target

    let max_scroll = Math.max(0, input.scrollHeight - input.clientHeight)

    if (max_scroll <= 0) {
        App.stop_code_scroll()
        return
    }

    if (input.scrollTop >= max_scroll) {
        input.scrollTop = max_scroll
        App.code_scroll_direction = -1
    }
    else if (input.scrollTop <= 0) {
        input.scrollTop = 0
        App.code_scroll_direction = 1
    }

    App.code_scroll_frame = window.requestAnimationFrame(App.code_scroll_tick)
}

App.start_code_scroll = () => {
    if (App.code_scroll_active) {
        return
    }

    let input = App.get_input()

    if (!input) {
        return
    }

    let max_scroll = Math.max(0, input.scrollHeight - input.clientHeight)

    if (max_scroll <= 0) {
        return
    }

    App.code_scroll_active = true
    App.code_scroll_direction = 1
    App.code_scroll_last_ts = 0
    App.code_scroll_pause_until = 0
    App.set_code_scroll_button_active(true)
    App.code_scroll_frame = window.requestAnimationFrame(App.code_scroll_tick)
}

App.stop_code_scroll = () => {
    if (!App.code_scroll_active && !App.code_scroll_frame) {
        return
    }

    App.code_scroll_active = false
    App.code_scroll_direction = 1
    App.code_scroll_last_ts = 0
    App.code_scroll_pause_until = 0

    if (App.code_scroll_frame) {
        window.cancelAnimationFrame(App.code_scroll_frame)
        App.code_scroll_frame = undefined
    }

    App.set_code_scroll_button_active(false)
}

App.init_code_input_controls = () => {
    let scroll_button = DOM.el(`#code-input-scroll`)
    let code_input = App.get_input()

    if (scroll_button) {
        DOM.ev(scroll_button, `click`, (event) => {
            event.preventDefault()

            if (App.code_scroll_active) {
                App.stop_code_scroll()
                return
            }

            App.start_code_scroll()
        })
    }

    if (code_input) {
        DOM.ev(code_input, `pointerdown`, (event) => {
            if (!App.code_scroll_active) {
                return
            }

            let target = event.target
            let rect = target.getBoundingClientRect()
            let is_resize_handle = (event.clientX > (rect.right - 20)) && (event.clientY > (rect.bottom - 20))

            if (is_resize_handle) {
                return
            }

            App.stop_code_scroll()
        })

        DOM.ev(code_input, `wheel`, (event) => {
            if (!App.code_scroll_active) {
                return
            }

            if (window.performance?.now) {
                App.code_scroll_pause_until = window.performance.now() + App.code_scroll_wheel_pause_ms
            }
            else {
                App.code_scroll_pause_until = App.code_scroll_wheel_pause_ms
            }

            if (event.deltaY < 0) {
                App.code_scroll_direction = -1
            }
            else if (event.deltaY > 0) {
                App.code_scroll_direction = 1
            }
        }, {passive: true})
    }
}