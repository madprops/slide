App.tempo_storage_key = `slide.tempoCpm`
App.endpoint_storage_key = `slide.statusEndpoint`
App.fetch_delay_storage_key = `slide.fetchDelaySeconds`
App.tempo_storage_key = `slide.tempoCpm`
App.volume_storage_key = `slide.volumePercent`

App.load_all_storage = () => {
  App.stor_load_auto_endpoint()
  App.stor_load_auto_delay()
  App.stor_load_song()
}

App.stor_load_auto_endpoint = () => {
  App.load_storage(`endpoint`, App.auto_endpoint)
}

App.stor_load_auto_delay = () => {
  App.load_storage(`delay`, App.auto_delay)
}

App.stor_load_song = () => {
  App.load_storage(`song`, App.auto_delay)
}

App.load_storage = (what, the_variable) => {
  let value = localStorage.getItem(App[`${what}_storage_key`])

  if (value) {
    the_variable = value
  }
}