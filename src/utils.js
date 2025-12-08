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

App.clean_canvas = () => {
  let body = document.body
  let canvases = DOM.els(`canvas`)

  for (let canvas of canvases) {
    if ([`scope-canvas`, `background-canvas`].includes(canvas.id)) {
      continue
    }

    let classList = Array.from(canvas.classList)

    if (classList.some(cls => [`modal-icon`].includes(cls))) {
      continue
    }

    body.removeChild(canvas)
  }
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