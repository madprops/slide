App.visual_mode = `auto`

App.create_visual_modal = () => {
  let modal = App.create_list_modal(`visual`)
  let title = DOM.el(`.modal-title`, modal)
  title.textContent = `Select Visual`
}

App.open_visual_modal = async () => {
  let items = [
    `Auto`,
    `None`,
    `Hydra`,
    `Scope`,
    `Piano`,
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

App.visual_markers = {
  start: `\n// __VISUAL_START__`,
  end: `// __VISUAL_END__`
}

App.get_visual_snippet = (mode) => {
  if (mode === `hydra`) {
    return `initHydra(); osc(10, 0.1, 0.8).rotate(0, 0.1).out();`
  }
  else if (mode === `scope`) {
    return `.layer(() => s("sawtooth").freq(50).scope().gain(0))`
  }
  else if (mode === `pianoroll`) {
    return `.layer(() => n("c3 ~ e3 g3").struct("x*8").pianoroll().gain(0))`
  }

  return ``
}

App.apply_visual = (mode) => {
  App.clean_canvas()

  if ([`auto`, `mode`].includes(mode)) {
    return App
  }

  let code = App.last_code || ``
  let start_tag = App.visual_markers.start
  let end_tag = App.visual_markers.end

  // 1. Clean old injection (same as before)
  let regex = new RegExp(`${App.escape_regex(start_tag)}[\\s\\S]*?${App.escape_regex(end_tag)}`, `g`)
  let clean_code = code.replace(regex, ``).trim()

  // 2. PREPEND the new block
  // We add a newline after the block to ensure it separates from user code
  let snippet = App.get_visual_snippet(mode)

  if (!snippet) {
    return
  }

  let new_block = `${start_tag}\n${snippet}\n${end_tag}\n\n`
  let new_code = `${clean_code}\n${new_block}`
  App.play_action(new_code)
}