App.tempo_storage_key = `slide.tempo`
App.auto_endpoint_storage_key = `slide.auto_endpoint`
App.auto_delay_storage_key = `slide.auto_delay`
App.volume_storage_key = `slide.volume`
App.visual_storage_key = `slide.visual`
App.scope_storage_key = `slide.scope`
App.code_storage_key = `slide.code`
App.lines_storage_key = `slide.lines`
App.mirror_storage_key = `slide.mirror`
App.theme_storage_key = `slide.theme`
App.eq_storage_key = `slide.eq`

App.load_storage = (what, on_value) => {
  let value = localStorage.getItem(App[`${what}_storage_key`])

  if ([null, undefined].includes(value)) {
    return
  }

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
  App.stor_load_visual()
  App.stor_load_scope()
  App.stor_load_code()
  App.stor_load_lines()
  App.stor_load_mirror()
  App.stor_load_theme()
  App.stor_load_eq()
}

App.stor_load_auto_endpoint = () => {
  App.load_storage(`auto_endpoint`,
    (value) => {
      App.auto_endpoint = value
    },
  )
}

App.stor_load_auto_delay = () => {
  App.load_storage(`auto_delay`,
    (value) => {
      App.auto_delay = parseInt(value)
    },
  )
}

App.stor_load_tempo = () => {
  App.load_storage(`tempo`,
    (value) => {
      App.tempo = parseInt(value)
    },
  )
}

App.stor_load_volume = () => {
  App.load_storage(`volume`,
    (value) => {
      App.volume = parseInt(value)
    },
  )
}

App.stor_load_visual = () => {
  App.load_storage(`visual`,
    (value) => {
      App.visual = value
    },
  )
}

App.stor_load_scope = () => {
  App.load_storage(`scope`,
    (value) => {
      App.scope_enabled = App.boolstring(value)
    },
  )
}

App.stor_load_lines = () => {
  App.load_storage(`lines`,
    (value) => {
      App.lines_enabled = App.boolstring(value)
    },
  )
}

App.stor_load_mirror = () => {
  App.load_storage(`mirror`,
    (value) => {
      App.mirror_enabled = App.boolstring(value)
    },
  )
}

App.stor_load_code = () => {
  App.load_storage(`code`,
    (value) => {
      App.last_code = value
    },
  )
}

App.stor_load_theme = () => {
  App.load_storage(`theme`,
    (value) => {
      App.theme = value
    },
  )
}

App.stor_load_eq = () => {
  App.load_storage(`eq`,
    (value) => {
      App.eq = JSON.parse(value)
    },
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
  App.save_storage(`tempo`, App.tempo)
}

App.stor_save_volume = () => {
  App.save_storage(`volume`, App.volume)
}

App.stor_save_visual = () => {
  App.save_storage(`visual`, App.visual)
}

App.stor_save_scope = () => {
  App.save_storage(`scope`, App.scope_enabled)
}

App.stor_save_lines = () => {
  App.save_storage(`lines`, App.lines_enabled)
}

App.stor_save_mirror = () => {
  App.save_storage(`mirror`, App.mirror_enabled)
}

App.stor_save_code = () => {
  App.save_storage(`code`, App.last_code)
}

App.stor_save_theme = () => {
  App.save_storage(`theme`, App.theme)
}

App.stor_save_eq = () => {
  App.save_storage(`eq`, JSON.stringify(App.eq))
}