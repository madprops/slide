import {EditorView} from "codemirror"
import {Decoration} from "@codemirror/view"
import {StateField, StateEffect} from "@codemirror/state"

App.mirror_enabled = true

App.setup_drawer = () => {
  let max_haps = 1000

  App.drawer = new Drawer((active_haps) => {
    if (!App.mirror_enabled || (active_haps.length > max_haps)) {
      return
    }

    let locations = []

    for (let hap of active_haps) {
      if (hap.context && hap.context.locations) {
        locations.push(...hap.context.locations)
      }
      else if (hap.context && hap.context.location) {
        locations.push(hap.context.location)
      }
    }

    if (App.editor) {
      App.editor.dispatch({
        effects: App.set_highlight.of(locations),
      })
    }
  }, [0, 0])
}

App.setup_strudel_mirror = () => {
  App.set_highlight = StateEffect.define()

  App.highlight_extension = StateField.define({
    create() {
      return Decoration.none
    },
    update(decorations, transaction) {
      decorations = decorations.map(transaction.changes)

      for (let effect of transaction.effects) {
        if (effect.is(App.set_highlight)) {
          let new_marks = effect.value.map(loc =>
            Decoration.mark({class: `sh-executing`}).range(loc.start, loc.end),
          )

          return Decoration.set(new_marks, true)
        }
      }

      return decorations
    },
    provide: field => EditorView.decorations.from(field),
  })
}

App.clean_mirror = () => {
  App.editor.dispatch({
    effects: App.set_highlight.of([]),
  })
}

App.toggle_mirror = () => {
  App.mirror_enabled = !App.mirror_enabled

  if (App.mirror_enabled) {
    if (App.is_playing()) {
      App.start_drawer()
    }
  }
  else {
    App.stop_drawer()
    App.clean_mirror()
  }

  App.stor_save_mirror()
}

App.start_drawer = () => {
  if (!App.draw_started) {
    App.drawer.start(App.scheduler)
    App.draw_started = true
  }
}

App.stop_drawer = () => {
  App.drawer.stop()
  App.draw_started = false
}