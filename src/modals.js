App.create_modal = () => {
  let template = DOM.el(`#template-modal`)
  let container = DOM.create(`div`)
  container.innerHTML = template.innerHTML
  DOM.el(`#modals`).appendChild(container)
  return container
}

App.create_list_modal = () => {
  let template = DOM.el(`#template-list-modal`)
  let container = DOM.create(`div`)
  container.innerHTML = template.innerHTML
  DOM.el(`#modals`).appendChild(container)
}

App.create_modals = () => {
  App.create_about_modal()
  App.create_songs_modal()

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

App.show_items_modal = async (what, args = {}) => {
  let loaded = args.loaded || false
  let modal = DOM.el(`#${what}-modal`)
  let items = DOM.el(`#${what}-list`)
  let filter_input = DOM.el(`#${what}-filter`)

  modal.classList.add(`active`)

  if (loaded) {
    items.innerHTML = `<div class="loading">Loading items...</div>`
  }

  if (filter_input) {
    filter_input.value = ``
    filter_input.disabled = true
    filter_input.oninput = null
    filter_input.onkeydown = null
  }

  if (!args.items.length) {
    items.innerHTML = `<div class="loading">Nothing found</div>`
    return
  }

  let render_items = (list) => {
    items.innerHTML = ``

    if (!list.length) {
      items.innerHTML = `<div class="loading">No results</div>`
      return
    }

    for (let item of list) {
      let item_div = DOM.create(`div`)
      item_div.className = `modal-item`
      item_div.textContent = App.underspace(item)
      DOM.ev(item_div, `click`, () => args.action(item))
      items.appendChild(item_div)
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

    let filtered = args.items.filter((item) => item.toLowerCase().includes(query))
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
    let all_items = DOM.els(`.modal-item`, items)

    for (let item of all_items) {
      item.click()
      break
    }
  }
}

App.open_modal = (what) => {
  let modal = DOM.el(`#${what}-modal`)

  if (!modal) {
    return
  }

  App.show_overlay()
  modal.classList.add(`active`)
}

App.close_modal = (what) => {
  let modal = DOM.el(`#${what}-modal`)

  if (!modal) {
    return
  }

  App.do_close_modal(modal)
}

App.do_close_modal = (modal) => {
  modal.classList.remove(`active`)
  App.hide_overlay()
}

App.close_all_modals = () => {
  let modals = DOM.els(`.modal`)

  for (let modal of modals) {
    App.do_close_modal(modal)
  }
}

App.show_overlay = () => {
  DOM.show(`#modal-overlay`)
}

App.hide_overlay = () => {
  DOM.hide(`#modal-overlay`)
}