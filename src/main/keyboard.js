import {autocompletion} from "@codemirror/autocomplete"

App.start_keyboard = () => {
  DOM.ev(document, `keydown`, (e) => {
    let active = DOM.active()

    if (e.key === `s`) {
      if (e.ctrlKey) {
        e.preventDefault()
        App.play_action()
      }
    }
    else if (e.key === `Escape`) {
      e.preventDefault()

      if (NeedContext.open) {
        return
      }

      if (App.modal_open()) {
        if (active.classList.contains(`modal-filter`) && active.value) {
          active.value = ``
          App.modal_apply_filter()
          return
        }

        App.close_current_modal()
      }
      else if (App.is_playing()) {
        App.pause_action()
      }
      else if (App.is_paused()) {
        App.stop_action()
      }
    }
    else if (e.key === `1`) {
      if (e.ctrlKey) {
        App.show_sounds_context()
      }
    }
    else if (e.key === `2`) {
      if (e.ctrlKey) {
        App.show_notes_context()
      }
    }
    else if (e.key === `3`) {
      if (e.ctrlKey) {
        App.show_banks_context()
      }
    }
  })
}

App.custom_completion_source = (context) => {
  let regex = /(note|bank|sound)\s*\(\s*["']([^"']*)$/
  // 1. Ask CodeMirror if the text before cursor matches our pattern
  let match_object = context.matchBefore(regex)

  if (!match_object) {
    return null
  }

  // 2. ⚡ FIX: Manually execute regex on the text to guarantee we get capture groups
  // (The match_object might be a plain object without array indices in your env)
  let exact_match = match_object.text.match(regex)

  if (!exact_match) {
    return null
  }

  let type = exact_match[1]
  let content = exact_match[2] || ``
  let options_data = []

  if (type === `note`) {
    options_data = App.strudel_notes
  }
  else if (type === `bank`) {
    options_data = App.strudel_banks
  }
  else if (type === `sound`) {
    options_data = App.strudel_sounds
  }

  // Safety check to ensure array exists and has items
  if (!options_data || (options_data.length === 0)) {
    return null
  }

  return {
    from: context.pos - content.length,
    options: options_data.map((opt) => {
      return {
        label: opt,
        type: `text`,
        boost: 99,
      }
    }),
    // Force re-check on every keystroke to handle characters like "/" or "-" correctly
    validFor: () => false,
  }
}

App.setup_editor_autocomplete = () => {
  return autocompletion({
    override: [App.custom_completion_source],
    defaultKeymap: true,
  })
}