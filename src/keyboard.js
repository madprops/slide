App.start_keyboard = () => {
  DOM.ev(document, `keydown`, (e) => {
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
        App.close_current_modal()
      }
      else {
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

App.generic_hint = (cm, callback, items) => {
  let cursor = cm.getCursor()
  let token = cm.getTokenAt(cursor)

  // Strip quotes to get the search term (e.g., "Ak" from "Akai")
  let current_word = token.string.replace(/['"]/g, ``)

  // Filter the list
  let suggestions = items.filter(bank =>
    bank.toLowerCase().startsWith(current_word.toLowerCase()),
  )

  // Debugging: Check if we actually found anything
  if (suggestions.length === 0) {
    console.log(`⚠️ No matches found for:`, current_word)
  }
  else {
    console.log(`✅ Found ${suggestions.length} matches`)
  }

  // Pass the result to CodeMirror's callback
  callback({
    list: suggestions,
    from: {line: cursor.line, ch: token.start + 1}, // +1 to skip open quote
    to: {line: cursor.line, ch: token.end},
  })
}

App.sounds_hint = (cm, callback) => {
  App.generic_hint(cm, callback, App.strudel_sounds)
}

App.notes_hint = (cm, callback) => {
  App.generic_hint(cm, callback, App.strudel_notes)
}

App.banks_hint = (cm, callback) => {
  App.generic_hint(cm, callback, App.strudel_banks)
}

// ⚡ ESSENTIAL: Tell CodeMirror this function is async
App.sounds_hint.async = true
App.notes_hint.async = true
App.banks_hint.async = true

App.sound_hint_func = (cm) => {
  let cursor = cm.getCursor()

  return {
    list: App.strudel_sounds,
    from: cursor,
    to: cursor,
  }
}

App.setup_editor_autocomplete = () => {
  App.editor.on(`inputRead`, (cm, change) => {
    if ((change.text[0] === `"`) || (change.text[0] === `'`)) {
      let cursor = cm.getCursor()
      let line = cm.getLine(cursor.line)
      let text_before = line.slice(0, cursor.ch)

      if (text_before.endsWith(`note("`) || text_before.endsWith(`note('`)) {
        cm.showHint({
          hint: App.notes_hint,
          completeSingle: false,
          container: document.body,
        })
      }
      else if (text_before.endsWith(`bank("`) || text_before.endsWith(`bank('`)) {
        cm.showHint({
          hint: App.banks_hint,
          completeSingle: false,
          container: document.body,
        })
      }
      else if (text_before.endsWith(`sound("`) || text_before.endsWith(`sound('`)) {
        cm.showHint({
          hint: App.sounds_hint,
          completeSingle: false,
          container: document.body,
        })
      }
    }
  })
}