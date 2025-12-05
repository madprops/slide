App.open_visual_modal = async () => {
  let items = [
    `Auto`,
    `None`,
    `Hydra`,
    `Scope`,
    `Pianoroll`,
  ]

  App.show_items_modal(`songs`, {
    items,
    action: (item) => {
      let mode = item.toLowerCase()
      App.apply_visual(mode)
    },
  })
}

App.apply_visual = (mode) => {
  console.log(mode)
}