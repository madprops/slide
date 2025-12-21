App.tooltip_el = null
App.tooltips_offset = 8
App.tooltips_enabled = true
App.tooltip_delay = 800

App.create_tooltip_element = () => {
  if (App.tooltip_el) {
    return
  }

  App.tooltip_el = DOM.create(`div`)
  App.tooltip_el.id = `custom-tooltip`
  document.body.appendChild(App.tooltip_el)

  App.tooltip_debouncer = App.create_debouncer((el) => {
    App.show_tooltip(el)
  }, App.tooltip_delay)
}

App.get_tooltip_position = (target_el) => {
  let rect = target_el.getBoundingClientRect()
  let tip_rect = App.tooltip_el.getBoundingClientRect()

  // Default: Center bottom
  let top = rect.bottom + App.tooltips_offset
  let left = rect.left + (rect.width / 2) - (tip_rect.width / 2)

  // 1. Vertical Check: If it goes off bottom, flip to top
  if ((top + tip_rect.height) > window.innerHeight) {
    top = rect.top - tip_rect.height - App.tooltips_offset
  }

  // 2. Horizontal Check: Left edge
  if (left < App.tooltips_offset) {
    left = App.tooltips_offset
  }

  // 3. Horizontal Check: Right edge
  if ((left + tip_rect.width) > (window.innerWidth - App.tooltips_offset)) {
    left = window.innerWidth - tip_rect.width - App.tooltips_offset
  }

  return {top, left}
}

App.show_tooltip = (e) => {
  if (!App.tooltips_enabled) {
    return
  }

  let text = e.target.getAttribute(`data-tooltip-text`)

  if (!text) {
    return
  }

  text = text.replace(/\\n/g, `\n`)
  App.tooltip_el.textContent = text
  App.tooltip_el.style.display = `block`

  let {top, left} = App.get_tooltip_position(e.target)

  App.tooltip_el.style.top = `${top}px`
  App.tooltip_el.style.left = `${left}px`
}

App.hide_tooltip = () => {
  if (App.tooltip_el) {
    App.tooltip_debouncer.cancel()
    App.tooltip_el.style.display = `none`
  }
}

App.register_tooltip = (element) => {
  // If it has a native title, swap it
  if (element.hasAttribute(`title`)) {
    let text = element.getAttribute(`title`)
    element.setAttribute(`data-tooltip-text`, text)
    element.removeAttribute(`title`)
  }

  // Prevent double binding
  if (element.dataset.hasCustomTooltip) {
    return
  }

  element.dataset.hasCustomTooltip = `true`

  DOM.ev(element, `mouseenter`, (event) => {
    App.tooltip_debouncer.call(event)
  })

  DOM.ev(element, `mouseleave`, App.hide_tooltip)

  // Hide if element is clicked (optional UX improvement)
  DOM.ev(element, `mousedown`, App.hide_tooltip)
}

App.init_tooltips = () => {
  App.create_tooltip_element()
  let targets = DOM.els(`[title]`)

  targets.forEach(el => {
    App.register_tooltip(el)
  })
}