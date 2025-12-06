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

App.load_song_from_query = async () => {
  if (!window || !window.location) {
    return
  }

  let query_params = new URLSearchParams(window.location.search)
  let requested_song = query_params.get(App.song_query_key)
  let requested_cpm = query_params.get(App.cpm_query_key)

  if (requested_cpm) {
    let parsed_cpm = parseInt(requested_cpm, 10)

    if (Number.isFinite(parsed_cpm)) {
      App.update_tempo(parsed_cpm)
      App.set_tempo()
    }
  }

  if (!requested_song) {
    return
  }

  try {
    App.set_status(`Loading ${requested_song}...`)
    let content = await App.fetch_song_content(requested_song)
    App.restart_code_scroll()
    App.set_input(content)
    App.set_song_context(requested_song)
    App.code_to_play = content
    App.set_status(`Loaded: ${App.underspace(requested_song)}`)
  }
  catch (err) {
    App.set_status(`Failed to load song: ${err.message}`)
    console.error(`Failed to load song:`, err)
  }
}

App.set_song_context = (song_name = ``) => {
  App.current_song = song_name || ``
  App.set_title(App.underspace(App.current_song))
  App.update_song_query_param(App.current_song)
}

App.random_song = async () => {
  try {
    let songs = await App.fetch_songs_list()

    if (!songs.length) {
      console.error(`No songs available to pick from`)
      return
    }

    // Filter out the currently loaded song
    let filtered_songs = songs.filter(song => song !== App.current_song)

    if (!filtered_songs.length) {
      console.error(`No songs available after filtering out the current song`)
      return
    }

    // Pick a random song
    let random_index = App.random_int({min: 0, max: filtered_songs.length - 1})
    let random_song = filtered_songs[random_index]

    // Load the random song
    await App.load_song(random_song)
  }
  catch (err) {
    console.error(`Error selecting a random song`, err)
  }
}