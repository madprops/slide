App.cached_songs = App.cached_songs || []

App.fetch_songs_list = async () => {
  try {
    let response = await fetch(`/songs/list`)

    if (!response.ok) {
      throw new Error(`Failed to fetch songs list`)
    }

    let songs = await response.json()

    if (!Array.isArray(songs)) {
      console.error(`Songs list payload was not an array`)
      return []
    }

    return songs
  }
  catch (err) {
    console.error(`Error fetching songs`, err)
    return []
  }
}

App.fetch_song_content = async (song_name) => {
  try {
    let response = await fetch(`/songs/${song_name}.js`)

    if (!response.ok) {
      throw new Error(`Failed to fetch song ${song_name}`)
    }

    return await response.text()
  }
  catch (err) {
    console.error(`Error fetching song content`, err)
    throw err
  }
}

App.create_songs_modal = () => {
  let modal = App.create_list_modal(`songs`)
  let title = DOM.el(`.modal-title`, modal)
  title.textContent = `Select Song`
}

App.open_songs_modal = async () => {
  let items = await App.fetch_songs_list()

  App.show_items_modal(`songs`, {
    items,
    action: (item) => {
      App.load_song(item)
    },
  })
}

App.load_song = async (song_name) => {
  App.close_all_modals()

  try {
    App.set_status(`Loading ${song_name}...`)
    let content = await App.fetch_song_content(song_name)
    App.stop_status_watch()
    App.stop_color_cycle()
    App.clear_draw_context()

    if (App.code_scroll_active) {
      App.defer_code_scroll(App.code_scroll_song_pause_ms)
    }

    await App.play_action(content, true)
    App.set_song_context(song_name)
    App.set_status(`Playing: ${App.underspace(song_name)}`)
  }
  catch (err) {
    App.set_status(`Failed to load song: ${err.message}`)
    console.error(`Failed to load song:`, err)
  }
}