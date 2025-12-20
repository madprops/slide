App.new_beat = () => {
  App.show_confirm({
    title: `New Beat`,
    message: `Write a beat from scratch?`,
    ok_action: () => {
      App.last_code = ``
      App.current_song = ``
      App.beat_title = ``
      App.set_input(``)
      App.stop_action()
      App.focus_input()
    },
  })
}

App.ask_for_title = () => {
  App.show_prompt({
    title: `Beat Title`,
    placeholder: `Title of the beat`,
    value: App.beat_title,
    action: (title) => {
      if (!title) {
        title = ``
      }

      title = App.remove_multiple_spaces(title).trim()
      App.beat_title = title
      App.update_url()
      App.update_title()
      App.playing()
    },
  })
}