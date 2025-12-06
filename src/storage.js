App.tempo_storage_key = `slide.tempo`
App.endpoint_storage_key = `slide.auto_endpoint`
App.fetch_delay_storage_key = `slide.auto_delay`
App.volume_storage_key = `slide.volume`

App.load_all_storage = () => {
  App.stor_load_auto_endpoint()
  App.stor_load_auto_delay()
  App.stor_load_tempo()
}

App.stor_load_auto_endpoint = () => {
  App.load_storage(`endpoint`,
    (value) => {
      App.auto_endpoint = value
    }
  )
}

App.stor_load_auto_delay = () => {
  App.load_storage(`delay`,
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

App.load_storage = (what, on_value) => {
  let value = localStorage.getItem(App[`${what}_storage_key`])
  on_value(value)
}

App.save_storage = (what, value) => {
  localStorage.setItem(App[`${what}_storage_key`], value)
}