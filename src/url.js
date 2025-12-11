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

App.load_song_from_query = async () => {
  let query_params = App.get_query_params()
  let requested_song = query_params.get(App.song_query_key)

  if (!requested_song) {
    return false
  }

  try {
    App.set_status(`Loading ${requested_song}...`)
    let content = await App.fetch_song_content(requested_song)
    App.set_input(content)
    App.set_song_context(requested_song)
    App.set_status(`Loaded: ${App.underspace(requested_song)}`)
    return true
  }
  catch (err) {
    App.set_status(`Failed to load song: ${err.message}`)
    console.error(`Failed to load song:`, err)
  }

  return false
}

App.set_cpm_from_query = () => {
  let query_params = App.get_query_params()
  let requested_cpm = query_params.get(App.cpm_query_key)

  if (requested_cpm) {
    let parsed_cpm = parseInt(requested_cpm, 10)

    if (Number.isFinite(parsed_cpm)) {
      App.update_tempo(parsed_cpm)
      App.set_tempo()
    }
  }
}

App.set_beat_title_from_query = () => {
  let query_params = App.get_query_params()
  let beat_title = query_params.get(App.beat_query_key)

  if (beat_title) {
    App.beat_title = beat_title
  }
}