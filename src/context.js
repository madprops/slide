NeedContext.init()

NeedContext.after_hide = () => {
  if (App.input_caret_visible(App.get_input())) {
    App.focus_input()
  }
}

App.show_sounds_context = (event) => {
  let items = []

  for (let sound of App.strudel_sounds) {
    items.push({
      text: sound,
      action: () => {
        App.add_word_to_input(sound)
      },
    })
  }

  App.show_context(items, event, `Sounds`)
}

App.show_notes_context = (event) => {
  let items = []

  for (let note of App.strudel_notes) {
    items.push({
      text: note,
      action: () => {
        App.add_word_to_input(note)
      },
    })
  }

  App.show_context(items, event, `Notes`)
}

App.show_banks_context = (event) => {
  let items = []

  for (let bank of App.strudel_banks) {
    items.push({
      text: bank,
      action: () => {
        App.add_word_to_input(bank)
      },
    })
  }

  App.show_context(items, event, `Banks`)
}

App.show_context = (items, event, title) => {
  let args = {items, title}

  if (event) {
    args.x = event.x
    args.y = event.y
  }

  NeedContext.show(args)
}