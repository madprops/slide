App.control_button_throttle = 100
App.control_button_delay = 250

App.def_args = (def, args) => {
  for (let key in def) {
    if ((args[key] === undefined) && (def[key] !== undefined)) {
      args[key] = def[key]
    }
  }
}

App.escape_regex = (s) => {
  return s.replace(/[\^$*+?.()|[\]{}-]/g, `\\$&`)
}

App.underspace = (s) => {
  return s.replace(/_+/g, ` `).trim()
}

App.truncate_path = (path, max_length = 20) => {
  if (path.length <= max_length) {
    return path
  }

  return path.substring(0, max_length) + `...`
}

App.random_int = (args = {}) => {
  let def_args = {
    exclude: [],
  }

  App.def_args(def_args, args)

  if (args.exclude.length > 0) {
    let available = []

    for (let i = args.min; i <= args.max; i++) {
      if (!args.exclude.includes(i)) {
        available.push(i)
      }
    }

    if (available.length === 0) {
      return
    }

    let random_index

    if (args.rand) {
      random_index = Math.floor(args.rand() * available.length)
    }
    else {
      random_index = Math.floor(Math.random() * available.length)
    }

    return available[random_index]
  }

  if (args.rand) {
    return Math.floor(args.rand() * (args.max - args.min + 1) + args.min)
  }

  return Math.floor(Math.random() * (args.max - args.min + 1) + args.min)
}

App.create_debouncer = (func, delay) => {
  if (typeof func !== `function`) {
    App.error(`Invalid debouncer function`)
    return
  }

  if ((typeof delay !== `number`) || (delay < 1)) {
    App.error(`Invalid debouncer delay`)
    return
  }

  let timer
  let obj = {}

  function clear() {
    clearTimeout(timer)
    timer = undefined
  }

  function run(...args) {
    func(...args)
  }

  obj.call = (...args) => {
    clear()

    timer = setTimeout(() => {
      run(...args)
    }, delay)
  }

  obj.call_2 = (...args) => {
    if (timer) {
      return
    }

    obj.call(args)
  }

  obj.now = (...args) => {
    clear()
    run(...args)
  }

  obj.cancel = () => {
    clear()
  }

  return obj
}

App.boolstring = (s) => {
  return s && (s === `true`)
}

App.capitalize = (s) => {
  return s.split(` `).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(` `)
}

App.get_el_height = (el) => {
  if (!el) {
    return 0
  }

  let styles = window.getComputedStyle(el)
  let content_height = el.clientHeight // includes padding but not border
  let padding_top = parseFloat(styles.paddingTop) || 0
  let padding_bottom = parseFloat(styles.paddingBottom) || 0
  let margin_top = parseFloat(styles.marginTop) || 0
  let margin_bottom = parseFloat(styles.marginBottom) || 0

  // clientHeight already includes padding; subtract once and add explicitly
  return content_height - padding_top - padding_bottom +
  padding_top + padding_bottom + margin_top + margin_bottom
}

App.viewport_height = () => {
  return window.innerHeight || document.documentElement.clientHeight
}

App.compress_string = (text) => {
  try {
    return lz.compressToEncodedURIComponent(text)
  }
  catch (err) {
    return ``
  }
}

App.uncompress_string = (hash) => {
  try {
    return lz.decompressFromEncodedURIComponent(hash)
  }
  catch (err) {
    return ``
  }
}

App.make_control_button = (el, action) => {
  DOM.ev(el, `click`, () => {
    action()
  })

  App.remove_context(el, () => {
    action()
  })

  DOM.ev(el, `mousedown`, () => {
    App.ctrl_btn_interval_delay = setTimeout(() => {
      App.ctrl_btn_interval = setInterval(() => {
        action()
      }, App.control_button_throttle)
    }, App.control_button_delay)
  })

  DOM.ev(el, `mouseup`, () => {
    clearInterval(App.ctrl_btn_interval)
    clearInterval(App.ctrl_btn_interval_delay)
  })
}

App.setup_slider = (el, on_auxclick, on_wheel) => {
  let slider = DOM.el(`input`, el)

  App.middle_click(el, () => {
    on_auxclick(slider)
  })

  App.remove_context(el)

  DOM.ev(el, `wheel`, (event) => {
    event.preventDefault()
    let step = parseInt(slider.step, 10)
    let current = parseInt(slider.value, 10)
    let value

    if (event.deltaY < 0) {
      value = current + step
    }
    else {
      value = current - step
    }

    slider.value = value
    on_wheel(value)
  }, {passive: false})
}

App.remove_context = (el, action) => {
  DOM.ev(el, `contextmenu`, (event) => {
    event.preventDefault()

    if (action) {
      action()
    }
  })
}

App.set_css_var = (name, value) => {
  document.documentElement.style.setProperty(`--${name}`, value)
}

App.middle_click = (el, action) => {
  DOM.ev(el, `auxclick`, (event) => {
    if (event.button === 1) {
      action()
      event.preventDefault()
    }
  })
}

App.cond = (branches) => {
  for (let branch of branches) {
    let [check, result] = branch

    // Resolve the condition: if it's a function run it, otherwise use raw value
    let is_hit = typeof check === `function` ? check() : check

    if (is_hit) {
      // Resolve the result: if it`s a function run it, otherwise return raw value
      return typeof result === `function` ? result() : result
    }
  }
}

App.remove_multiple_spaces = (s) => {
  return s.replace(/\s+/g, ` `).trim()
}

App.get_weekday = (timestamp) => {
  let date = new Date(timestamp)
  let options = {weekday: `short`}
  return date.toLocaleDateString(undefined, options)
}

App.num_lines = (s) => {
  if (!s) {
    return 0
  }

  return s.split(`\n`).length
}

App.filename = (s) => {
  s = s.toLowerCase()
  s = s.replace(/\s+/, `_`)
  s = s.substring(0, 100)
  return `${s}.slide`
}