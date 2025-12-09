App.check_scope_slide = () => {
  let a = App.mouse_down_coords
  let b = App.mouse_up_coords
  let y_diff = Math.abs(App.scope_max_y - App.scope_min_y)

  if (y_diff >= App.max_scope_slide_y_dff) {
    return
  }

  if (Math.abs(a.x - b.x) >= App.scope_slide_distance) {
    if (a.x < b.x) {
      App.random_song()
    }
    else {
      App.next_visual()
    }

    App.clear_clicks()
  }
}

App.check_scope_panning = () => {
  let a = App.mouse_down_coords
  let b = App.mouse_up_coords
  let {width, height} = App.get_scope_dimensions()
  let zone = App.scope_panning_zone
  let amount = App.scope_padding_amount

  if ((a.x <= zone) || (b.x <= zone)) {
    App.set_panning(-amount, 3)
    return true
  }
  else if ((a.x >= (width - zone)) ||
    (b.x >= (width - zone))) {
    App.set_panning(amount, 3)
    return true
  }

  return false
}

App.triangle_gesture = () => {
  let get_sq_dist = (p1, p2) => {
    let dx = p1.x - p2.x
    let dy = p1.y - p2.y
    return (dx * dx) + (dy * dy)
  }

  let get_point_line_dist = (p, a, b) => {
    let len_sq = get_sq_dist(a, b)

    if (len_sq === 0) {
      return get_sq_dist(p, a)
    }

    let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / len_sq
    t = Math.max(0, Math.min(1, t))

    return get_sq_dist(p, {x:a.x + (t * (b.x - a.x)), y:a.y + (t * (b.y - a.y))})
  }

  // ramer-douglas-peucker simplification
  let simplify_path = (points, tolerance) => {
    if (points.length <= 2) {
      return points
    }

    let max_sq_dist = 0
    let index = 0
    let end = points.length - 1

    for (let i = 1; i < end; i++) {
      let sq_dist = get_point_line_dist(points[i], points[0], points[end])
      if (sq_dist > max_sq_dist) {
        max_sq_dist = sq_dist
        index = i
      }
    }

    if (max_sq_dist > (tolerance * tolerance)) {
      let left = simplify_path(points.slice(0, index + 1), tolerance)
      let right = simplify_path(points.slice(index), tolerance)
      return left.slice(0, left.length - 1).concat(right)
    }

    return [points[0], points[end]]
  }

  let detect_triangle = (points) => {
    let len = points.length

    if (len < 10) {
      return false // ignore tiny accidental clicks
    }

    // 1. check if shape is closed
    // determine bounding box to get a relative scale for tolerance
    let min_x = Infinity, max_x = -Infinity, min_y = Infinity, max_y = -Infinity

    for (let i = 0; i < len; i++) {
      min_x = Math.min(min_x, points[i].x)
      max_x = Math.max(max_x, points[i].x)
      min_y = Math.min(min_y, points[i].y)
      max_y = Math.max(max_y, points[i].y)
    }

    let diag = Math.hypot(max_x - min_x, max_y - min_y)
    let start = points[0]
    let end = points[len - 1]
    let gap = Math.hypot(start.x - end.x, start.y - end.y)

    // if the gap is larger than 20% of the shape size, it's not closed
    if ((gap / diag) > 0.2) {
      return false
    }

    // 2. simplify the path
    // tolerance is how much curve we allow. 15% of size is a good baseline for "messy" mouse drawing
    let tolerance = diag * 0.15
    let simple_shape = simplify_path(points, tolerance)

    // 3. count vertices
    // a drawn triangle usually simplifies to 4 points: start, corner 1, corner 2, end (which is near start)
    // sometimes 3 if start/end align perfectly with a corner
    let v_count = simple_shape.length
    return (v_count === 3) || (v_count === 4)
  }

  return detect_triangle(App.scope_clicks)
}

App.circle_gesture = () => {
  let clicks = App.scope_clicks

  // Safety check
  if (!clicks || !Array.isArray(clicks)) {
    return false
  }

  let len = clicks.length

  if (len < 8) {
    return false
  }

  let min_x = Infinity
  let max_x = -Infinity
  let min_y = Infinity
  let max_y = -Infinity
  let sum_x = 0
  let sum_y = 0

  for (let i = 0; i < len; i++) {
    let p = clicks[i]

    if (p.x < min_x) {
      { min_x = p.x }
    }

    if (p.x > max_x) {
      { max_x = p.x }
    }

    if (p.y < min_y) {
      { min_y = p.y }
    }

    if (p.y > max_y) {
      { max_y = p.y }
    }

    sum_x += p.x
    sum_y += p.y
  }

  let diag = Math.hypot(max_x - min_x, max_y - min_y)
  let start = clicks[0]
  let end = clicks[len - 1]
  let gap = Math.hypot(start.x - end.x, start.y - end.y)

  // 1. Closure Check
  if ((gap / diag) > 0.35) {
    return false
  }

  // 2. Aspect Ratio Check
  let width = max_x - min_x
  let height = max_y - min_y
  let ratio = width / height

  if ((ratio < 0.4) || (ratio > 2.5)) {
    return false
  }

  // 3. Circularity Check
  let center_x = sum_x / len
  let center_y = sum_y / len
  let sum_r = 0
  let radii = []

  for (let i = 0; i < len; i++) {
    let dx = clicks[i].x - center_x
    let dy = clicks[i].y - center_y
    let r = Math.hypot(dx, dy)
    radii.push(r)
    sum_r += r
  }

  let avg_r = sum_r / len
  let sum_sq_diff = 0

  for (let i = 0; i < len; i++) {
    let diff = radii[i] - avg_r
    sum_sq_diff += diff * diff
  }

  let std_dev = Math.sqrt(sum_sq_diff / len)
  let score = std_dev / avg_r

  // RELAXED: Increased from 0.3 to 0.35
  // This allows "potato" circles to pass, while the Square check (below)
  // will now reject circles, removing the conflict.
  return score < 0.35
}

App.square_gesture = () => {
  let clicks = App.scope_clicks

  if (!clicks || !Array.isArray(clicks)) {
    return false
  }

  let len = clicks.length

  if (len < 10) {
    return false
  }

  let get_sq_dist = (p1, p2) => {
    let dx = p1.x - p2.x
    let dy = p1.y - p2.y
    return (dx * dx) + (dy * dy)
  }

  let get_point_line_dist = (p, a, b) => {
    let len_sq = get_sq_dist(a, b)

    if (len_sq === 0) {
      return get_sq_dist(p, a)
    }

    let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / len_sq
    t = Math.max(0, Math.min(1, t))
    return get_sq_dist(p, {
      x: a.x + (t * (b.x - a.x)),
      y: a.y + (t * (b.y - a.y))
    })
  }

  let simplify_path = (points, tolerance) => {
    if (points.length <= 2) return points
    let max_sq_dist = 0
    let index = 0
    let end = points.length - 1

    for (let i = 1; i < end; i++) {
      let sq_dist = get_point_line_dist(points[i], points[0], points[end])
      if (sq_dist > max_sq_dist) {
        max_sq_dist = sq_dist
        index = i
      }
    }

    if (max_sq_dist > (tolerance * tolerance)) {
      let left = simplify_path(points.slice(0, index + 1), tolerance)
      let right = simplify_path(points.slice(index), tolerance)
      return left.slice(0, left.length - 1).concat(right)
    }
    return [points[0], points[end]]
  }

  // --- Detection Logic ---

  let min_x = Infinity, max_x = -Infinity, min_y = Infinity, max_y = -Infinity

  for (let i = 0; i < len; i++) {
    let p = clicks[i]
    min_x = Math.min(min_x, p.x)
    max_x = Math.max(max_x, p.x)
    min_y = Math.min(min_y, p.y)
    max_y = Math.max(max_y, p.y)
  }

  let diag = Math.hypot(max_x - min_x, max_y - min_y)
  let start = clicks[0]
  let end = clicks[len - 1]
  let gap = Math.hypot(start.x - end.x, start.y - end.y)

  if ((gap / diag) > 0.35) { return false }

  let width = max_x - min_x
  let height = max_y - min_y
  let ratio = width / height

  if (ratio < 0.7 || ratio > 1.4) { return false }

  // STRICTER: Lowered tolerance from 0.12 (12%) to 0.05 (5%)
  // This is the key fix.
  // At 5% tolerance, a curve (circle) cannot be simplified to 4 lines.
  // It will retain many vertices to preserve the curve shape.
  // A square (straight lines) will still simplify to ~5 vertices.
  let tolerance = diag * 0.05
  let simple_shape = simplify_path(clicks, tolerance)
  let v_count = simple_shape.length

  // Now we reject anything with too many vertices.
  // If v_count is > 6, it implies the shape was curved (a circle), so we return false.
  return (v_count >= 5 && v_count <= 6)
}

App.cycle_panning = (amount, iterations) => {
  let start_pan = App.get_panning()
  let counter = 0
  let speed_ms = 200

  let interval_id = setInterval(() => {
    let direction = (counter % 2) === 0 ? -1 : 1
    let offset = amount * direction
    let next_pan = start_pan + offset
    App.set_panning(next_pan)
    counter = counter + 1

    if (counter >= iterations) {
      clearInterval(interval_id)
      App.set_panning(start_pan)
    }
  }, speed_ms)
}

App.gesture_function = (level, action) => {
  App.increase_scope_click_level(level)
  App.cycle_panning(0.9, 12)
  action()
}