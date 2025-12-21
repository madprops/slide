App.song_cache = {}
App.fetched_songs_date = 0
App.fetched_songs = []
App.song_fetch_delay = 60 * 1000

App.fetch_songs_list = async () => {
  try {
    if (Date.now() - App.fetched_songs_date < App.song_fetch_delay) {
      return App.fetched_songs
    }

    App.loading()
    let response = await fetch(`/songs/list`)

    if (!response.ok) {
      throw new Error(`Failed to fetch songs list`)
    }

    let songs = await response.json()

    if (!Array.isArray(songs)) {
      console.error(`Songs list payload was not an array`)
      App.playing()
      return []
    }

    App.fetched_songs = songs
    App.fetched_songs_date = Date.now()
    App.playing()
    return songs
  }
  catch (err) {
    console.error(`Error fetching songs`, err)
    App.playing()
    return []
  }
}

App.fetch_song_code = async (song_name) => {
  try {
    let response = await fetch(`/songs/${song_name}.js`)

    if (!response.ok) {
      throw new Error(`Failed to fetch song ${song_name}`)
    }

    let content = await response.text()
    let clean_name = App.clean_song_name(song_name)

    let cache = {}
    cache.name = song_name
    cache.clean_name = clean_name
    cache.raw = content
    cache.filtered = App.filter_code(content)
    App.song_cache[song_name] = cache
    App.last_code = content
    return content
  }
  catch (err) {
    console.error(`Error fetching song content`, err)
    throw err
  }
}

App.create_songs_modal = () => {
  let modal = App.create_list_modal(`songs`)
  let title = DOM.el(`.modal-title`, modal)
  title.textContent = `Songs`
}

App.show_songs = async () => {
  let songlist = await App.fetch_songs_list()
  let items = []

  for (let song of songlist) {
    items.push({
      text: song,
      title: `Click to load and play this song`,
    })
  }

  App.show_items_modal(`songs`, {
    items,
    action: (item) => {
      App.load_song(item.text)
    },
  })
}

App.load_song = async (song_name) => {
  App.close_modal(`songs`)

  try {
    App.loading()
    let content = await App.fetch_song_code(song_name)
    App.stop_auto()
    App.beat_title = ``

    if (App.code_scroll_active) {
      App.defer_code_scroll(App.code_scroll_song_pause_ms)
    }

    App.reset_effects()
    App.check_effects()
    await App.play_action(content, true)
    App.set_song_context(song_name)
  }
  catch (err) {
    App.set_status(`Failed to load song: ${err.message}`)
    console.error(`Failed to load song:`, err)
  }
}

App.set_song_context = (song_name = ``) => {
  App.current_song = song_name || ``
  App.set_title(App.underspace(App.current_song))
  App.update_url(App.current_song)
  App.update_title()
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

App.get_matched_song = () => {
  for (let name in App.song_cache) {
    let cache = App.song_cache[name]

    if (cache.filtered === App.last_code) {
      return cache
    }
    else if (cache.raw === App.last_code) {
      return cache
    }
  }
}

App.get_song_name = (clean = false) => {
  let ms = App.get_matched_song()
  let song_name = ``

  if (ms) {
    if (clean) {
      song_name = ms.clean_name
    }
    else {
      song_name = ms.name
    }
  }

  return song_name
}

App.clean_song_name = (name) => {
  return App.capitalize(App.underspace(name))
}