App.code_query_key = `code`
App.song_query_key = `song`
App.beat_query_key = `beat`
App.url_query_key = `url`

App.update_url = (song_name = ``) => {
  let next_url = new URL(window.location.href)
  let code = App.get_input_value().trim()

  if (!song_name) {
    song_name = App.get_song_name()
  }

  if (song_name) {
    next_url.searchParams.set(App.song_query_key, song_name)
  }
  else {
    next_url.searchParams.delete(App.song_query_key)
  }

  if (!song_name && App.beat_url) {
    next_url.searchParams.set(App.url_query_key, App.beat_url)
  }
  else {
    next_url.searchParams.delete(App.url_query_key)
  }

  if (code && !song_name && !App.beat_url && (code.length <= App.code_url_max)) {
    let compressed_code = App.compress_string(code)
    next_url.searchParams.set(App.code_query_key, compressed_code)
  }
  else {
    next_url.searchParams.delete(App.code_query_key)
  }

  if (App.beat_title) {
    next_url.searchParams.set(App.beat_query_key, App.beat_title)
  }
  else {
    next_url.searchParams.delete(App.beat_query_key)
  }

  window.history.replaceState({}, document.title, `${next_url.pathname}${next_url.search}${next_url.hash}`)
}

App.load_code_from_query = () => {
  let query_params = new URLSearchParams(window.location.search)
  let hash = query_params.get(App.code_query_key)

  if (!hash) {
    return false
  }

  try {
    let code = App.uncompress_string(hash)
    App.last_code = code
    App.load_last_code()
    return true
  }
  catch (err) {
    App.set_status(`Failed to load song: ${err.message}`)
    console.error(`Failed to load song:`, err)
  }

  return false
}

App.load_url_from_query = () => {
  let query_params = new URLSearchParams(window.location.search)
  let url = query_params.get(App.url_query_key)

  if (!url) {
    return false
  }

  try {
    App.beat_url = url
    App.load_beat_url()
    return true
  }
  catch (err) {
    App.set_status(`Failed to load song: ${err.message}`)
    console.error(`Failed to load song:`, err)
  }

  return false
}

App.load_song_from_query = async () => {
  let query_params = App.get_query_params()
  let requested_song = query_params.get(App.song_query_key)

  if (!requested_song) {
    return false
  }

  try {
    App.loading()
    let code = await App.fetch_song_code(requested_song)
    App.set_input(code)
    App.set_song_tempo(code)
    App.set_song_context(requested_song)
    return true
  }
  catch (err) {
    App.set_status(`Failed to load song: ${err.message}`)
    console.error(`Failed to load song:`, err)
  }

  return false
}

App.set_beat_title_from_query = () => {
  let query_params = App.get_query_params()
  let beat_title = query_params.get(App.beat_query_key)

  if (beat_title) {
    App.beat_title = beat_title
  }
}

App.get_beat_url = () => {
  App.show_prompt({
    title: `Load URL`,
    placeholder: `javascript / text file`,
    value: App.beat_url || ``,
    action: (url) => {
      if (!url) {
        return
      }

      App.beat_url = url.trim()
      App.load_beat_url(true)
    },
  })
}

App.load_beat_url = async (play = false) => {
  App.update_url()

  if (!App.beat_url) {
    return
  }

  try {
    App.loading()
    let response = await fetch(App.beat_url)

    if (!response.ok) {
      throw new Error(`Failed to fetch the beat at ${App.beat_url}`)
    }

    let content = await response.text()

    if (!content) {
      App.playing()
      return
    }

    try {
      let item = JSON.parse(content)
      App.use_snapshot(item)
      content = item.code
    }
    catch (err) {
      // Not json
    }

    let code = content.trim()

    if (!code) {
      App.playing()
      return
    }

    App.stop_auto()
    App.last_code = code
    let filtered = App.filter_code(code)
    App.url_code = filtered
    App.set_input(code)
    App.set_song_tempo(code)
    App.update_url()
    App.playing()

    if (play) {
      App.play_action(code, true)
    }
  }
  catch (err) {
    console.error(err)
    App.playing()
  }
}

App.is_url_beat = () => {
  return App.url_code === App.last_code
}