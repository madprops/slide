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