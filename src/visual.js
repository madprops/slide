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

App.apply_visual = (mode) => {
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
  const particle_count = 1000
  const orb_count = 5

  // --- INIT ---
  // 1. Initialize Foreground Particles (The Liquid)
  if (!App.flow_particles || (App.flow_particles.length !== particle_count)) {
    App.flow_particles = Array(particle_count).fill().map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      speed: Math.random() * 1.5 + 0.5,
      life: Math.random() * 100,
    }))
  }

  // 2. Initialize Background Orbs (The Atmosphere)
  if (!App.bg_orbs || (App.bg_orbs.length !== orb_count)) {
    App.bg_orbs = Array(orb_count).fill().map((_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      radius: Math.random() * 200 + 300, // Huge radius
      hue: i * 120, // Spread colors
    }))
  }

  // --- RENDER ---

  // 3. The Fade: Use a dark purple/blue tint instead of pure black
  // This gives the "void" a subtle color instead of emptiness
  c.globalCompositeOperation = `source-over`
  c.fillStyle = `rgba(10, 5, 20, 0.1)`
  c.fillRect(0, 0, w, h)

  const t = f * 0.002

  // 4. Draw Background Orbs
  // These are huge, soft gradients that drift behind everything
  c.globalCompositeOperation = `lighter` // Additive blending for glow

  App.bg_orbs.forEach(orb => {
    // Move orbs slowly
    orb.x += orb.vx + Math.sin(t) * 2
    orb.y += orb.vy + Math.cos(t) * 2

    // Bounce off walls
    if (orb.x < -orb.radius) {
      orb.x = w + orb.radius
    }

    if (orb.x > w + orb.radius) {
      orb.x = -orb.radius
    }

    if (orb.y < -orb.radius) {
      orb.y = h + orb.radius
    }

    if (orb.y > h + orb.radius) {
      orb.y = -orb.radius
    }

    // Draw the soft gradient
    const gradient = c.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius)

    // Pulse the alpha for a "breathing" effect
    const pulse = 0.1 + Math.sin(t * 3 + orb.hue) * 0.05

    gradient.addColorStop(0, `hsla(${orb.hue + f * 0.1}, 60%, 40%, ${pulse})`)
    gradient.addColorStop(1, `rgba(0,0,0,0)`)

    c.fillStyle = gradient
    c.beginPath()
    c.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2)
    c.fill()
  })

  // 5. Draw Foreground Liquid (High Detail)
  c.lineWidth = 0.5
  let zoom = 0.002 + Math.sin(t * 0.5) * 0.001

  App.flow_particles.forEach((p) => {
    p.life--
    if (p.life <= 0) {
      p.x = Math.random() * w
      p.y = Math.random() * h
      p.life = 100 + Math.random() * 100
    }

    c.beginPath()

    // Color: Sync particle hue with the background loop slightly
    let hue = (f * 0.2 + p.x * 0.05 + p.y * 0.05) % 360
    let light = 40 + (p.speed * 30)

    // Higher opacity for foreground to pop against the new background
    c.strokeStyle = `hsla(${hue}, 80%, ${light}%, 0.6)`
    c.moveTo(p.x, p.y)

    const angle = (Math.cos(p.x * zoom + t) + Math.sin(p.y * zoom + t)) * Math.PI * 2

    p.x += Math.cos(angle) * p.speed * 2
    p.y += Math.sin(angle) * p.speed * 2

    c.lineTo(p.x, p.y)
    c.stroke()

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

  // Cleanup
  c.globalCompositeOperation = `source-over`
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

App.get_active_visual_index = () => {
  return App.visual_items.map(x => x.text).indexOf(App.visual)
}