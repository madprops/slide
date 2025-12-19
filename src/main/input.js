import {EditorView} from "codemirror"
import {keymap, lineNumbers, highlightActiveLineGutter, drawSelection, dropCursor, rectangularSelection, crosshairCursor} from "@codemirror/view"
import {EditorState, Compartment, Prec} from "@codemirror/state"
import {javascript} from "@codemirror/lang-javascript"
import {nord} from "cm6-theme-nord"
import {vscodeKeymap} from "@replit/codemirror-vscode-keymap"
import {indentWithTab, history, defaultKeymap, historyKeymap, copyLineDown, copyLineUp} from "@codemirror/commands"
import {foldGutter, indentOnInput, bracketMatching} from "@codemirror/language"
import {closeBrackets} from "@codemirror/autocomplete"
import {highlightSelectionMatches, searchKeymap, search, selectNextOccurrence} from "@codemirror/search"

App.input_mirror_time = 3 * 1000
App.input_grow_time = 3 * 1000
App.lines_enabled = true

App.setup_input = () => {
  App.create_editor()
  App.max_button = App.get_max_button()

  if (App.lines_enabled) {
    App.enable_lines()
  }
  else {
    App.disable_lines()
  }

  App.max_debouncer = App.create_debouncer(() => {
    App.max_input_if_larger()
  }, 300)
}

App.create_editor = () => {
  App.lineNumbers = lineNumbers
  App.compartment = new Compartment()
  let container = DOM.el(`#code-input-wrapper`)
  let theme = EditorView.theme(App.editor_theme, {dark: true})

  App.setup_strudel_mirror()

  // Group all extensions that render in the gutter
  let gutter_extensions = [
    lineNumbers(),
    highlightActiveLineGutter(),
    foldGutter(),
  ]

  let input_listener = EditorView.updateListener.of((v) => {
    if (v.docChanged) {
      App.on_input_change()
    }
  })

  let extensions = [
    nord,
    theme,
    input_listener,
    App.compartment.of(gutter_extensions),
    EditorState.allowMultipleSelections.of(true),
    App.setup_editor_autocomplete(),

    Prec.highest(
      keymap.of([
        {key: `Ctrl-Shift-Alt-ArrowDown`, run: copyLineDown},
        {key: `Ctrl-Shift-Alt-ArrowUp`, run: copyLineUp},
        {key: `Mod-d`, run: selectNextOccurrence, preventDefault: true},
        ...vscodeKeymap,
      ]),
    ),

    search(),
    history(),
    drawSelection(),
    dropCursor(),
    closeBrackets(),
    indentOnInput(),
    bracketMatching(),
    rectangularSelection(),
    crosshairCursor(),
    highlightSelectionMatches(),
    App.highlight_extension,

    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...searchKeymap,
      indentWithTab,
    ]),

    javascript(),
    EditorView.lineWrapping,
  ]

  let start_state = EditorState.create({
    doc: ``,
    extensions,
  })

  App.editor = new EditorView({
    state: start_state,
    parent: container,
  })

  App.editor.dom.id = `codemirror-wrapper`
}

App.get_input = () => {
  return DOM.el(`#codemirror-wrapper`)
}

App.get_input_wrapper = () => {
  return DOM.el(`#code-input-wrapper`)
}

App.get_input_value = () => {
  // access the current state from the view
  return App.editor.state.doc.toString()
}

App.set_input = (code) => {
  if (App.get_input_value() === code) {
    return
  }

  App.editor.dispatch({
    changes: {
      from: 0,
      to: App.editor.state.doc.length,
      insert: code,
    },
  })

  App.scroll_input_to_top()
  App.reset_code_scroll_for_content()
}

App.init_code_input_controls = () => {
  let wrapper = App.get_input_wrapper()
  let scroll_button = DOM.el(`#code-input-scroll`)
  let max_button = App.get_max_button()
  let top_button = DOM.el(`#code-input-top`)
  let bottom_button = DOM.el(`#code-input-bottom`)
  let sounds_button = DOM.el(`#code-input-sounds`)
  let notes_button = DOM.el(`#code-input-notes`)
  let banks_button = DOM.el(`#code-input-banks`)

  if (top_button) {
    DOM.ev(top_button, `click`, (event) => {
      event.preventDefault()
      App.scroll_input_to_top()
      App.reset_code_scroll_for_content()
    })
  }

  if (bottom_button) {
    DOM.ev(bottom_button, `click`, (event) => {
      event.preventDefault()
      App.scroll_input_to_bottom()
      App.reset_code_scroll_for_content({direction: -1})
    })
  }

  if (scroll_button) {
    DOM.ev(scroll_button, `click`, (event) => {
      event.preventDefault()

      if (App.code_scroll_active) {
        App.stop_code_scroll()
        return
      }

      App.start_code_scroll()
    })
  }

  if (max_button) {
    DOM.ev(max_button, `click`, (event) => {
      App.max_input()
    })
  }

  if (sounds_button) {
    DOM.ev(sounds_button, `click`, (event) => {
      event.preventDefault()
      App.show_sounds_context(event)
    })
  }

  if (notes_button) {
    DOM.ev(notes_button, `click`, (event) => {
      event.preventDefault()
      App.show_notes_context(event)
    })
  }

  if (banks_button) {
    DOM.ev(banks_button, `click`, (event) => {
      event.preventDefault()
      App.show_banks_context(event)
    })
  }

  let input = App.get_input()

  DOM.ev(input, `pointerdown`, (event) => {
    if (!App.code_scroll_active) {
      return
    }

    let target = event.target
    let rect = target.getBoundingClientRect()
    let is_resize_handle = (event.clientX > (rect.right - 20)) && (event.clientY > (rect.bottom - 20))

    if (is_resize_handle) {
      return
    }

    App.stop_code_scroll()
  })

  if (wrapper) {
    let resize_handle = DOM.el(`#resize-handle`)

    if (resize_handle) {
      let is_resizing = false

      DOM.ev(resize_handle, `mousedown`, (event) => {
        event.preventDefault()
        is_resizing = true
        document.body.style.userSelect = `none`
        document.body.style.cursor = `se-resize`

        resize_handle.style.opacity = `1`
        resize_handle.style.pointerEvents = `auto`
        resize_handle.classList.add(`active`)

        let start_x = event.clientX
        let start_y = event.clientY
        let start_width = wrapper.offsetWidth
        let start_height = wrapper.offsetHeight

        let mouse_move = (move_event) => {
          if (!is_resizing) {
            return
          }

          let new_width = start_width + (move_event.clientX - start_x)
          let new_height = start_height + (move_event.clientY - start_y)

          let style = getComputedStyle(document.documentElement)
          let min_width = parseInt(style.getPropertyValue(`--input-min-width`))
          let min_height = parseInt(style.getPropertyValue(`--input-min-height`))

          new_width = Math.max(min_width, new_width)
          new_height = Math.max(min_height, new_height)

          let sw = `${new_width}px`
          let sh = `${new_height}px`

          wrapper.style.width = sw
          wrapper.style.height = sh

          App.set_css_var(`input-width-update`, sw)
          App.enable_max_button()
        }

        let mouse_up = () => {
          is_resizing = false
          document.body.style.userSelect = ``
          document.body.style.cursor = ``

          resize_handle.style.opacity = ``
          resize_handle.style.pointerEvents = ``
          resize_handle.classList.remove(`active`)
          App.resize_scope()
          App.check_max_button()

          document.removeEventListener(`mousemove`, mouse_move)
          document.removeEventListener(`mouseup`, mouse_up)
        }

        DOM.ev(document, `mousemove`, mouse_move)
        DOM.ev(document, `mouseup`, mouse_up)
      })

      DOM.ev(resize_handle, `dblclick`, (event) => {
        App.restore_input()
      })
    }
  }

  DOM.ev(input, `wheel`, (event) => {
    if (App.code_scroll_active) {
      App.stop_code_scroll()
    }
  }, {passive: true})
}

App.restore_input = () => {
  let wrapper = App.get_input_wrapper()

  if (!wrapper) {
    return
  }

  let style = getComputedStyle(document.documentElement)
  let height = parseInt(style.getPropertyValue(`--input-height`))
  let max_width = parseInt(style.getPropertyValue(`--input-max-width`))
  let sw = `${max_width}%`
  wrapper.style.width = sw
  wrapper.style.height = `${height}px`
  App.set_css_var(`input-width-update`, sw)
  App.resize_scope()
  App.check_max_button()
}

App.input_is_maxed = () => {
  let wrapper = App.get_input_wrapper()
  let height_1 = parseInt(wrapper.style.height)
  let width_1 = parseInt(wrapper.style.width)
  let [height_2, width_2] = App.max_input(true)
  let buffer = 2

  if (Math.abs(height_1 - height_2) >= buffer) {
    return false
  }

  if (Math.abs(width_1 - width_2) >= buffer) {
    return false
  }

  return true
}

App.add_text_to_input = (text) => {
  App.editor.dispatch(App.editor.state.replaceSelection(text))
  App.editor.focus()
}

App.focus_input = () => {
  App.editor.focus()
}

App.mirror_input = () => {
  let code_input = App.get_input()
  code_input.classList.add(`mirror`)
  clearTimeout(App.input_mirror_timeout)

  App.input_mirror_timeout = setTimeout(() => {
    code_input.classList.remove(`mirror`)
  }, App.input_mirror_time)
}

App.glow_input = () => {
  let code_input = App.get_input()
  code_input.classList.add(`glow`)
  clearTimeout(App.input_grow_timeout)

  App.input_grow_timeout = setTimeout(() => {
    code_input.classList.remove(`glow`)
  }, App.input_grow_time)
}

App.cursive_input = () => {
  let code_input = App.get_input()
  code_input.classList.add(`cursive`)
  clearTimeout(App.input_grow_timeout)

  App.input_grow_timeout = setTimeout(() => {
    code_input.classList.remove(`cursive`)
  }, App.input_grow_time)
}

App.max_input = (just_check = false, mode = `normal`) => {
  let wrapper = App.get_input_wrapper()
  let style = getComputedStyle(document.documentElement)
  let max_width = parseInt(style.getPropertyValue(`--input-max-width`))
  let diff = App.get_input_diff()
  let sw = `${max_width}%`

  if (!just_check) {
    if (mode === `normal`) {
      wrapper.style.height = `${diff}px`
      wrapper.style.width = sw
    }
    else if (mode === `width`) {
      wrapper.style.width = sw
    }
    else if (mode === `height`) {
      wrapper.style.height = `${diff}px`
    }

    if ([`normal`, `width`].includes(mode)) {
      App.set_css_var(`input-width-update`, sw)
    }

    App.resize_scope()
    App.check_max_button()
  }

  return [diff, max_width]
}

App.get_input_diff = () => {
  let top_height = App.get_top_height()
  let scope_height = App.get_scope_height()
  let status_height = App.get_status_height()
  let bottom_height = App.get_bottom_height()
  let height_sum = top_height + scope_height + bottom_height + status_height
  let total_height = App.viewport_height()
  return total_height - height_sum - 50
}

App.check_max_button = () => {
  if (App.input_is_maxed()) {
    App.disable_max_button()
  }
  else {
    App.enable_max_button()
  }
}

App.get_max_button = () => {
  return DOM.el(`#code-input-max`)
}

App.enable_max_button = () => {
  App.max_button.classList.remove(`disabled`)
}

App.disable_max_button = () => {
  App.max_button.classList.add(`disabled`)
}

App.get_input_height = () => {
  return App.editor.scrollDOM.scrollHeight
}

App.get_input_client_height = () => {
  return App.editor.scrollDOM.clientHeight
}

App.set_input_border = (color) => {
  // 'dom' refers to the outer editor container element
  App.editor.dom.style.borderColor = color
}

App.toggle_lines = () => {
  App.lines_enabled = !App.lines_enabled

  if (App.lines_enabled) {
    App.enable_lines()
  }
  else {
    App.disable_lines()
  }

  App.stor_save_lines()
}

App.enable_lines = () => {
  App.editor.dispatch({
    effects: App.compartment.reconfigure(App.lineNumbers()),
  })
}

App.disable_lines = () => {
  // Reconfigure the compartment with an empty array to remove the extension
  App.editor.dispatch({
    effects: App.compartment.reconfigure([]),
  })
}

App.max_input_if_larger = () => {
  let wrapper = App.get_input_wrapper()
  let height_1 = parseInt(wrapper.style.height)
  let [height_2, width_2] = App.max_input(true)

  if (height_1 > height_2) {
    App.max_input(false, `height`)
  }
}

App.on_input_change = () => {
  App.stop_drawer()
  App.clean_mirror()
}