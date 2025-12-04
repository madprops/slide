App.get_input = () => {
    return DOM.el(`#code-input`)
}

App.set_input = (code) => {
    const code_input = App.get_input()
    code_input.value = code
    code_input.scrollTop = 0
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
                return
            }

            App.start_code_scroll()
        })
    }

    if (code_input) {
        DOM.ev(code_input, `pointerdown`, () => {
            if (!App.code_scroll_active) {
                return
            }

            App.stop_code_scroll()
        })
    }
}