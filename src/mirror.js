App.mirror_enabled = true

App.setup_strudel_mirror = () => {
  let {
    EditorView, Decoration, StateField, StateEffect,
  } = window.CM

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
  App.stor_save_mirror()
}