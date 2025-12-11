App.code_scroll_frame = undefined
App.code_scroll_last_ts = 0
App.code_scroll_direction = 1
App.code_scroll_active = false
App.code_scroll_speed_px_per_second = 80
App.code_scroll_pause_until = 0
App.code_scroll_wheel_pause_ms = 1000
App.code_scroll_song_pause_ms = 1.2 * 1000
App.code_scroll_pending_delay_ms = 0
App.input_mirror_time = 2.8 * 1000
App.input_grow_time = 2.8 * 1000

App.setup_input = () => {
  App.start_input_resize_observer()
  App.create_editor()
  App.setup_editor_autocomplete()
  App.max_button = App.get_max_button()
}

App.create_editor = () => {
  let textarea = DOM.el(`#code-input`)

  App.editor = CodeMirror.fromTextArea(textarea, {
    lineNumbers: false,
    theme: `nord`,
    indentWithTabs: true,
    tabSize: 4,
    lineWrapping: true,
    indentUnit: 4,
    smartIndent: false, // Disables context-aware indentation (like after `{`)
    enterMode: `flat`, // Optional: Force cursor to start of line (column 0) on Enter
  })

  App.editor.getWrapperElement().id = `codemirror-wrapper`
  App.document = App.editor.getDoc()
  App.editor.setOption(`mode`, `clike`)
  App.editor.refresh()
  App.editor.focus()
}

App.get_input = () => {
  return DOM.el(`#codemirror-wrapper`)
}

App.get_input_wrapper = () => {
  return DOM.el(`#code-input-wrapper`)
}

App.get_input_value = () => {
  return App.document.getValue()
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
  App.document.setValue(code)
  App.scroll_input_to_top()
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

  if (!App.editor) {
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
  let target = App.get_input_scroll() + (distance * App.code_scroll_direction)
  let max_scroll = Math.max(0, App.get_input_height() - App.get_input_client_height())
  App.set_input_scroll(target)

  if (max_scroll <= 0) {
    App.stop_code_scroll()
    return
  }

  // FIX: Only check the bottom boundary if we are actually moving DOWN (direction > 0).
  // Otherwise, the tolerance calculation will snag us as we try to scroll up/away.
  if ((App.code_scroll_direction > 0) && ((Math.ceil(App.get_input_scroll()) + 1) >= max_scroll)) {
    App.set_input_scroll(max_scroll)
    App.reset_code_scroll_for_content({direction: -1})
  }
  // FIX: Only check top boundary if moving UP (direction < 0).
  else if ((App.code_scroll_direction < 0) && (App.get_input_scroll() <= 0)) {
    App.scroll_input_to_top()
    App.reset_code_scroll_for_content({direction: 1})
  }

  App.code_scroll_frame = window.requestAnimationFrame(App.code_scroll_tick)
}

App.start_code_scroll = () => {
  if (App.code_scroll_active) {
    return
  }

  let max_scroll = Math.max(0, App.get_input_height() - App.get_input_client_height())

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
  let wrapper = App.get_input_wrapper()
  let scroll_button = DOM.el(`#code-input-scroll`)
  let max_button = App.get_max_button()
  let top_button = DOM.el(`#code-input-top`)
  let bottom_button = DOM.el(`#code-input-bottom`)
  let sounds_button = DOM.el(`#code-input-sounds`)
  let notes_button = DOM.el(`#code-input-notes`)
  let banks_button = DOM.el(`#code-input-banks`)

  if (top_button) {
    DOM.ev(top_button, `click`, (event) => {
      event.preventDefault()
      App.scroll_input_to_top()
      App.reset_code_scroll_for_content()
    })
  }

  if (bottom_button) {
    DOM.ev(bottom_button, `click`, (event) => {
      event.preventDefault()
      App.scroll_input_to_bottom()
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
      App.max_input()
    })
  }

  if (sounds_button) {
    DOM.ev(sounds_button, `click`, (event) => {
      event.preventDefault()
      App.show_sounds_context(event)
    })
  }

  if (notes_button) {
    DOM.ev(notes_button, `click`, (event) => {
      event.preventDefault()
      App.show_notes_context(event)
    })
  }

  if (banks_button) {
    DOM.ev(banks_button, `click`, (event) => {
      event.preventDefault()
      App.show_banks_context(event)
    })
  }

  let input = App.get_input()

  DOM.ev(input, `pointerdown`, (event) => {
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

        App.activate_top_input_controls()
        App.activate_bottom_input_controls()

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

          new_width = Math.max(min_width, new_width)
          new_height = Math.max(min_height, new_height)

          wrapper.style.width = `${new_width}px`
          wrapper.style.height = `${new_height}px`
        }

        let mouse_up = () => {
          is_resizing = false
          document.body.style.userSelect = ``
          document.body.style.cursor = ``

          App.deactivate_top_input_controls()
          App.deactivate_bottom_input_controls()

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
        App.restore_input()
      })
    }

    DOM.ev(wrapper, `mouseover`, () => {
      App.check_max_button()
    })
  }

  DOM.ev(input, `wheel`, (event) => {
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

// Add a ResizeObserver to resize the scope canvas when the wrapper is resized
App.start_input_resize_observer = () => {
  let wrapper = App.get_input_wrapper()

  if (!wrapper) {
    return
  }

  let observer = new ResizeObserver(() => {
    App.scope_debouncer.call()
    App.enable_max_button()
  })

  observer.observe(wrapper)
}

App.restore_input = () => {
  let wrapper = App.get_input_wrapper()

  if (!wrapper) {
    return
  }

  let style = getComputedStyle(document.documentElement)
  let height = parseInt(style.getPropertyValue(`--input_height`))
  let max_width = parseInt(style.getPropertyValue(`--input_max_width`))
  wrapper.style.height = `${height}px`
  wrapper.style.width = `${max_width}%`
}

App.input_is_maxed = () => {
  let wrapper = App.get_input_wrapper()
  let height_1 = parseInt(wrapper.style.height)
  let width_1 = parseInt(wrapper.style.width)
  let [height_2, width_2] = App.max_input(true)
  return (height_1 === height_2) && (width_1 === width_2)
}

App.restart_code_scroll = () => {
  App.scroll_input_to_top()

  if (App.code_scroll_active) {
    App.defer_code_scroll(App.code_scroll_song_pause_ms)
    App.reset_code_scroll_for_content(App.code_scroll_song_pause_ms)
  }
}

App.add_text_to_input = (text) => {
  App.document.replaceSelection(text)
  App.editor.focus()
}

App.focus_input = () => {
  App.editor.focus()
}

App.activate_top_input_controls = () => {
  let controls = DOM.el(`#code-input-controls-top`)

  if (controls) {
    controls.style.opacity = `1`
    controls.style.pointerEvents = `auto`
    controls.classList.add(`active`)
  }
}

App.activate_bottom_input_controls = () => {
  let controls = DOM.el(`#code-input-controls-bottom`)

  if (controls) {
    controls.style.opacity = `1`
    controls.style.pointerEvents = `auto`
    controls.classList.add(`active`)
  }
}

App.deactivate_top_input_controls = () => {
  let controls = DOM.el(`#code-input-controls-top`)

  if (controls) {
    controls.style.opacity = `1`
    controls.style.pointerEvents = `auto`
    controls.classList.remove(`active`)
  }
}

App.deactivate_bottom_input_controls = () => {
  let controls = DOM.el(`#code-input-controls-bottom`)

  if (controls) {
    controls.style.opacity = `1`
    controls.style.pointerEvents = `auto`
    controls.classList.remove(`active`)
  }
}

App.mirror_input = () => {
  let code_input = App.get_input()
  code_input.classList.add(`mirror`)
  clearTimeout(App.input_mirror_timeout)

  App.input_mirror_timeout = setTimeout(() => {
    code_input.classList.remove(`mirror`)
  }, App.input_mirror_time)
}

App.glow_input = () => {
  let code_input = App.get_input()
  code_input.classList.add(`glow`)
  clearTimeout(App.input_grow_timeout)

  App.input_grow_timeout = setTimeout(() => {
    code_input.classList.remove(`glow`)
  }, App.input_grow_time)
}

App.cursive_input = () => {
  let code_input = App.get_input()
  code_input.classList.add(`cursive`)
  clearTimeout(App.input_grow_timeout)

  App.input_grow_timeout = setTimeout(() => {
    code_input.classList.remove(`cursive`)
  }, App.input_grow_time)
}

App.max_input = (just_check = false) => {
  let wrapper = App.get_input_wrapper()
  let style = getComputedStyle(document.documentElement)
  let max_width = parseInt(style.getPropertyValue(`--input_max_width`))
  let diff = App.get_input_diff()

  if (!just_check) {
    wrapper.style.height = `${diff}px`
    wrapper.style.width = `${max_width}%`
    App.check_max_button()
  }

  return [diff, max_width]
}

App.get_input_diff = () => {
  let top_height = App.get_top_height()
  let scope_height = App.get_scope_height()
  let controls_height = App.get_controls_height()
  let height_sum = top_height + scope_height + controls_height
  let total_height = App.viewport_height()
  return total_height - height_sum - 33
}

App.check_max_button = () => {
  if (App.input_is_maxed()) {
    App.disable_max_button()
  }
  else {
    App.enable_max_button()
  }
}

App.get_max_button = () => {
  return DOM.el(`#code-input-max`)
}

App.enable_max_button = () => {
  App.max_button.classList.remove(`disabled`)
}

App.disable_max_button = () => {
  App.max_button.classList.add(`disabled`)
}

App.set_input_scroll = (v_amount) => {
  App.editor.scrollTo(null, v_amount)
}

App.scroll_input_to_top = () => {
  App.set_input_scroll(0)
}

App.scroll_input_to_bottom = () => {
  let scroll_info = App.editor.getScrollInfo()
  App.editor.scrollTo(null, scroll_info.height)
}

App.get_input_scroll = () => {
  let scroll_info = App.editor.getScrollInfo()
  return scroll_info.top
}

App.get_input_height = () => {
  let info = App.editor.getScrollInfo()
  return info.height
}

App.get_input_client_height = () => {
  let info = App.editor.getScrollInfo()
  return info.clientHeight
}

App.set_input_border = (color) => {
  let input = App.get_input()
  input.style.borderColor = color
}