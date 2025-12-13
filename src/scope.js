const {evalScope} = strudelCore
import * as strudelCore from "@strudel.cycles/core"
import * as strudelMini from "@strudel.cycles/mini"
import * as strudelWebAudio from "@strudel.cycles/webaudio"
import * as strudelTonal from "@strudel.cycles/tonal"
import {getAudioContext, getSuperdoughAudioController} from "superdough"

App.scope_container_el = undefined
App.scope_canvas_el = undefined
App.scope_canvas_ctx = undefined
App.scope_analyser = undefined
App.scope_waveform = undefined
App.scope_animation_id = undefined
App.scope_connected = false
App.scope_pixel_ratio = 1
App.scope_enabled = true
App.scope_max_y = -1
App.scope_min_y = -1

App.scope_background = `#111111da`
App.scope_color = `rgba(204, 198, 239, 1)`
App.scope_click_color_1 = `rgba(162, 171, 234, 0.5)`
App.scope_click_color_2 = `rgba(255, 137, 204, 1)`
App.scope_click_color_3 = `rgba(222, 242, 92, 1)`
App.scope_click_color_4 = `rgba(91, 163, 240, 1)`
App.scope_click_color_5 = `rgba(255, 255, 255, 1)`
App.scope_click_level = 1

App.scope_sine_time = 0
App.scope_clicks = []
App.scope_click_time = 3 * 1000
App.scope_click_size = 18
App.scope_is_drawing = false
App.scope_click_distance = 120
App.scope_mousedown_date = 0
App.scope_beep_delay = 300
App.scope_enable_date = 0
App.scope_click_lock = 250
App.scope_debouncer_delay = 50
App.scope_click_level_time = 3 * 1000
App.scope_clicks_min = 5
App.scope_click_rotation_speed = 0.001

App.setup_scope = () => {
  App.scope_debouncer = App.create_debouncer(() => {
    App.resize_scope_canvas()
  }, App.scope_debouncer_delay)

  App.stor_load_scope()
  App.init_scope_checkbox()
  App.setup_scope_canvas()
  App.start_scope_visualizer()

  if (App.scope_enabled) {
    App.enable_scope_visualizer()
  }
  else {
    App.disable_scope_visualizer()
  }
}

App.get_scope_container = () => {
  if (!App.scope_container_el) {
    App.scope_container_el = DOM.el(`#scope-container`)
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
  if (!App.scope_enabled) {
    return
  }

  if (!App.scope_canvas_el || !App.scope_canvas_ctx) {
    return
  }

  DOM.show(`#scope-container`, 2)
  let ratio = 1

  if (typeof window !== `undefined`) {
    ratio = window.devicePixelRatio || 1
  }

  App.scope_pixel_ratio = ratio

  let wrapper_el = App.get_input_wrapper()
  let container_el = App.get_scope_container()

  // Default fallback
  let css_width = 320

  if (wrapper_el && container_el) {
    // Get the precise fractional width of the wrapper
    let wrapper_rect = wrapper_el.getBoundingClientRect()
    let total_width = wrapper_rect.width

    // Calculate the precise border widths of the container
    // This handles cases where zoom makes borders non-integer values
    let container_style = window.getComputedStyle(container_el)
    let border_left = parseFloat(container_style.borderLeftWidth) || 0
    let border_right = parseFloat(container_style.borderRightWidth) || 0

    // The canvas should be the total wrapper width minus the container borders
    css_width = total_width - border_left - border_right
  }
  else {
    css_width = App.scope_canvas_el.clientWidth || (App.scope_canvas_el.width / ratio)
  }

  let height = App.scope_canvas_el.clientHeight || (App.scope_canvas_el.height / ratio) || 80

  // 1. Set the CSS style explicitly (controls visual layout size)
  // We use the fractional css_width here to align perfectly with the wrapper
  App.scope_canvas_el.style.width = `${css_width}px`
  App.scope_canvas_el.style.height = `${height}px`

  // 2. Set the internal buffer size (controls resolution/sharpness)
  // We round this to the nearest integer for valid canvas attributes
  let scaled_width = Math.round(css_width * ratio)
  let scaled_height = Math.round(height * ratio)

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

  App.scope_canvas_ctx.fillStyle = App.scope_background
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

App.handle_scope_click = (event) => {
  let canvas = App.get_scope_canvas()

  if (!canvas) {
    return
  }

  let rect = canvas.getBoundingClientRect()
  let x = event.clientX - rect.left
  let y = event.clientY - rect.top

  App.scope_clicks.push({x, y, timestamp: Date.now()})
}

App.handle_scope_mouse_down = (event) => {
  App.mouse_down_coords = App.get_scope_coords(event)
  App.scope_mousedown_date = Date.now()
  App.scope_is_drawing = true

  if (App.scope_clicks.length <= App.scope_clicks_min) {
    App.scope_gestures_enabled = true
  }

  App.handle_scope_click(event)
}

App.handle_scope_mouse_move = (event) => {
  if (App.scope_is_drawing) {
    // Increase frequency by adding intermediate points
    let canvas = App.get_scope_canvas()

    if (!canvas) {
      return
    }

    let rect = canvas.getBoundingClientRect()
    let x = event.clientX - rect.left
    let y = event.clientY - rect.top

    if (App.scope_max_y === -1) {
      App.scope_max_y = y
    }
    else if (y > App.scope_max_y) {
      App.scope_max_y = y
    }

    if (App.scope_min_y === -1) {
      App.scope_min_y = y
    }
    else if (y < App.scope_min_y) {
      App.scope_min_y = y
    }

    if (App.scope_last_point) {
      let last_x = App.scope_last_point.x
      let last_y = App.scope_last_point.y

      let dx = x - last_x
      let dy = y - last_y
      let distance = Math.sqrt(dx * dx + dy * dy)
      let steps = Math.ceil(distance / App.scope_click_distance)

      for (let i = 1; i <= steps; i++) {
        let intermediate_x = last_x + (dx * i / steps)
        let intermediate_y = last_y + (dy * i / steps)
        App.scope_clicks.push({x: intermediate_x, y: intermediate_y, timestamp: Date.now()})
      }
    }

    App.scope_clicks.push({x, y, timestamp: Date.now()})
    App.scope_last_point = {x, y}
  }
}

App.handle_scope_mouse_up = (event) => {
  App.mouse_up_coords = App.get_scope_coords(event)
  App.check_gestures()
}

App.increase_scope_click_level = (level) => {
  App.scope_click_level = level
  clearTimeout(App.scope_click_level_timeout)
  App.color_interface(level)

  App.scope_click_level_timeout = setTimeout(() => {
    App.scope_click_level = 1
    App.restore_interface_colors()
  }, App.scope_click_level_time)
}

App.draw_star = (ctx, x, y, radius, spikes, outer_radius, rotation_offset = 0) => {
  let rot = (Math.PI / 2 * 3) + rotation_offset
  let step = Math.PI / spikes

  // calculate the starting point dynamically so the first point rotates too
  let start_x = x + Math.cos(rot) * outer_radius
  let start_y = y + Math.sin(rot) * outer_radius

  ctx.beginPath()
  ctx.moveTo(start_x, start_y)

  for (let i = 0; i < spikes; i++) {
    let x1 = x + Math.cos(rot) * outer_radius
    let y1 = y + Math.sin(rot) * outer_radius
    ctx.lineTo(x1, y1)
    rot += step

    let x2 = x + Math.cos(rot) * radius
    let y2 = y + Math.sin(rot) * radius
    ctx.lineTo(x2, y2)
    rot += step
  }

  ctx.lineTo(start_x, start_y)
  ctx.closePath()
}

App.draw_scope_frame = () => {
  if (!App.scope_enabled) {
    App.stop_scope_loop()
    return
  }

  if (!App.scope_canvas_ctx) {
    App.stop_scope_loop()
    return
  }

  let {width, height} = App.get_scope_dimensions()

  if (!width || !height) {
    App.scope_animation_id = requestAnimationFrame(App.draw_scope_frame)
    return
  }

  // Overshoot the clear/fill area by 10px to catch edge artifacts
  // caused by rounding errors in high-DPI scaling
  let pad = 10
  App.scope_canvas_ctx.clearRect(-pad, -pad, width + (pad * 2), height + (pad * 2))

  App.scope_canvas_ctx.fillStyle = App.scope_background
  App.scope_canvas_ctx.fillRect(-pad, -pad, width + (pad * 2), height + (pad * 2))

  App.scope_canvas_ctx.strokeStyle = App.scope_color
  App.scope_canvas_ctx.lineWidth = 2
  App.scope_canvas_ctx.beginPath()

  let analyser = App.scope_analyser
  let waveform = App.ensure_scope_waveform()

  if (App.is_playing && analyser && waveform) {
    analyser.getByteTimeDomainData(waveform)
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
  }
  else {
    App.scope_sine_time += 0.012
    let num_points = waveform ? waveform.length : 2048
    let slice_width = width / num_points
    let x = 0

    for (let i = 0; i < num_points; i += 1) {
      let phase = (i / num_points) * (Math.PI * 2) * 6
      let amplitude = 0.3
      let normalized = Math.sin(phase + App.scope_sine_time) * amplitude
      let y = (height / 2) + (normalized * (height / 2))

      if (i === 0) {
        App.scope_canvas_ctx.moveTo(x, y)
      }
      else {
        App.scope_canvas_ctx.lineTo(x, y)
      }

      x += slice_width
    }
  }

  App.scope_canvas_ctx.stroke()

  // Draw clicks as stars
  let now = Date.now()
  App.scope_clicks = App.scope_clicks.filter(click => (now - click.timestamp) < App.scope_click_time)

  for (let click of App.scope_clicks) {
    let age = now - click.timestamp
    let angle = 0

    if (App.scope_click_level > 1) {
      angle = age * App.scope_click_rotation_speed
    }

    App.scope_canvas_ctx.fillStyle = App[`scope_click_color_${App.scope_click_level}`]

    // pass the angle as the last argument
    App.draw_star(
      App.scope_canvas_ctx,
      click.x,
      click.y,
      3,
      5,
      App.scope_click_size,
      angle,
    )

    App.scope_canvas_ctx.fill()
  }

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
    DOM.show(container)
  }
  else {
    DOM.hide(container)
  }
}

App.stop_scope_visualizer = () => {
  App.stop_scope_loop()
  App.set_scope_visibility(false)
  App.clear_scope_canvas()
}

App.start_scope_visualizer = () => {
  let canvas = App.setup_scope_canvas()

  if (!canvas) {
    return
  }

  if (!App.scope_connected) {
    App.connect_scope_analyser()
  }
}

App.scope_mouse_enabled = () => {
  return (Date.now() - App.scope_enable_date) >= App.scope_click_lock
}

App.init_scope_click_handler = () => {
  let canvas = App.get_scope_canvas()

  if (!canvas) {
    return
  }

  DOM.ev(canvas, `mousedown`, (event) => {
    App.scope_max_y = -1
    App.scope_min_y = -1

    if (App.scope_mouse_enabled()) {
      App.handle_scope_mouse_down(event)
    }
  })

  DOM.ev(canvas, `mousemove`, (event) => {
    if (App.scope_mouse_enabled()) {
      App.handle_scope_mouse_move(event)
    }
  })

  DOM.ev(canvas, `click`, (event) => {
    if (App.scope_mouse_enabled()) {
      App.handle_scope_click(event)
    }
  })

  DOM.ev(document, `mouseup`, (event) => {
    if (App.scope_mouse_enabled()) {
      App.handle_scope_mouse_up(event)
    }

    App.scope_is_drawing = false
    App.scope_last_point = null
  })

  DOM.ev(canvas, `contextmenu`, (event) => {
    event.preventDefault()
  })
}

App.toggle_scope = () => {
  if (App.scope_enabled) {
    App.disable_scope_visualizer()
  }
  else {
    App.enable_scope_visualizer()
  }
}

App.enable_scope_visualizer = () => {
  App.scope_enabled = true
  App.set_scope_visibility(true)
  App.handle_scope_resize()
  let canvas = App.setup_scope_canvas()

  if (canvas && !App.scope_animation_id) {
    App.start_scope_loop()
  }

  App.scope_enable_date = Date.now()
  App.start_scope_visualizer()
  App.init_scope_click_handler()
  App.stor_save_scope()
}

App.disable_scope_visualizer = () => {
  App.scope_enabled = false
  App.stop_scope_visualizer()
  App.stor_save_scope()
}

App.handle_scope_resize = () => {
  if (!App.scope_canvas_el) {
    return
  }

  App.scope_debouncer.call()

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

  DOM.ev(checkbox, `change`, (event) => {
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

App.get_scope_coords = (event) => {
  let canvas = App.get_scope_canvas()

  if (canvas) {
    let rect = canvas.getBoundingClientRect()
    let x = event.clientX - rect.left
    let y = event.clientY - rect.top
    return {x, y}
  }
}

App.clear_clicks = () => {
  setTimeout(() => {
    App.scope_clicks = []
  }, 100)
}