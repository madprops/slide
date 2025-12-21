App.create_collections_modal = () => {
  let modal = App.create_list_modal(`collections`)
  let title = DOM.el(`.modal-title`, modal)
  title.textContent = `Collections`
}

App.show_collections = async () => {
  let items = [
    {
      text: `Songs`,
      action: () => {
        App.show_songs()
      },
    },
    {
      text: `Snapshots`,
      action: () => {
        App.show_snapshots()
      },
    },
  ]

  App.show_items_modal(`collections`, {
    items,
    action: (item) => {
      App.close_modal(`collections`)
      item.action()
    },
  })
}