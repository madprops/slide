App.code_scroll_frame = undefined
App.code_scroll_last_ts = 0
App.code_scroll_direction = 1
App.code_scroll_active = false
App.code_scroll_speed_px_per_second = 80
App.code_scroll_pause_until = 0
App.code_scroll_wheel_pause_ms = 1000
App.code_scroll_song_pause_ms = 1.2 * 1000
App.code_scroll_pending_delay_ms = 0

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

App.restart_code_scroll = () => {
  App.scroll_input_to_top()

  if (App.code_scroll_active) {
    App.defer_code_scroll(App.code_scroll_song_pause_ms)
    App.reset_code_scroll_for_content(App.code_scroll_song_pause_ms)
  }
}

App.scroll_input_to_top = () => {
  App.set_input_scroll(0)
}

App.scroll_input_to_bottom = () => {
  let scroll_height = App.editor.scrollDOM.scrollHeight
  App.editor.scrollDOM.scrollTop = scroll_height
}

App.get_input_scroll = () => {
  return App.editor.scrollDOM.scrollTop
}

App.set_input_scroll = (v_amount) => {
  let el = App.editor.scrollDOM

  // 1. Update the position
  el.scrollTop = v_amount

  // 2. FORCE the event.
  // CodeMirror listens to 'scroll' to update the viewport.
  // Programmatic scrolling doesn't always fire this synchronously or reliably in a rAF loop.
  el.dispatchEvent(new Event(`scroll`))

  // 3. Keep requesting measure (good practice, ensures internal geometry is checked)
  App.editor.requestMeasure()
}