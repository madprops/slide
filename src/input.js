App.code_scroll_frame = undefined
App.code_scroll_last_ts = 0
App.code_scroll_direction = 1
App.code_scroll_active = false
App.code_scroll_speed_px_per_second = 80
App.code_scroll_pause_until = 0
App.code_scroll_wheel_pause_ms = 350
App.code_scroll_song_pause_ms = 1.2 * 1000
App.code_scroll_pending_delay_ms = 0

App.setup_input = () => {
  App.start_input_resize_observer()
}

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

App.reset_code_scroll_for_content = (options = {}) => {
  let delay_ms = 0
  let default_scroll_delay = options.scroll_delay_ms ?? App.code_scroll_song_pause_ms
  let direction = options.direction ?? 1

  if (App.code_scroll_active) {
    if (Number.isFinite(App.code_scroll_pending_delay_ms) && (App.code_scroll_pending_delay_ms > 0)) {
      delay_ms = App.code_scroll_pending_delay_ms
    }
    else if (Number.isFinite(default_scroll_delay) && (default_scroll_delay > 0)) {
      delay_ms = default_scroll_delay
    }
  }

  App.code_scroll_pending_delay_ms = 0
  App.code_scroll_direction = direction
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

App.set_input = (code) => {
  const code_input = App.get_input()

  if (!code_input) {
    return
  }

  code_input.value = code
  code_input.scrollTop = 0
  App.reset_code_scroll_for_content()
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

  let max_scroll = Math.max(0, input.scrollHeight - input.clientHeight)

  input.scrollTop = target

  if (max_scroll <= 0) {
    App.stop_code_scroll()
    return
  }

  // FIX: Only check the bottom boundary if we are actually moving DOWN (direction > 0).
  // Otherwise, the tolerance calculation will snag us as we try to scroll up/away.
  if ((App.code_scroll_direction > 0) && ((Math.ceil(input.scrollTop) + 1) >= max_scroll)) {
    input.scrollTop = max_scroll
    App.reset_code_scroll_for_content({direction: -1})
  }
  // FIX: Only check top boundary if moving UP (direction < 0).
  else if ((App.code_scroll_direction < 0) && (input.scrollTop <= 0)) {
    input.scrollTop = 0
    App.reset_code_scroll_for_content({direction: 1})
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
  App.code_scroll_last_ts = window.performance.now() - 16
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
  let wrapper = DOM.el(`#code-input-wrapper`)
  let code_input = App.get_input()
  let scroll_button = DOM.el(`#code-input-scroll`)
  let max_button = DOM.el(`#code-input-max`)
  let top_button = DOM.el(`#code-input-top`)
  let bottom_button = DOM.el(`#code-input-bottom`)

  if (top_button) {
    DOM.ev(top_button, `click`, (event) => {
      event.preventDefault()
      code_input.scrollTop = 0
      App.reset_code_scroll_for_content()
    })
  }

  if (bottom_button) {
    DOM.ev(bottom_button, `click`, (event) => {
      event.preventDefault()
      code_input.scrollTop = code_input.scrollHeight
      App.reset_code_scroll_for_content({direction: -1})
    })
  }

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

  if (max_button) {
    DOM.ev(max_button, `click`, (event) => {
      App.toggle_max()
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
            if (!is_resizing) {return}

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

        DOM.ev(resize_handle, `dblclick`, (event) => {
          App.toggle_max(`restore`)
        })
      }

      DOM.ev(wrapper, `mouseover`, () => {
        let max_button = DOM.el(`#code-input-max`)

        if (App.input_is_maxed()) {
          max_button.classList.add(`disabled`)
        }
        else {
          max_button.classList.remove(`disabled`)
        }
      })
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

// Add a ResizeObserver to resize the scope canvas when the wrapper is resized
App.start_input_resize_observer = () => {
  let wrapper = DOM.el(`#code-input-wrapper`)

  if (!wrapper) {
    return
  }

  const resizeObserver = new ResizeObserver(() => {
    App.scope_debouncer.call()
  })

  resizeObserver.observe(wrapper)
}

App.toggle_max = (mode = `toggle`) => {
  let wrapper = DOM.el(`#code-input-wrapper`)

  if (!wrapper) {
    return
  }

  let style = getComputedStyle(document.documentElement)
  let height = parseInt(style.getPropertyValue(`--input_height`))
  let max_height = parseInt(style.getPropertyValue(`--input_max_height`))
  let max_width = parseInt(style.getPropertyValue(`--input_max_width`))

  if (mode === `restore`) {
    wrapper.style.height = `${height}px`
    wrapper.style.width = `${max_width}%`
  }
  else if (App.input_is_maxed()) {
    // Restore
    wrapper.style.height = `${height}px`
    wrapper.style.width = `${max_width}%`
  }
  else {
    // Maximize
    wrapper.style.height = `${max_height}px`
    wrapper.style.width = `${max_width}%`
  }
}

App.input_is_maxed = () => {
  let wrapper = DOM.el(`#code-input-wrapper`)

  if (!wrapper) {
    return
  }

  let buffer = 2
  let main = DOM.el(`#main`)
  let main_width = window.innerWidth

  let style = getComputedStyle(document.documentElement)
  let max_height = parseInt(style.getPropertyValue(`--input_max_height`))
  let max_width = parseInt(style.getPropertyValue(`--input_max_width`))
  let cheight = wrapper.offsetHeight
  let cwidth = wrapper.getBoundingClientRect().width

  if (main) {
    let main_style = getComputedStyle(main)
    let padding_left = parseFloat(main_style.paddingLeft) || 0
    let padding_right = parseFloat(main_style.paddingRight) || 0
    let client_width = main.clientWidth || main.getBoundingClientRect().width
    main_width = Math.max(0, client_width - padding_left - padding_right)
  }

  let max_width_px = (max_width / 100) * main_width

  if (Math.abs(cheight - max_height) > buffer) {
    return false
  }

  if (Math.abs(cwidth - max_width_px) > buffer) {
    return false
  }

  return true
}

App.restart_code_scroll = () => {
  let code_input = App.get_input()

  if (code_input) {
    code_input.scrollTop = 0
  }

  if (App.code_scroll_active) {
    App.defer_code_scroll(App.code_scroll_song_pause_ms)
    App.reset_code_scroll_for_content(App.code_scroll_song_pause_ms)
  }
}

App.add_word_to_input = (word) => {
  let textarea = App.get_input()
  let start_pos = textarea.selectionStart
  let end_pos = textarea.selectionEnd
  textarea.value = textarea.value.substring(0, start_pos) + word + textarea.value.substring(end_pos)
  textarea.selectionStart = textarea.selectionEnd = start_pos + word.length
  textarea.focus()
}

App.focus_input = () => {
  App.get_input().focus()
}