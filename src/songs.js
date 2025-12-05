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

App.open_songs_modal = async () => {
  let modal = DOM.el(`#songs-modal`)
  let songs_list = DOM.el(`#songs-list`)
  let filter_input = DOM.el(`#songs-filter`)

  modal.classList.add(`active`)
  songs_list.innerHTML = `<div class="loading">Loading songs...</div>`

  if (filter_input) {
    filter_input.value = ``
    filter_input.disabled = true
    filter_input.oninput = null
    filter_input.onkeydown = null
  }

  let songs = await App.fetch_songs_list()
  App.cached_songs = songs

  if (!songs.length) {
    songs_list.innerHTML = `<div class="loading">No songs found</div>`
    return
  }

  let render_songs = (list) => {
    songs_list.innerHTML = ``

    if (!list.length) {
      songs_list.innerHTML = `<div class="loading">No matching songs</div>`
      return
    }

    for (let song of list) {
      let item = DOM.create(`div`)
      item.className = `song-item`
      item.textContent = App.underspace(song)
      DOM.ev(item, `click`, () => App.load_song(song))
      songs_list.appendChild(item)
    }
  }

  render_songs(App.cached_songs)

  if (!filter_input) {
    return
  }

  let apply_filter = () => {
    let query = filter_input.value.trim().toLowerCase()

    if (!query) {
      render_songs(App.cached_songs)
      return
    }

    let filtered = App.cached_songs.filter((song) => song.toLowerCase().includes(query))
    render_songs(filtered)
  }

  filter_input.disabled = false
  filter_input.focus()
  filter_input.oninput = apply_filter
  filter_input.onkeydown = (event) => {
    if (event.key !== `Enter`) {
      return
    }

    event.preventDefault()
    let first_item = DOM.els(`.song-item`, songs_list)

    if (first_item) {
      first_item.click()
    }
  }
}

App.close_songs_modal = () => {
  let modal = DOM.el(`#songs-modal`)
  modal.classList.remove(`active`)
}

App.load_song = async (song_name) => {
  App.close_songs_modal()

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