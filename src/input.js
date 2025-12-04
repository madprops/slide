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

    let max_button = DOM.el(`#code-input-max`)

    if (max_button) {
        DOM.ev(max_button, `click`, (event) => {
            let style = getComputedStyle(document.documentElement)
            let height = parseInt(style.getPropertyValue(`--input_height`))
            let max_height = parseInt(style.getPropertyValue(`--input_max_height`))
            let cheight = code_input.offsetHeight

            if (Math.abs(cheight - max_height) > 2) {
                code_input.style.height = `${max_height}px`
            }
            else {
                code_input.style.height = `${height}px`
            }
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

        let wrapper = DOM.el(`#code-input-wrapper`)

        if (wrapper) {
            let resize_handle = DOM.el(`#resize-handle`)

            if (resize_handle) {
                let is_resizing = false

                DOM.ev(resize_handle, `mousedown`, (event) => {
                    event.preventDefault()
                    is_resizing = true
                    document.body.style.userSelect = `none`
                    document.body.style.cursor = `se-resize`

                    let controls = DOM.el(`#code-input-controls`)

                    if (controls) {
                        controls.style.opacity = `1`
                        controls.style.pointerEvents = `auto`
                        controls.classList.add(`active`)
                    }

                    resize_handle.style.opacity = `1`
                    resize_handle.style.pointerEvents = `auto`
                    resize_handle.classList.add(`active`)

                    let start_x = event.clientX
                    let start_y = event.clientY
                    let start_width = wrapper.offsetWidth
                    let start_height = wrapper.offsetHeight

                    let mouse_move = (move_event) => {
                        if (!is_resizing) return

                        let new_width = start_width + (move_event.clientX - start_x)
                        let new_height = start_height + (move_event.clientY - start_y)

                        let style = getComputedStyle(document.documentElement)
                        let min_width = parseInt(style.getPropertyValue(`--input_min_width`))
                        let min_height = parseInt(style.getPropertyValue(`--input_min_height`))
                        let max_height = parseInt(style.getPropertyValue(`--input_max_height`))

                        new_width = Math.max(min_width, new_width)
                        new_height = Math.max(min_height, Math.min(max_height, new_height))

                        wrapper.style.width = `${new_width}px`
                        wrapper.style.height = `${new_height}px`
                    }

                    let mouse_up = () => {
                        is_resizing = false
                        document.body.style.userSelect = ``
                        document.body.style.cursor = ``

                        let controls = DOM.el(`#code-input-controls`)

                        if (controls) {
                            controls.style.opacity = ``
                            controls.style.pointerEvents = ``
                            controls.classList.remove(`active`)
                        }

                        resize_handle.style.opacity = ``
                        resize_handle.style.pointerEvents = ``
                        resize_handle.classList.remove(`active`)

                        document.removeEventListener(`mousemove`, mouse_move)
                        document.removeEventListener(`mouseup`, mouse_up)
                    }

                    document.addEventListener(`mousemove`, mouse_move)
                    document.addEventListener(`mouseup`, mouse_up)
                })
            }
        }

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