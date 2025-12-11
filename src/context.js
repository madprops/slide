NeedContext.init()

NeedContext.after_hide = () => {
  App.focus_input()
}

App.show_generic_context = (data_source, title, event) => {
  let items = data_source.map((item) => {
    return {
      text: item,
      action: () => {
        App.add_text_to_input(item)
      },
    }
  })

  App.show_context(items, event, title)
}

App.show_sounds_context = (event) => {
  App.show_generic_context(App.strudel_sounds, `Sounds`, event)
}

App.show_notes_context = (event) => {
  App.show_generic_context(App.strudel_notes, `Notes`, event)
}

App.show_banks_context = (event) => {
  App.show_generic_context(App.strudel_banks, `Banks`, event)
}

App.show_context = (items, event, title) => {
  let args = {items, title}

  if (event) {
    args.x = event.x
    args.y = event.y
  }

  NeedContext.show(args)
}