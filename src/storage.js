App.tempo_storage_key = `slide.tempo`
App.auto_endpoint_storage_key = `slide.auto_endpoint`
App.auto_delay_storage_key = `slide.auto_delay`
App.volume_storage_key = `slide.volume`

App.load_storage = (what, on_value) => {
  let value = localStorage.getItem(App[`${what}_storage_key`])
  on_value(value)
}

App.save_storage = (what, value) => {
  localStorage.setItem(App[`${what}_storage_key`], value)
}

// Load

App.load_all_storage = () => {
  App.stor_load_auto_endpoint()
  App.stor_load_auto_delay()
  App.stor_load_tempo()
  App.stor_load_volume()
}

App.stor_load_auto_endpoint = () => {
  App.load_storage(`auto_endpoint`,
    (value) => {
      App.auto_endpoint = value
    }
  )
}

App.stor_load_auto_delay = () => {
  App.load_storage(`auto_delay`,
    (value) => {
      App.auto_delay = parseInt(value)
    }
  )
}

App.stor_load_tempo = () => {
  App.load_storage(`tempo`,
    (value) => {
      App.tempo_cpm = parseInt(value)
    }
  )
}

App.stor_load_volume = () => {
  App.load_storage(`volume`,
    (value) => {
      App.volume_percent = parseInt(value)
    }
  )
}

// Save

App.stor_save_auto_delay = () => {
  App.save_storage(`auto_delay`, App.auto_delay)
}

App.stor_save_auto_endpoint = () => {
  App.save_storage(`auto_endpoint`, App.auto_endpoint)
}

App.stor_save_tempo = () => {
  App.save_storage(`tempo`, App.tempo_cpm)
}

App.stor_save_volume = () => {
  App.save_storage(`volume`, App.volume_percent)
}