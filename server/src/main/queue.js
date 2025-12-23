App.queue = []
App.queue_delay = 45 * 1000

App.start_queue = () => {
  App.queue_timeout = setTimeout(() => {
    App.check_queue()
  }, App.queue_delay)
}

App.stop_queue = () => {
  clearTimeout(App.queue_timeout)
}

App.check_queue = async () => {
  if (App.queue.length === 0) {
    return
  }

  let first = App.queue.shift()

  if (first.type === `snapshot`) {
    let snapshot = await App.get_snapshot_by_id(first.item_id)

    if (snapshot) {
      App.load_snapshot(snapshot)
    }
  }

  App.start_queue()
}

App.queue_snapshot = (snapshot) => {
  App.queue.push({
    id: `snapshot_${snapshot.id}`,
    type: `snapshot`,
    item_id: snapshot.id,
  })
}