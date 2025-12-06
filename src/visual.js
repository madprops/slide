App.animation_frames = 0

App.start_visual = () => {
  App.visual = App.visual || `flux surface`
  App.background_canvas = DOM.el(`#background-canvas`)
  App.background_canvas_ctx = App.background_canvas.getContext(`2d`)

  // Fix: register animations here or at bottom
  App.visual_animations = [
    App.anim_neon_waves,
  ]

  // Fix: Handle window resizing to keep canvas sharp
  window.addEventListener(`resize`, () => {
    if (App.background_canvas) {
      App.background_canvas.width = window.innerWidth
      App.background_canvas.height = window.innerHeight
    }
  })

  // Trigger initial size
  App.background_canvas.width = window.innerWidth
  App.background_canvas.height = window.innerHeight

  App.apply_visual(App.visual)
}

App.create_visual_modal = () => {
  let modal = App.create_list_modal(`visual`)
  let title = DOM.el(`.modal-title`, modal)
  title.textContent = `Select Visual`
}

App.open_visual_modal = async () => {
  let items = [
    `Auto`,
    `Flux Surface`,
    `Hyper Rose`,
    `Bio Tunnel`,
    `Liquid Aether`,
    `Aurora Borealis`,
  ]

  App.show_items_modal(`visual`, {
    items,
    action: (item) => {
      let mode = item.toLowerCase()
      App.apply_visual(mode)
      App.close_modal(`visual`)
    },
  })
}

App.apply_visual = (mode) => {
  App.visual = mode
  App.stor_save_visual()

  if (mode === `auto`) {
    App.clear_visual()
    App.background_canvas.classList.add(`under`)
  }
  else {
    App.background_canvas.classList.remove(`under`)
    App.render_animation()
  }
}

App.anim_bio_tunnel = (c, w, h, f) => {
  // Clear with a slight fade for the trail effect
  // (Your render loop handles the fade, but we can darken it slightly for depth here if needed)

  let cx = w / 2
  let cy = h / 2

  // "t" is our time variable, scaled down
  let t = f * 0.02

  // The "whitehotrobot" signature:
  // multiple rings created by a loop, using sin/cos for organic warping.
  for (let i = 0; i < 40; i++) {
    // Determine the "depth" of the ring
    // We cycle Z so rings come towards us and reset
    let z = (i * 20 + f * 5) % 1000

    // Perspective scale calculation
    // As z gets smaller (closer), scale gets bigger
    let scale = 1000 / (z + 10)

    // Skip if too close (prevents screen nuke)
    if (scale > 20) {
      continue
    }

    c.beginPath()
    c.lineWidth = 2 * scale

    // Color: Alien green/purple shift based on depth and time
    let hue = (t * 50 + z * 0.5) % 360
    c.strokeStyle = `hsla(${hue}, 80%, 60%, ${z / 1000})` // fade out at back

    // Draw a distorted polygon/circle
    for (let j = 0; j <= 6; j++) {
      let angle = (j / 6) * Math.PI * 2

      // The "Organic" distortion:
      // We alter the radius based on time and angle to make it "breathe"
      let distortion = Math.sin(t * 3 + angle * 4) * 50
      let r = (200 + distortion) * scale

      // Rotate the whole tunnel over time
      let rot = t * 0.5

      let x = cx + Math.cos(angle + rot) * r
      let y = cy + Math.sin(angle + rot) * r

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
  const line_gap = 25
  const time = f * 0.03

  c.lineWidth = 2

  // Over-scan vertical loop to ensure waves don't leave gaps at edges
  for (let y = -100; y < h + 100; y += line_gap) {
    c.beginPath()

    // Color gradient from top to bottom
    // We mix time into the hue so the whole ocean shifts colors
    let hue = (y * 0.2 + f * 0.5) % 360
    c.strokeStyle = `hsla(${hue}, 60%, 60%, 0.8)`

    // Draw the horizontal line with distortion
    for (let x = 0; x <= w; x += 20) {
      // Create complex liquid motion by adding two sine waves together
      // Wave 1: Large slow swells
      let wave1 = Math.sin(x * 0.005 + time) * 50
      // Wave 2: Fast ripples
      let wave2 = Math.sin(x * 0.02 - time * 2 + y * 0.01) * 15

      let distortion = wave1 + wave2

      c.lineTo(x, y + distortion)
    }

    c.stroke()
  }
}

App.anim_hyper_rose = (c, w, h, f) => {
  let cx = w / 2
  let cy = h / 2
  let max_r = Math.max(w, h) * 0.8 // Large enough to fill most of the screen
  let t = f * 0.002

  c.lineWidth = 1
  c.globalCompositeOperation = `lighter` // Key for the "energy" look

  // Draw multiple rotated layers to create density
  for (let layer = 0; layer < 15; layer++) {
    let p = layer / 15
    let radius_scale = max_r * (1 - p) // Inner layers are smaller

    // Color logic: Inner hot (yellow/white), Outer cool (blue/purple)
    let hue = (f * 0.2 + layer * 10) % 360
    c.strokeStyle = `hsla(${hue}, 80%, 50%, 0.5)`

    c.beginPath()

    // Draw the "Rose" shape (Maurer Rose inspired)
    // We loop angle 'a' a lot to get a dense mesh
    for (let a = 0; a < Math.PI * 4; a += 0.05) {
      // The magic math: varying radius based on angle and time
      // The '7' and '3' determine the petal count/shape
      let r_mod = Math.sin(a * 7 + t * 5) * Math.cos(a * 3 - t)
      let r = radius_scale * (0.5 + 0.5 * r_mod)

      // Rotate the whole layer
      let rotation = t * (layer + 1)

      let x = cx + Math.cos(a + rotation) * r
      let y = cy + Math.sin(a + rotation) * r

      c.lineTo(x, y)
    }

    c.closePath()
    c.stroke()
  }

  // Reset composite so we don't break the next frame's fade
  c.globalCompositeOperation = `source-over`
}

App.anim_liquid_aether = (c, w, h, f) => {
  // Initialize 400 particles if they don't exist
  if (!App.flow_particles || (App.flow_particles.length === 0)) {
    App.flow_particles = Array(400).fill().map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
    }))
  }

  // Fade trick: We draw a very faint black rect on top to slowly erase old trails
  // This interacts with your main render loop's fade for a double-fade effect
  c.fillStyle = `rgba(0, 0, 0, 0.02)`
  c.fillRect(0, 0, w, h)

  const t = f * 0.005
  c.lineWidth = 2

  App.flow_particles.forEach((p, i) => {
    c.beginPath()

    // Color: Shifts across the screen width
    let hue = (p.x * 0.1 + f * 0.5) % 360
    c.strokeStyle = `hsla(${hue}, 70%, 50%, 0.5)`
    c.moveTo(p.x, p.y)

    // The "Flow" Math:
    // Determine angle based on position (Perlin noise simulation)
    const angle = (Math.cos(p.x * 0.005 + t) + Math.sin(p.y * 0.005 + t)) * Math.PI * 2

    // Move particle
    p.x += Math.cos(angle) * 2
    p.y += Math.sin(angle) * 2

    c.lineTo(p.x, p.y)
    c.stroke()

    // Wrap around screen edges so we never run out of particles

    if (p.x < 0) {
      p.x = w
    }

    if (p.x > w) {
      p.x = 0
    }

    if (p.y < 0) {
      p.y = h
    }

    if (p.y > h) {
      p.y = 0
    }
  })
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
  if (App.visual === `auto`) {
    return
  }

  let width = window.innerWidth
  let height = window.innerHeight
  let bg_fade = `rgba(0, 0, 0, 0.12)`

  App.background_canvas_ctx.fillStyle = bg_fade
  App.background_canvas_ctx.fillRect(0, 0, width, height)

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
  else {
    App.apply_visual(`auto`)
    return
  }

  App.animation_frames++
  requestAnimationFrame(App.render_animation)
}

App.clear_visual = () => {
  let width = window.innerWidth
  let height = window.innerHeight
  App.background_canvas_ctx.clearRect(0, 0, width, height)
}