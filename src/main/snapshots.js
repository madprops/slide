App.db_version = 1
App.db_name = `SlideDatabase`
App.db_store_name = `snapshots`
App.max_snapshot_size = 20 * 10000
App.max_snapshots = 1000
App.max_snapshot_title = 500

App.init_db = () => {
  return new Promise((resolve, reject) => {
    let request = indexedDB.open(App.db_name, App.db_version)

    request.onupgradeneeded = (event) => {
      let db = event.target.result

      if (!db.objectStoreNames.contains(App.db_store_name)) {
        // We use an auto-incrementing key so every play is a new entry
        db.createObjectStore(App.db_store_name, {
          keyPath: `id`,
          autoIncrement: true
        })
      }
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

App.save_snapshot = async (code = ``, title = ``) => {
  if (!code || !code.trim()) {
    return
  }

  code = code.trim()
  title = title.trim()

  if (code.length > App.max_snapshot_size) {
    return
  }

  if (title.length > App.max_snapshot_title) {
    return
  }

  let db = await App.init_db()
  let transaction = db.transaction([App.db_store_name], `readwrite`)
  let store = transaction.objectStore(App.db_store_name)

  // Get the most recent entry to check for changes
  let latest_request = store.openCursor(null, `prev`)

  latest_request.onsuccess = (event) => {
    let cursor = event.target.result

    // If the code is identical to the last save, abort the transaction
    if (cursor && (cursor.value.code === code) && cursor.value.title === title) {
      return
    }

    // Add the new snapshot
    let entry = {
      code,
      title,
      timestamp: Date.now()
    }

    store.add(entry)

    // Check count and prune
    let count_request = store.count()

    count_request.onsuccess = () => {
      let current_count = count_request.result

      if (current_count > App.max_snapshots) {
        let overflow = (current_count - App.max_snapshots)
        let delete_cursor = store.openCursor()
        let deleted_so_far = 0

        delete_cursor.onsuccess = (event) => {
          let cursor = event.target.result

          if (cursor && (deleted_so_far < overflow)) {
            cursor.delete()
            deleted_so_far++
            cursor.continue()
          }
        }
      }
    }
  }

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      resolve()
    }

    transaction.onerror = () => {
      reject(transaction.error)
    }
  })
}

App.get_snapshots = async () => {
  let db = await App.init_db()
  let transaction = db.transaction([App.db_store_name], `readonly`)
  let store = transaction.objectStore(App.db_store_name)

  return new Promise((resolve, reject) => {
    let request = store.getAll()

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

App.create_snapshots_modal = () => {
  let modal = App.create_list_modal(`snapshots`)
  let title = DOM.el(`.modal-title`, modal)
  title.textContent = `Snapshots`
}

App.show_snapshots = async () => {
  let snapshots = await App.get_snapshots()
  snapshots.reverse()
  snapshots = snapshots.slice(0, 100)
  let items = []

  for (let snapshot of snapshots) {
    let text = snapshot.title || `Untitled`
    let code = snapshot.code
    let beat_title = snapshot.title

    items.push({
      text,
      code,
      beat_title,
      title: `Click to load and play this snapshot`,
    })
  }

  App.show_items_modal(`snapshots`, {
    items,
    action: (item) => {
      App.load_snapshot(item)
    },
  })
}

App.load_snapshot = (item) => {
  App.beat_title = item.beat_title
  App.play_action(item.code, true)
}