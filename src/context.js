NeedContext.init()

NeedContext.after_hide = () => {
  App.focus_input()
}

App.show_sound_context = () => {
  let items = []

  for (let sound of App.strudel_sounds) {
    items.push({
      text: sound,
      action: () => {
        App.add_word_to_input(`${sound} `)
      },
    })
  }

  NeedContext.show({items})
}

App.show_note_context = () => {
  let items = []

  for (let note of App.strudel_notes) {
    items.push({
      text: note,
      action: () => {
        App.add_word_to_input(`${note} `)
      },
    })
  }

  NeedContext.show({items})
}

App.show_bank_context = () => {
  let items = []

  for (let bank of App.strudel_banks) {
    items.push({
      text: bank,
      action: () => {
        App.add_word_to_input(`${bank}")`)
      },
    })
  }

  NeedContext.show({items})
}