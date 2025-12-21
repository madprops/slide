App.max_scope_slide_y_dff = 50
App.scope_panning_zone = 100
App.scope_panning_amount = 0.9
App.scope_slide_distance = 180
App.scope_slide_delay = 800
App.many_clicks_amount = 100

App.gesture_actions = () => {
  App.canvas_effect_1()
}

App.get_gesture_clicks = (group = false) => {
  let clicks = App.get_scope_clicks(group)
  App.gesture_scope_clicks = clicks
  return clicks
}

App.check_gestures = () => {
  let clicks = App.get_gesture_clicks(true)
  let len = clicks.length

  // Slide
  if ((Date.now() - App.scope_mousedown_date) <= App.scope_slide_delay) {
    if (App.check_scope_slide()) {
      return
    }
  }

  let min_clicks = len >= 5

  // Triangle
  if (min_clicks && App.triangle_gesture(clicks.slice(0))) {
    App.gesture_function(2, () => {
      App.gesture_actions()
    })

    return
  }
  // Square
  else if (min_clicks && App.square_gesture(clicks.slice(0))) {
    App.gesture_function(3, () => {
      App.gesture_actions()
    })

    return
  }
  // Circle
  else if (min_clicks && App.circle_gesture(clicks.slice(0))) {
    App.gesture_function(4, () => {
      App.gesture_actions()
    })

    return
  }
  // Plus
  else if (min_clicks && App.plus_gesture(clicks.slice(0))) {
    App.gesture_function(5, () => {
      App.gesture_actions()
    })

    return
  }

  clicks = App.get_gesture_clicks()
  len = clicks.length

  // Many stars
  if (len >= App.many_clicks_amount) {
    App.gesture_function(6, () => {
      App.gesture_actions()
    })

    return
  }

  // Click
  if ((Date.now() - App.scope_mousedown_date) <= App.scope_beep_delay) {
    if (App.check_scope_panning()) {
      return
    }

    App.splash_reverb(2)
  }
}

App.check_scope_slide = () => {
  let a = App.mouse_down_coords
  let b = App.mouse_up_coords
  let y_diff = Math.abs(App.scope_max_y - App.scope_min_y)

  if (y_diff >= App.max_scope_slide_y_dff) {
    return
  }

  if (Math.abs(a.x - b.x) >= App.scope_slide_distance) {
    if (a.x < b.x) {
      App.on_slide_right()
    }
    else {
      App.on_slide_left()
    }

    App.clear_scope_clicks()
    return true
  }

  return false
}

App.check_scope_panning = () => {
  let a = App.mouse_down_coords
  let b = App.mouse_up_coords
  let {width, height} = App.get_scope_dimensions()
  let zone = App.scope_panning_zone
  let amount = App.scope_panning_amount

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

App.circle_gesture = (clicks) => {
  let len = clicks.length

  let min_x = Infinity
  let max_x = -Infinity
  let min_y = Infinity
  let max_y = -Infinity
  let sum_x = 0
  let sum_y = 0

  for (let i = 0; i < len; i++) {
    let p = clicks[i]

    if (p.x < min_x) {
      {min_x = p.x}
    }

    if (p.x > max_x) {
      {max_x = p.x}
    }

    if (p.y < min_y) {
      {min_y = p.y}
    }

    if (p.y > max_y) {
      {max_y = p.y}
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

App.triangle_gesture = (clicks) => {
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
      y: a.y + (t * (b.y - a.y)),
    })
  }

  let get_angle = (p1, p2, p3) => {
    let v1 = {
      x: p1.x - p2.x,
      y: p1.y - p2.y,
    }
    let v2 = {
      x: p3.x - p2.x,
      y: p3.y - p2.y,
    }

    let dot = (v1.x * v2.x) + (v1.y * v2.y)
    let mag1 = Math.sqrt((v1.x * v1.x) + (v1.y * v1.y))
    let mag2 = Math.sqrt((v2.x * v2.x) + (v2.y * v2.y))

    if ((mag1 * mag2) === 0) {
      return 0
    }

    let cosine = dot / (mag1 * mag2)
    cosine = Math.max(-1, Math.min(1, cosine))

    return Math.acos(cosine) * (180 / Math.PI)
  }

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

  let detect_triangle = () => {
    let len = clicks.length

    let min_x = Infinity
    let max_x = -Infinity
    let min_y = Infinity
    let max_y = -Infinity

    for (let i = 0; i < len; i++) {
      min_x = Math.min(min_x, clicks[i].x)
      max_x = Math.max(max_x, clicks[i].x)
      min_y = Math.min(min_y, clicks[i].y)
      max_y = Math.max(max_y, clicks[i].y)
    }

    let diag = Math.hypot(max_x - min_x, max_y - min_y)
    let start = clicks[0]
    let end = clicks[len - 1]
    let gap = Math.hypot(start.x - end.x, start.y - end.y)

    // loose: allow a 20% gap relative to size (easy to close)
    if ((gap / diag) > 0.20) {
      return false
    }

    // loose: allow 15% curvature (allows messy mouse movement)
    let tolerance = diag * 0.15
    let simple_shape = simplify_path(clicks, tolerance)
    let v_count = simple_shape.length

    if ((v_count < 3) || (v_count > 4)) {
      return false
    }

    let corners = simple_shape.slice(0, 3)

    let angles = [
      get_angle(corners[2], corners[0], corners[1]),
      get_angle(corners[0], corners[1], corners[2]),
      get_angle(corners[1], corners[2], corners[0]),
    ]

    for (let i = 0; i < 3; i++) {
      // strictness: only reject angles that are impossibly thin (< 10)
      // or essentially straight lines (> 170)
      if ((angles[i] < 10) || (angles[i] > 170)) {
        return false
      }
    }

    return true
  }

  return detect_triangle()
}

App.square_gesture = (clicks) => {
  let len = clicks.length

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

    let t = (((p.x - a.x) * (b.x - a.x)) + ((p.y - a.y) * (b.y - a.y))) / len_sq
    t = Math.max(0, Math.min(1, t))

    return get_sq_dist(p, {x: a.x + (t * (b.x - a.x)), y: a.y + (t * (b.y - a.y))})
  }

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

  // --- Detection Logic ---

  let min_x = Infinity
  let max_x = -Infinity
  let min_y = Infinity
  let max_y = -Infinity

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

  // 1. Check if the shape is closed relative to its size
  if ((gap / diag) > 0.4) {
    return false
  }

  let width = max_x - min_x
  let height = max_y - min_y
  let ratio = width / height

  // 2. Removed strict square limits (0.7-1.4).
  // Allow anything that isn't a flat line.
  if ((ratio < 0.15) || (ratio > 6.0)) {
    return false
  }

  // 3. Simplify the path
  let tolerance = diag * 0.06 // Slightly relaxed tolerance
  let simple_shape = simplify_path(clicks, tolerance)
  let v_count = simple_shape.length

  // A closed rectangle usually has 5 points (Start, TL, TR, BR, End/Start)
  // We allow 4 (if corners match perfectly) to 6 (if slightly messy)
  if ((v_count < 4) || (v_count > 6)) {
    return false
  }

  // 4. Angle Check (The key to "Flexible but Accurate")
  // Check if corners are roughly orthogonal (90 degrees)
  // A triangle will fail this, but a wide rectangle will pass
  let right_angles = 0

  for (let i = 1; i < (v_count - 1); i++) {
    let prev = simple_shape[i - 1]
    let curr = simple_shape[i]
    let next = simple_shape[i + 1]

    let dx1 = curr.x - prev.x
    let dy1 = curr.y - prev.y
    let dx2 = next.x - curr.x
    let dy2 = next.y - curr.y

    let dot = (dx1 * dx2) + (dy1 * dy2)
    let mag1 = Math.hypot(dx1, dy1)
    let mag2 = Math.hypot(dx2, dy2)

    // Cosine of angle. 0 means 90 degrees.
    // We allow a range of +/- 0.5 (approx 60 to 120 degrees)
    let cos_angle = dot / (mag1 * mag2)

    if (Math.abs(cos_angle) < 0.5) {
      right_angles++
    }
  }

  // We need at least 2 decent corners to confirm it's rect-like
  return right_angles >= 2
}

App.plus_gesture = (clicks) => {
  let len = clicks.length
  let min_x = Infinity
  let max_x = -Infinity
  let min_y = Infinity
  let max_y = -Infinity

  for (let i = 0; i < len; i++) {
    let p = clicks[i]

    if (p.x < min_x) {
      min_x = p.x
    }

    if (p.x > max_x) {
      max_x = p.x
    }

    if (p.y < min_y) {
      min_y = p.y
    }

    if (p.y > max_y) {
      max_y = p.y
    }
  }

  let width = max_x - min_x
  let height = max_y - min_y

  if ((width === 0) || (height === 0)) {
    return false
  }

  let ratio = width / height

  // A plus should be roughly square in aspect ratio
  if ((ratio < 0.4) || (ratio > 2.5)) {
    return false
  }

  let center_x = min_x + (width / 2)
  let center_y = min_y + (height / 2)

  // Define the thickness of the cross bars (25% of total size)
  // Points must fall inside this vertical or horizontal strip
  let tol_x = width * 0.25
  let tol_y = height * 0.25
  let in_cross = 0

  for (let i = 0; i < len; i++) {
    let p = clicks[i]
    let on_v_bar = Math.abs(p.x - center_x) < tol_x
    let on_h_bar = Math.abs(p.y - center_y) < tol_y

    if (on_v_bar || on_h_bar) {
      in_cross++
    }
  }

  // If 85% of points are within the cross shape, it is a match
  let score = in_cross / len
  return score > 0.85
}

App.gesture_function = (level, action) => {
  App.increase_scope_click_level(level)
  App.set_scope_clicks({locked: true, level})
  App.spin_panning()
  action()
}

App.on_slide_left = () => {
  App.next_visual()
}

App.on_slide_right = () => {
  App.next_theme()
}