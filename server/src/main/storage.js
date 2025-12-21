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
App.effects_storage_key = `slide.effects`
App.status_storage_key = `slide.status`
App.eq_storage_key = `slide.eq`
App.reverb_storage_key = `slide.reverb`
App.panning_storage_key = `slide.panning`
App.cutoff_storage_key = `slide.cutoff`
App.delay_storage_key = `slide.delay`

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
  App.stor_load_status()
  App.stor_load_effects()
  App.stor_load_reverb()
  App.stor_load_panning()
  App.stor_load_cutoff()
  App.stor_load_delay()
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

App.stor_load_status = () => {
  App.load_storage(`status`,
    (value) => {
      App.status_enabled = App.boolstring(value)
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

App.stor_load_effects = () => {
  App.load_storage(`effects`,
    (value) => {
      App.effects_enabled = App.boolstring(value)
    },
  )
}

App.stor_load_reverb = () => {
  App.load_storage(`reverb`,
    (value) => {
      App.reverb_enabled = App.boolstring(value)
    },
  )
}

App.stor_load_panning = () => {
  App.load_storage(`panning`,
    (value) => {
      App.panning_enabled = App.boolstring(value)
    },
  )
}

App.stor_load_cutoff = () => {
  App.load_storage(`cutoff`,
    (value) => {
      App.cutoff_enabled = App.boolstring(value)
    },
  )
}

App.stor_load_delay = () => {
  App.load_storage(`delay`,
    (value) => {
      App.delay_enabled = App.boolstring(value)
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

App.stor_save_effects = () => {
  App.save_storage(`effects`, JSON.stringify(App.effects_enabled))
}

App.stor_save_status = () => {
  App.save_storage(`status`, JSON.stringify(App.status_enabled))
}

App.stor_save_reverb = () => {
  App.save_storage(`reverb`, JSON.stringify(App.reverb_enabled))
}

App.stor_save_panning = () => {
  App.save_storage(`panning`, JSON.stringify(App.panning_enabled))
}

App.stor_save_cutoff = () => {
  App.save_storage(`cutoff`, JSON.stringify(App.cutoff_enabled))
}

App.stor_save_delay = () => {
  App.save_storage(`delay`, JSON.stringify(App.delay_enabled))
}