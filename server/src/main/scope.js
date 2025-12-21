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

App.scope_color = `rgb(204, 198, 239)`
App.scope_background = `rgb(20, 20, 20)`
App.scope_click_color_1 = `rgba(162, 171, 234, 0.5)`
App.scope_click_color_2 = `rgba(255, 137, 204, 1)`
App.scope_click_color_3 = `rgba(222, 242, 92, 1)`
App.scope_click_color_4 = `rgba(91, 163, 240, 1)`
App.scope_click_color_5 = `rgba(114, 248, 146, 1)`
App.scope_click_color_6 = `rgba(255, 255, 255, 1)`
App.scope_click_level = 1

App.scope_sine_time = 0
App.scope_clicks = []
App.scope_click_size = 16
App.scope_is_drawing = false
App.scope_click_distance = 120
App.scope_mousedown_date = 0
App.scope_beep_delay = 300
App.scope_enable_date = 0
App.scope_click_lock = 250
App.scope_clicks_min = 5
App.scope_click_rotation_speed = 0.001
App.scope_click_time = 3 * 1000
App.scope_click_level_time = 3 * 1000
App.gesture_scope_clicks = []

App.setup_scope = () => {
  App.setup_scope_canvas()

  if (App.scope_enabled) {
    App.set_scope_visibility(true)
  }
  else {
    App.set_scope_visibility(false)
  }

  App.setup_time_controls()
  App.init_scope_click_handler()
  App.start_scope_loop()
}

App.init_scope = () => {
  if (App.scope_enabled) {
    App.enable_scope_visualizer()
  }
  else {
    App.disable_scope_visualizer()
  }
}

App.get_scope_wrapper = () => {
  if (!App.scope_wrapper_el) {
    App.scope_wrapper_el = DOM.el(`#scope-wrapper`)
  }

  return App.scope_wrapper_el
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

  return canvas
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
    let audio_ctx = App.get_audio_context()

    if (!audio_ctx) {
      console.warn(`No audio context found yet.`)
      return
    }

    // Connect your analyzer to the existing graph
    let analyser = audio_ctx.createAnalyser()
    analyser.fftSize = 2048
    analyser.minDecibels = -90
    analyser.maxDecibels = -10
    analyser.smoothingTimeConstant = 0.85

    // IMPORTANT: If you are using the 'master_fx' system,
    // you likely want to connect the master gain to this analyser,
    // rather than leaving it dangling.
    if (window.master_fx && window.master_fx.nodes.master_gain) {
      window.master_fx.nodes.master_gain.connect(analyser)
    }
    else {
      // Fallback for raw context (though less likely to capture all sound)
      // Usually, you can't just "connect context to analyser",
      // you need a specific node.
      console.log(`Connecting analyser to destination input`)
      // Note: You can't connect destination TO analyser.
      // You usually insert the analyser BEFORE the destination.
    }

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

  // 1. Get the visualizer's analyser node
  let scope_analyser = App.ensure_scope_analyser()

  if (!scope_analyser) {
    return false
  }

  // 2. Try to connect using your Hijack system
  if (window.master_fx && window.master_fx.nodes && window.master_fx.nodes.master_gain) {
    try {
      // Connect your custom Master Gain to the scope
      window.master_fx.nodes.master_gain.connect(scope_analyser)

      console.log(`Connected Scope to Hijacked Master Gain`)
      App.scope_connected = true
      return true
    }
    catch (err) {
      console.warn(`Failed to connect to master_fx:`, err)
    }
  }

  // 3. Fallback (If hijack isn't active for some reason)
  try {
    // ... keep your old fallback logic here if you want ...
  }
  catch (err) {
    console.warn(`Failed fallback connection`, err)
  }

  return false
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

  App.push_scope_click({x, y, timestamp: Date.now()})
}

App.handle_scope_mouse_down = (event) => {
  App.mouse_down_coords = App.get_scope_coords(event)
  App.scope_mousedown_date = Date.now()
  App.scope_is_drawing = true
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
        App.push_scope_click({x: intermediate_x, y: intermediate_y, timestamp: Date.now()})
      }
    }

    App.push_scope_click({x, y, timestamp: Date.now()})
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
  if (!App.scope_enabled || !App.scope_canvas_ctx) {
    App.stop_scope_loop()
    return
  }

  function next_frame() {
    App.scope_animation_id = requestAnimationFrame(App.draw_scope_frame)
  }

  // Use the stored ratio to ensure 1:1 match with resize
  let ratio = App.scope_pixel_ratio || 1

  // Calculate LOGICAL (CSS) dimensions for drawing
  let width = App.scope_canvas_el.width / ratio
  let height = App.scope_canvas_el.height / ratio

  if (!width || !height) {
    next_frame()
    return
  }

  let ctx = App.scope_canvas_ctx

  // 1. Clear Background
  // We add padding to clear any anti-aliased artifacts at the edges
  let pad = 10
  ctx.clearRect(-pad, -pad, width + (pad * 2), height + (pad * 2))

  ctx.fillStyle = App.scope_background
  ctx.fillRect(-pad, -pad, width + (pad * 2), height + (pad * 2))

  // 2. Draw Waveform
  let waveform = App.ensure_scope_waveform()
  let analyser = App.scope_analyser
  ctx.strokeStyle = App.scope_color

  // FIX: Divide by ratio to keep line thickness consistent on all screens
  ctx.lineWidth = 2 / ratio
  ctx.beginPath()

  // (Your existing waveform logic is fine here)
  if (App.is_playing() && analyser && waveform) {
    analyser.getByteTimeDomainData(waveform)
    let slice_width = width / waveform.length
    let x = 0

    for (let i = 0; i < waveform.length; i++) {
      let v = waveform[i] / 128.0
      let y = (v * height) / 2

      if (i === 0) {
        ctx.moveTo(x, y)
      }
      else {
        ctx.lineTo(x, y)
      }

      x += slice_width
    }
  }
  else {
    // Idle Animation
    App.scope_sine_time += 0.012
    let num_points = 2048
    let slice_width = width / num_points
    let x = 0

    for (let i = 0; i < num_points; i++) {
      let phase = (i / num_points) * Math.PI * 12
      let y = (height / 2) + (Math.sin(phase + App.scope_sine_time) * (height * 0.15))

      if (i === 0) {
        ctx.moveTo(x, y)
      }
      else {
        ctx.lineTo(x, y)
      }

      x += slice_width
    }
  }

  ctx.stroke()

  // 3. Draw Sweep (Progress Bar)
  if (App.scheduler && App.is_playing()) {
    // Calculate phrase progress... (reusing your logic)
    let loop_len = 4
    let now = App.scheduler.now()
    let cps = App.scheduler.cps || 1
    let cycles = (now * cps) - App.seek_offset
    let progress = ((cycles % loop_len) + loop_len) % loop_len / loop_len
    let sweep_x = progress * width

    if (!isNaN(sweep_x)) {
      let gradient = ctx.createLinearGradient(sweep_x, 0, sweep_x, height)
      gradient.addColorStop(0, `rgba(255, 255, 255, 0)`)
      gradient.addColorStop(0.5, `rgba(255, 255, 255, 0.5)`)
      gradient.addColorStop(1, `rgba(255, 255, 255, 0)`)

      ctx.strokeStyle = gradient
      ctx.lineWidth = 4 / ratio // Fix thickness here too
      ctx.beginPath()
      ctx.moveTo(sweep_x, 0)
      ctx.lineTo(sweep_x, height)
      ctx.stroke()
    }
  }

  // 4. Draw Clicks (Stars)
  // Since ctx is scaled, drawing at (click.x, click.y) works naturally
  let now = Date.now()
  App.scope_clicks = App.scope_clicks.filter(c => (now - c.timestamp) < App.scope_click_time)

  for (let click of App.scope_clicks) {
    let age = now - click.timestamp
    let angle = click.level > 1 ? age * App.scope_click_rotation_speed : 0

    ctx.fillStyle = App[`scope_click_color_${click.level}`]

    // Important: Ensure draw_star isn't scaling internally
    App.draw_star(ctx, click.x, click.y, 3, 5, App.scope_click_size, angle)
    ctx.fill()
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
  let wrapper = App.get_scope_wrapper()

  if (!wrapper) {
    return
  }

  if (visible) {
    DOM.show(wrapper)
  }
  else {
    DOM.hide(wrapper)
  }
}

App.stop_scope_visualizer = () => {
  App.stop_scope_loop()
  App.set_scope_visibility(false)
  App.clear_scope_canvas()
}

App.start_scope_visualizer = () => {
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
  App.start_scope_loop()
  App.scope_enable_date = Date.now()
  App.start_scope_visualizer()
  App.resize_scope()
  App.stor_save_scope()
}

App.disable_scope_visualizer = () => {
  App.scope_enabled = false
  App.stop_scope_visualizer()
  App.stor_save_scope()
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

App.clear_scope_clicks = () => {
  setTimeout(() => {
    App.scope_clicks = []
  }, 100)
}

App.resize_scope = () => {
  let input_wrapper = App.get_input_wrapper()
  let canvas = App.scope_canvas_el
  let ctx = App.scope_canvas_ctx

  if (!input_wrapper || !canvas || !ctx) {
    return
  }

  // 2. Measure the Canvas Element (Resolution)
  // CRITICAL: We measure the canvas *after* the wrapper resize.
  // This gives us the width minus the buttons.
  let css_width = canvas.clientWidth
  let css_height = canvas.clientHeight || 120

  // 3. Configure Buffer Resolution
  let ratio = window.devicePixelRatio || 1
  App.scope_pixel_ratio = ratio

  let scaled_width = Math.round(css_width * ratio)
  let scaled_height = Math.round(css_height * ratio)

  // 4. Update Buffer if changed
  if ((canvas.width !== scaled_width) || (canvas.height !== scaled_height)) {
    canvas.width = scaled_width
    canvas.height = scaled_height

    // 5. Reset Transform
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(ratio, ratio)
  }
}

App.get_scope_height = () => {
  if (App.scope_enabled) {
    let el = App.get_scope_wrapper()
    return App.get_el_height(el)
  }

  return 0
}

App.set_scope_clicks = (values) => {
  for (let click of App.gesture_scope_clicks) {
    for (let key in values) {
      click[key] = values[key]
    }
  }
}

App.get_scope_clicks = (group = false) => {
  let clicks = App.scope_clicks.filter((x) => !x.locked)

  if (!group) {
    return clicks
  }

  if (clicks.length < 2) {
    return clicks
  }

  // start with the last click (the anchor)
  let last_click = clicks[clicks.length - 1]
  let queue = [last_click]

  // using a set to keep track of what we've already lumped
  let visited_ids = new Set()

  // assuming points have unique timestamps or object references,
  // we can use the object itself in a Set if references are stable,
  // but let's use a temporary ID or index to be safe.
  // actually, let's just use the 'clicks' index to track visited.
  let visited_indices = new Set()
  visited_indices.add(clicks.length - 1)

  // sensitivity: how big can a gap be before we consider it a separate object?
  // 50px is usually enough to handle fast mouse movement, but small enough
  // to stop before hitting a separate star icon.
  let reach = 50

  let i = 0

  while (i < queue.length) {
    let p = queue[i]
    i++

    // check all other clicks to see if they are close to 'p'
    for (let j = 0; j < clicks.length; j++) {
      if (visited_indices.has(j)) {
        continue
      }

      let candidate = clicks[j]
      let dx = p.x - candidate.x
      let dy = p.y - candidate.y

      // cheap bounding box check first
      if ((Math.abs(dx) > reach) || (Math.abs(dy) > reach)) {
        continue
      }

      let dist = Math.sqrt((dx * dx) + (dy * dy))

      if (dist <= reach) {
        visited_indices.add(j)
        queue.push(candidate)
      }
    }
  }

  // the queue now contains all points that were reachable/connected
  // we must restore the timestamp order for the gesture detection to work
  queue.sort((a, b) => a.timestamp - b.timestamp)

  return queue
}

App.push_scope_click = (args) => {
  args.locked = false
  args.level = 1
  App.scope_clicks.push(args)
}

App.setup_time_controls = () => {
  let rewind = DOM.el(`#time-rewind`)
  let forward = DOM.el(`#time-forward`)

  DOM.ev(rewind, `click`, () => {
    App.rewind_player()
  })

  DOM.ev(forward, `click`, () => {
    App.forward_player()
  })

  App.middle_click(rewind, () => {
    App.rewind_player(5)
  })

  App.middle_click(forward, () => {
    App.forward_player(5)
  })

  App.remove_context(rewind)
  App.remove_context(forward)
}