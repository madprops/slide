App.modal_factory = (id, mode) => {
  let template = DOM.el(`#${mode}`)
  let container = DOM.create(`div`)
  container.innerHTML = template.innerHTML
  DOM.el(`#modals`).appendChild(container)
  let modal = DOM.el(`.modal`, container)
  modal.id = `${id}-modal`
  return modal
}

App.create_modal = (id) => {
  return App.modal_factory(id, `template-modal`)
}

App.create_list_modal = (id) => {
  let modal = App.modal_factory(id, `template-list-modal`)
  let filter = DOM.el(`.modal-filter`, modal)
  filter.id = `${id}-modal-filter`
  return modal
}

App.create_modals = () => {
  App.create_about_modal()
  App.create_songs_modal()
  App.create_auto_modal()
  App.create_visual_modal()
  App.create_settings_modal()
  App.create_prompt_modal()
  App.create_confirm_modal()
  App.create_scope_color_modal()

  DOM.ev(`#main`, `click`, (event) => {
    let close_btn = event.target.closest(`.modal-close`)

    if (close_btn) {
      let modal = close_btn.closest(`.modal`)

      if (modal) {
        App.do_close_modal(modal)
      }
    }
  })

  DOM.ev(`#modal-overlay`, `click`, (event) => {
    App.close_all_modals()
  })
}

App.show_items_modal = async (id, args = {}) => {
  let def_args = {
    loaded: false,
    active: -1,
    capitalize: true,
    icons: true,
  }

  App.def_args(def_args, args)
  let loaded = args.loaded || false
  let modal = DOM.el(`#${id}-modal`)
  let modal_list = DOM.el(`.modal-body`, modal)
  let filter_input = DOM.el(`.modal-filter`, modal)

  if (loaded) {
    modal_list.innerHTML = `<div class="loading">Loading items...</div>`
  }

  if (filter_input) {
    filter_input.value = ``
    filter_input.disabled = true
    filter_input.oninput = null
    filter_input.onkeydown = null
  }

  if (!args.items.length) {
    modal_list.innerHTML = `<div class="loading">Nothing found</div>`
    return
  }

  let render_items = (list) => {
    modal_list.innerHTML = ``

    if (!list.length) {
      modal_list.innerHTML = `<div class="loading">No results</div>`
      return
    }

    let icon_size = 25

    for (let [i, item] of list.entries()) {
      let item_div = DOM.create(`div`)
      let item_text = DOM.create(`div`)
      item_div.className = `modal-item`
      let name = item.alt_text || item.text

      if (args.icons) {
        let item_icon = DOM.create(`canvas`, `modal-icon`)
        item_icon.width = icon_size
        item_icon.height = icon_size
        item_div.appendChild(item_icon)
        jdenticon.update(item_icon, name)
      }
      else if (args.color_icons) {
        let item_icon = DOM.create(`div`, `color-icon`)
        item_icon.style.width = `${icon_size}px`
        item_icon.style.height = `${icon_size}px`
        item_icon.style.backgroundColor = item.icon_color
        item_div.appendChild(item_icon)
      }

      name = App.underspace(name)

      if (args.capitalize) {
        name = App.capitalize(name)
      }

      item_text.textContent = name
      item_div.title = item.title
      DOM.ev(item_div, `click`, () => args.action(item))

      if (args.active === i) {
        item_div.classList.add(`modal-active-item`)
      }

      item_div.appendChild(item_text)
      modal_list.appendChild(item_div)
    }
  }

  render_items(args.items)

  if (!filter_input) {
    return
  }

  let apply_filter = () => {
    let query = filter_input.value.trim().toLowerCase()

    if (!query) {
      render_items(args.items)
      return
    }

    let filtered = args.items.filter((item) => {
      let text = item.alt_text || item.text
      return text.toLowerCase().includes(query)
    })

    render_items(filtered)
  }

  filter_input.disabled = false
  filter_input.focus()
  filter_input.oninput = apply_filter

  filter_input.onkeydown = (event) => {
    if (event.key !== `Enter`) {
      return
    }

    event.preventDefault()
    let all_items = DOM.els(`.modal-item`, modal_list)

    for (let item of all_items) {
      item.click()
      break
    }
  }

  App.do_open_modal(modal)
  App.focus_modal_filter(id)
}

App.open_modal = (id) => {
  let modal = DOM.el(`#${id}-modal`)

  if (!modal) {
    return
  }

  App.do_open_modal(modal)
}

App.do_open_modal = (modal) => {
  let body = DOM.el(`.modal-body`, modal)
  App.show_overlay()
  modal.classList.add(`active`)
  body.scrollTop = 0
}

App.close_modal = (id) => {
  let modal = DOM.el(`#${id}-modal`)

  if (!modal) {
    return
  }

  App.do_close_modal(modal)
}

App.do_close_modal = (modal) => {
  modal.classList.remove(`active`)
  let active_modals = DOM.els(`.modal.active`)

  if (active_modals.length === 0) {
    App.hide_overlay()
  }
}

App.close_all_modals = () => {
  let modals = DOM.els(`.modal`)

  for (let modal of modals) {
    App.do_close_modal(modal)
  }
}

App.close_current_modal = () => {
  let active_modals = DOM.els(`.modal.active`)

  if (active_modals.length > 0) {
    let top_modal = active_modals[active_modals.length - 1]
    App.do_close_modal(top_modal)
  }
}

App.modal_open = () => {
  let active_modals = DOM.els(`.modal.active`)
  return active_modals.length > 0
}

App.show_overlay = () => {
  DOM.show(`#modal-overlay`)
}

App.hide_overlay = () => {
  DOM.hide(`#modal-overlay`)
}

App.focus_modal_filter = (id) => {
  let filter = DOM.el(`#${id}-modal-filter`)

  if (filter) {
    filter.focus()
  }
}