NeedContext.init()

NeedContext.after_hide = () => {
  App.focus_input()
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

  App.show_context(items, event)
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

  App.show_context(items, event)
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

  App.show_context(items, event)
}

App.show_context = (items, event) => {
  if (event) {
    NeedContext.show({x: event.x, y: event.y, items})
  }
  else {
    NeedContext.show({items})
  }
}