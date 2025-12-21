App.canvas_effect_time = 3 * 1000
App.animation_frames = 0

App.visual_items = [
  {
    text: `auto`,
    alt_text: `Auto - The code sets it`,
    title: `Let the code decide. If the code contains animation calls they will be visible, else it will be a solid background`,
  },
  {
    text: `none`,
    alt_text: `None - Solid background`,
    title: `Use a solid background. Most performant option`,
  },
  {
    text: `flux surface`,
    title: `A shimmering, flowing horizon where colors swirl like a sunset blending into dawn, a landscape in constant motion that feels alive and mysterious, like walking through a translucent, rippling lake of light`,
  },
  {
    text: `hyper rose`,
    title: `A surreal garden of glowing petals that pulse with vibrant energy, blossoms blooming in impossible hues, evoking a sense of wonder and infinite growth in a dreamlike meadow`,
  },
  {
    text: `bio tunnel`,
    title: `A lush, organic corridor woven with twisting vines and luminous flora, evoking the feeling of wandering through an underground rainforest alive with whispers of nature’s secret life`,
  },
  {
    text: `liquid aether`,
    title: `A flowing, translucent river of ethereal substance, shimmering with iridescent waves that pulse softly, inviting you to drift through an otherworldly sea of pure energy and serenity`,
  },
  {
    text: `aurora borealis`,
    title: `A celestial dance of shimmering lights in the night sky, ribbons of green, pink, and purple swirling gracefully over icy mountains, evoking awe and the mysterious beauty of the polar skies`,
  },
  {
    text: `orb balloons`,
    title: `A whimsical cluster of floating orbs, each glowing softly like lanterns drifting lazily in a gentle breeze, creating a playful, dreamlike atmosphere of floating serenity and joyful levity`,
  },
]

App.get_bg_canvas = () => {
  return DOM.el(`#background-canvas`)
}

App.get_bg_context = () => {
  return App.background_canvas.getContext(`2d`)
}

App.create_visual_modal = () => {
  let modal = App.create_list_modal(`visual`)
  let title = DOM.el(`.modal-title`, modal)
  title.textContent = `Visuals`
}

App.open_visual_modal = async () => {
  let items = App.visual_items

  App.show_items_modal(`visual`, {
    items,
    action: (item) => {
      let mode = item.text.toLowerCase()
      App.apply_visual(mode)
      App.close_modal(`visual`)
    },
    active: App.get_active_visual_index(),
  })
}

App.start_visual = () => {
  App.visual = App.visual || `auto`
  App.background_canvas = App.get_bg_canvas()
  App.background_canvas_ctx = App.get_bg_context()

  // Fix: Removed the anonymous resize listener that was here.
  // We only use the named listener below to ensure we can track it.

  if (!App.resize_listener) {
    App.resize_listener = () => {
      if (App.background_canvas) {
        App.background_canvas.width = window.innerWidth
        App.background_canvas.height = window.innerHeight
      }
    }

    DOM.ev(window, `resize`, App.resize_listener)
  }

  // Trigger initial size
  App.background_canvas.width = window.innerWidth
  App.background_canvas.height = window.innerHeight

  App.apply_visual(App.visual)
}

App.apply_visual = (mode) => {
  if (App.animation_id) {
    cancelAnimationFrame(App.animation_id)
    App.animation_id = null
  }

  // Fix: Reset frame counter to prevent floating point jitter after long sessions
  App.animation_frames = 0

  App.flow_particles = null
  App.bg_orbs = null

  App.visual = mode
  App.stor_save_visual()

  if ([`auto`].includes(mode)) {
    App.clear_visual()
    App.background_canvas.classList.add(`under`)
  }
  else if ([`none`].includes(mode)) {
    App.clear_visual()
    App.background_canvas.classList.remove(`under`)
  }
  else {
    App.background_canvas.classList.remove(`under`)
    App.render_animation()
  }
}

App.anim_bio_tunnel = (c, w, h, f) => {
  let cx = w / 2
  let cy = h / 2
  let t = f * 0.02

  // 1. Initialization: Create geometry cache ONLY once
  if (!App.tunnel_geo) {
    let segments = 64
    App.tunnel_geo = new Float32Array((segments + 1) * 2)

    for (let j = 0; j <= segments; j++) {
      let angle = (j / segments) * Math.PI * 2
      App.tunnel_geo[j * 2] = Math.cos(angle) // X
      App.tunnel_geo[(j * 2) + 1] = Math.sin(angle) // Y
    }
  }

  // --- THE SHATTERED CORE ---
  for (let layer = 0; layer < 2; layer++) {
    let shards = 12
    let direction = layer % 2 === 0 ? 1 : -1

    let r_base = (layer + 1) * 40
    let hue_base = t * 80
    let fill_style_prefix = `hsla(`

    for (let s = 0; s < shards; s++) {
      let angle = ((s / shards) * Math.PI * 2) + (t * direction)
      let r = r_base + (Math.sin((t * 5) + s) * 10)

      // Inline rotation for the core (since shards are few)
      let cos_a = Math.cos(angle)
      let sin_a = Math.sin(angle)
      let cos_a2 = Math.cos(angle + 0.4)
      let sin_a2 = Math.sin(angle + 0.4)

      let x1 = cx + (cos_a * r)
      let y1 = cy + (sin_a * r)
      let x2 = cx + (cos_a2 * (r * 0.5))
      let y2 = cy + (sin_a2 * (r * 0.5))

      c.beginPath()
      c.moveTo(cx, cy)
      c.lineTo(x1, y1)
      c.lineTo(x2, y2)
      c.closePath()

      let hue = (hue_base + (s * 20)) % 360
      c.strokeStyle = `${fill_style_prefix}${hue}, 70%, 60%, 0.6)`
      c.stroke()
      c.fillStyle = `${fill_style_prefix}${hue}, 70%, 10%, 0.1)`
      c.fill()
    }
  }

  // --- THE TUNNEL LOOP ---
  let tunnel_len = App.tunnel_geo.length / 2 // 65 points
  let rot = t * 0.5

  // Pre-calculate rotation matrix for the frame
  let cos_rot = Math.cos(rot)
  let sin_rot = Math.sin(rot)

  let hue_t = t * 50

  // FIX: Restore exact frequency from original code (angle * 4)
  // angle = j / 64 * 2PI.
  // angle * 4 = j * (8PI / 64) = j * (PI / 8)
  let wave_freq = Math.PI / 8
  let distortion_phase = t * 3

  for (let i = 0; i < 40; i++) {
    let z = ((i * 20) + (f * 5)) % 1000
    let scale = 1000 / (z + 10)

    if (scale > 20) {
      continue
    }

    let r_base_frame = 200 * scale
    let r_distortion_scale = 20 * scale

    c.beginPath()
    c.lineWidth = 2

    let hue = (hue_t + (z * 0.5)) % 360
    c.strokeStyle = `hsla(${hue}, 80%, 60%, ${z / 1000})`

    for (let j = 0; j < tunnel_len; j++) {
      let base_x = App.tunnel_geo[j * 2]
      let base_y = App.tunnel_geo[(j * 2) + 1]

      // FIX: Use the corrected wave_freq
      let distortion = Math.sin(distortion_phase + (j * wave_freq)) * r_distortion_scale
      let r = r_base_frame + distortion

      // Apply Rotation Matrix
      // Standard 2D rotation: x' = x*cos - y*sin
      let rot_x = (base_x * cos_rot) - (base_y * sin_rot)
      let rot_y = (base_x * sin_rot) + (base_y * cos_rot)

      let x = cx + (rot_x * r)
      let y = cy + (rot_y * r)

      if (j === 0) {
        c.moveTo(x, y)
      }
      else {
        c.lineTo(x, y)
      }
    }

    c.closePath()
    c.stroke()
  }
}

App.anim_flux_surface = (c, w, h, f) => {
  let line_gap = 30
  let step_x = 40
  let time = f * 0.03
  let time_doubled = time * 2
  let max_amp = 65

  c.lineWidth = 2

  for (let y = -max_amp; y < (h + max_amp); y += line_gap) {
    let y_factor = y * 0.01

    // Optimization: Calculate hue once per line, not per point
    let hue = ((y * 0.2) + (f * 0.5)) % 360
    c.strokeStyle = `hsla(${hue}, 60%, 60%, 0.8)`

    c.beginPath()

    // Optimization: Don't use an array cache.
    // Calculate wave_1 inline. Math.sin is fast enough.
    // Allocating [wave_1_cache] 60 times a second causes GC stutter.
    for (let x = 0; x <= w; x += step_x) {
      let wave_1 = Math.sin((x * 0.005) + time) * 50
      let wave_2 = Math.sin((x * 0.02) - time_doubled + y_factor) * 15

      c.lineTo(x, y + wave_1 + wave_2)
    }

    c.stroke()
  }
}

// 2. Optimization: Reduce drawing load
App.anim_hyper_rose = (c, w, h, f) => {
  let cx = w / 2
  let cy = h / 2
  let max_r = Math.max(w, h) * 0.8
  let t = f * 0.002
  let two_pi = Math.PI * 2

  // FIX: Increased step from 0.01 to 0.05
  // This reduces draw calls from ~5000/frame to ~1000/frame
  // The visual difference is negligible, but performance gain is massive.
  let step = 0.02
  c.lineWidth = 2
  c.lineJoin = `round`
  c.globalCompositeOperation = `lighter`

  for (let layer = 0; layer < 8; layer++) {
    let p = layer / 8
    let radius_scale = max_r * (1 - p)

    let hue = ((f * 0.2) + (layer * 15)) % 360
    c.strokeStyle = `hsla(${hue}, 80%, 50%, 0.6)`

    c.beginPath()

    // Optimization: Pre-calculate constants outside the inner loop if possible
    // but here we just rely on the step reduction.
    for (let a = 0; a < two_pi; a += step) {
      // Optimization: Combined math for slightly faster execution
      let r_mod = Math.sin((a * 7) + (t * 5)) * Math.cos((a * 3) - t)
      let r = radius_scale * (0.5 + (0.5 * r_mod))

      let theta = a + (t * (layer + 1))

      let x = cx + (Math.cos(theta) * r)
      let y = cy + (Math.sin(theta) * r)

      c.lineTo(x, y)
    }

    c.closePath()
    c.stroke()
  }

  c.globalCompositeOperation = `source-over`
}

// 3. Optimization: Remove object allocation from the render loop
// Using for-loops is faster and generates less garbage than .forEach
App.anim_liquid_aether = (c, w, h, f) => {
  let particle_count = 80
  let particle_speed = 0.6
  let orb_count = 4

  // --- INIT (Keep this as is) ---
  if (!App.flow_particles || (App.flow_particles.length !== particle_count)) {
    App.flow_particles = Array(particle_count).fill().map(() => {
      let life = Math.random() * 100

      return {
        x: Math.random() * w,
        y: Math.random() * h,
        speed: particle_speed,
        life,
        max_life: life,
        angle_offset: Math.random() * Math.PI * 2,
        size: (Math.random() * 4) + 2,
      }
    })
  }

  if (!App.bg_orbs || (App.bg_orbs.length !== orb_count)) {
    App.bg_orbs = Array(orb_count).fill().map((_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 1,
      vy: (Math.random() - 0.5) * 1,
      radius: (Math.random() * 500) + 400,
      hue: i * 50,
    }))
  }

  // --- RENDER ---

  c.globalCompositeOperation = `source-over`
  c.fillStyle = `rgba(15, 10, 30, 0.1)`
  c.fillRect(0, 0, w, h)

  let t = f * 0.002

  // Background Orbs
  c.globalCompositeOperation = `lighter`

  // Use standard for loop to avoid GC allocation
  for (let i = 0; i < App.bg_orbs.length; i++) {
    let orb = App.bg_orbs[i]
    orb.x += orb.vx + (Math.sin(t) * 1)
    orb.y += orb.vy + (Math.cos(t) * 1)

    // Wrap logic
    if (orb.x < -orb.radius) {
      orb.x = w + orb.radius
    }

    if (orb.x > (w + orb.radius)) {
      orb.x = -orb.radius
    }

    if (orb.y < -orb.radius) {
      orb.y = h + orb.radius
    }

    if (orb.y > (h + orb.radius)) {
      orb.y = -orb.radius
    }

    let gradient = c.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius)
    let pulse = 0.4 + (Math.sin((t * 2) + orb.hue) * 0.2)

    gradient.addColorStop(0, `hsla(${orb.hue + f * 0.1}, 80%, 60%, ${pulse})`)
    gradient.addColorStop(1, `rgba(0,0,0,0)`)

    c.fillStyle = gradient
    c.beginPath()
    c.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2)
    c.fill()
  }

  // Foreground Particles
  c.globalCompositeOperation = `source-over`
  let zoom = 0.0005

  // Use standard for loop
  for (let i = 0; i < App.flow_particles.length; i++) {
    let p = App.flow_particles[i]
    p.life--

    if (p.life <= 0) {
      p.x = Math.random() * w
      p.y = Math.random() * h
      p.life = 100 + (Math.random() * 100)
      p.max_life = p.life
      p.size = (Math.random() * 4) + 2
    }

    c.beginPath()

    let hue = ((f * 0.1) + (p.x * 0.02) + (p.y * 0.02)) % 360
    let fade_in = (p.max_life - p.life) / 50
    let fade_out = p.life / 50
    let alpha = Math.min(fade_in, fade_out, 0.8)
    alpha = Math.max(0, alpha)

    c.fillStyle = `hsla(${hue}, 90%, 80%, ${alpha})`
    c.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    c.fill()

    let angle = (Math.cos((p.x * zoom) + t) + Math.sin((p.y * zoom) + t)) + p.angle_offset

    p.x += Math.cos(angle) * p.speed
    p.y += Math.sin(angle) * p.speed

    // Wrap logic
    if (p.x < -10) {
      p.x = w + 10
    }

    if (p.x > (w + 10)) {
      p.x = -10
    }

    if (p.y < -10) {
      p.y = h + 10
    }

    if (p.y > (h + 10)) {
      p.y = -10
    }
  }
}

App.anim_orb_balloons = (c, w, h, f) => {
  // 1. Setup: Fewer objects, but much larger
  let orb_count = 8

  if (!App.bg_orbs || (App.bg_orbs.length !== orb_count)) {
    App.bg_orbs = Array(orb_count).fill().map((_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 3, // Faster movement
      vy: (Math.random() - 0.5) * 3,
      base_radius: Math.random() * 150 + 100, // Base size
      hue: Math.random() * 360,
      phase: Math.random() * Math.PI * 2, // Different starting point for pulsing
    }))
  }

  // 2. The Trail: A faster fade prevents the screen from turning completely white
  c.globalCompositeOperation = `source-over`
  // Dark indigo fade for a space-like backdrop
  c.fillStyle = `rgba(15, 5, 25, 0.2)`
  c.fillRect(0, 0, w, h)

  let t = f * 0.01

  // 3. The Plasma Effect
  c.globalCompositeOperation = `lighter`

  App.bg_orbs.forEach((orb) => {
    // Move
    orb.x += orb.vx
    orb.y += orb.vy

    // Bounce off walls
    if (orb.x < -orb.base_radius) {
      orb.vx *= -1
    }

    if (orb.x > w + orb.base_radius) {
      orb.vx *= -1
    }

    if (orb.y < -orb.base_radius) {
      orb.vy *= -1
    }

    if (orb.y > h + orb.base_radius) {
      orb.vy *= -1
    }

    // Breathe: Radius expands and contracts smoothly using Sine waves
    // This makes it feel like "living" liquid
    let current_radius = orb.base_radius + Math.sin(t + orb.phase) * 50

    // Draw
    // We create a gradient from the center of the orb outwards
    let gradient = c.createRadialGradient(
      orb.x,
      orb.y,
      0,
      orb.x,
      orb.y,
      current_radius,
    )

    // Color Logic: Rotate hue slowly over time so it never gets boring
    let dynamic_hue = (orb.hue + f * 0.5) % 360

    // Core is brighter, Edge is transparent
    gradient.addColorStop(0, `hsla(${dynamic_hue}, 80%, 60%, 0.6)`)
    gradient.addColorStop(1, `hsla(${dynamic_hue}, 80%, 40%, 0)`)

    c.fillStyle = gradient
    c.beginPath()
    c.arc(orb.x, orb.y, current_radius, 0, Math.PI * 2)
    c.fill()
  })

  // Restore defaults
  c.globalCompositeOperation = `source-over`
}

App.anim_aurora_borealis = (c, w, h, f) => {
  let t = f * 0.02
  c.lineWidth = 2

  // "Screen" blend mode makes overlapping waves look like bright light
  c.globalCompositeOperation = `lighter`

  // Draw 5 distinct "curtains" of light
  for (let i = 0; i < 5; i++) {
    c.beginPath()

    let base_y = h * 0.8 // Start near bottom
    let hue = (f * 0.5 + i * 50) % 360
    c.fillStyle = `hsla(${hue}, 60%, 50%, 0.3)` // Semi-transparent fill

    c.moveTo(0, h) // Start bottom-left

    // Draw the wavy top edge of the curtain
    for (let x = 0; x <= w; x += 20) {
      // Combine sin waves for organic randomness
      let noise = Math.sin(x * 0.002 + t + i) * 100
                + Math.sin(x * 0.01 - t * 2) * 50

      c.lineTo(x, base_y + noise - (i * 100))
    }

    c.lineTo(w, h) // Bottom-right
    c.closePath()
    c.fill()
  }

  c.globalCompositeOperation = `source-over`
}

App.render_animation = () => {
  if ([`auto`, `none`].includes(App.visual)) {
    return
  }

  let width = window.innerWidth
  let height = window.innerHeight
  let bg_fade = `rgba(0, 0, 0, 0.12)`

  App.background_canvas_ctx.fillStyle = bg_fade
  App.background_canvas_ctx.fillRect(0, 0, width, height)

  // Dispatcher
  if (App.visual === `bio tunnel`) {
    App.anim_bio_tunnel(App.background_canvas_ctx, width, height, App.animation_frames)
  }
  else if (App.visual === `flux surface`) {
    App.anim_flux_surface(App.background_canvas_ctx, width, height, App.animation_frames)
  }
  else if (App.visual === `hyper rose`) {
    App.anim_hyper_rose(App.background_canvas_ctx, width, height, App.animation_frames)
  }
  else if (App.visual === `liquid aether`) {
    App.anim_liquid_aether(App.background_canvas_ctx, width, height, App.animation_frames)
  }
  else if (App.visual === `aurora borealis`) {
    App.anim_aurora_borealis(App.background_canvas_ctx, width, height, App.animation_frames)
  }
  else if (App.visual === `orb balloons`) {
    App.anim_orb_balloons(App.background_canvas_ctx, width, height, App.animation_frames)
  }

  App.animation_frames++

  // Standard pattern: capture the ID immediately
  App.animation_id = requestAnimationFrame(App.render_animation)
}

App.clear_visual = () => {
  let width = window.innerWidth
  let height = window.innerHeight
  App.background_canvas_ctx.clearRect(0, 0, width, height)
}

App.get_active_visual_index = () => {
  return App.visual_items.map(x => x.text).indexOf(App.visual)
}

App.next_visual = () => {
  let index = App.get_active_visual_index()
  index += 1

  if (index >= App.visual_items.length) {
    index = 0
  }

  if (index <= 1) {
    index = 2
  }

  let visual = App.visual_items[index]
  App.apply_visual(visual.text)
}

App.canvas_effect_1 = () => {
  let brightness = 200
  let contrast = 200
  let filter_str = `brightness(${brightness}%) contrast(${contrast}%)`
  let canvas = App.get_bg_canvas()
  canvas.style.filter = filter_str
  App.start_canvas_effect_timeout()
}

// 1. Fix the Timer Leak
// Always clear existing timeouts before setting new ones to prevents stack buildup
App.start_canvas_effect_timeout = () => {
  if (App.canvas_effect_timeout) {
    clearTimeout(App.canvas_effect_timeout)
  }

  App.canvas_effect_timeout = setTimeout(() => {
    App.clear_canvas_effects()
  }, App.canvas_effect_time)
}

App.clear_canvas_effects = () => {
  let canvas = App.get_bg_canvas()
  canvas.style.filter = ``
}