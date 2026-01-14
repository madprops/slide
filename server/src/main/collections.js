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
      title: `View the songs collection`,
    },
    {
      text: `Song Shuffle`,
      action: () => {
        App.song_shuffle()
      },
      title: `Make a randomized playlist with all the songs`,
    },
    {
      text: `Snapshots`,
      action: () => {
        App.show_snapshots()
      },
      title: `View the snapshots collection`,
    },
    {
      text: `Snap Shuffle`,
      action: () => {
        App.snap_shuffle()
      },
      title: `Make a randomized playlist with all the snapshots`,
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