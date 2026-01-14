App.queue = []
App.queue_delay = 30 * 1000

App.start_queue = () => {
  clearTimeout(App.queue_timeout)

  App.queue_timeout = setTimeout(() => {
    App.check_queue()
  }, App.queue_delay)
}

App.stop_queue = () => {
  clearTimeout(App.queue_timeout)
}

App.check_queue = () => {
  if (App.queue.length === 0) {
    return
  }

  App.next_in_queue()
  App.start_queue()
}

App.queue_snapshot = (snapshot) => {
  App.queue.push({
    type: `snapshot`,
    item_id: snapshot.id,
  })

  App.check_queue_button()
}

App.queue_song = (name) => {
  App.queue.push({
    type: `song`,
    item_id: name,
  })

  App.check_queue_button()
}

App.check_queue_button = () => {
  let btn = DOM.el(`#btn-queue`)

  if (App.queue.length > 0) {
    DOM.show(btn)
  }
  else {
    DOM.hide(btn)
  }
}

App.next_in_queue = async () => {
  let first = App.queue.shift()

  if (first.type === `snapshot`) {
    let snapshot = await App.get_snapshot_by_id(first.item_id)

    if (snapshot) {
      App.load_snapshot(snapshot)
    }
  }
  else if (first.type === `song`) {
    App.load_song(first.item_id)
  }

  App.check_queue_button()
}

App.clear_queue = () => {
  clearTimeout(App.queue_timeout)
  App.queue = []
  App.check_queue_button()
}