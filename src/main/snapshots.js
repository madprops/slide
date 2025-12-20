App.db_version = 1
App.db_name = `SlideDatabase`
App.db_store_name = `snapshots`
App.max_snapshot_size = 20 * 10000
App.max_snapshots = 1000
App.max_snapshot_title = 500
App.displayed_snapshots = 100

App.init_db = () => {
  return new Promise((resolve, reject) => {
    let request = indexedDB.open(App.db_name, App.db_version)

    request.onupgradeneeded = (event) => {
      let db = event.target.result

      if (!db.objectStoreNames.contains(App.db_store_name)) {
        // We use an auto-incrementing key so every play is a new entry
        db.createObjectStore(App.db_store_name, {
          keyPath: `id`,
          autoIncrement: true,
        })
      }
    }

    request.onsuccess = () => {
      console.log(`💾 Snapshot saved.`)
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

    if (cursor) {
      let v = cursor.value

      let same_code = v.code === code
      let same_title = v.title = title
      let same_eq_low = v.eq_low === App.eq.low
      let same_eq_mid = v.eq_mid === App.eq.mid
      let same_eq_high = v.eq_high === App.eq.high
      let same_reverb = v.reverb === App.reverb_enabled
      let same_panning = v.panning === App.panning_enabled
      let same_cutoff = v.cutoff === App.cutoff_enabled
      let same_delay = v.delay === App.delay_enabled

      if (same_code && same_title && same_eq_low && same_eq_mid &&
          same_eq_high && same_reverb && same_panning &&
          same_cutoff && same_delay) {
        // No changes, abort save
        return
      }
    }

    // Add the new snapshot
    let entry = {
      code,
      title,
      eq_low: App.eq.low,
      eq_mid: App.eq.mid,
      eq_high: App.eq.high,
      reverb: App.reverb_enabled,
      panning: App.panning_enabled,
      cutoff: App.cutoff_enabled,
      delay: App.delay_enabled,
      timestamp: Date.now(),
    }

    store.add(entry)

    // Check count and prune
    let count_request = store.count()

    count_request.onsuccess = () => {
      let current_count = count_request.result

      if (current_count > App.max_snapshots) {
        let overflow = current_count - App.max_snapshots
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

App.clear_snapshots = async () => {
  let db = await App.init_db()
  let transaction = db.transaction([App.db_store_name], `readwrite`)
  let store = transaction.objectStore(App.db_store_name)

  return new Promise((resolve, reject) => {
    let request = store.clear()

    request.onsuccess = () => {
      console.log(`Snapshots cleared successfully`)
      resolve()
    }

    request.onerror = () => {
      console.error(`Failed to clear history`, request.error)
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

  if (snapshots.length === 0) {
    let msg = `No snapshots yet. Snapshots are saved automatically when you play code.`
    App.show_alert(msg, `Empty List`)
    return
  }

  snapshots.reverse()
  snapshots = snapshots.slice(0, App.displayed_snapshots)
  let items = []

  for (let snapshot of snapshots) {
    let text = snapshot.title || `Untitled`
    let day = App.get_weekday(snapshot.timestamp)
    let lines = App.num_lines(snapshot.code)
    text += ` | ${day} | ${lines}`

    items.push({
      text,
      title: `Click to load and play this snapshot`,
      snapshot,
    })
  }

  App.show_items_modal(`snapshots`, {
    items,
    action: (item) => {
      App.load_snapshot(item.snapshot)
    },
  })
}

App.load_snapshot = (item) => {
  App.stop_auto()

  App.eq.low = item.eq_low || 0
  App.eq.mid = item.eq_mid || 0
  App.eq.high = item.eq_high || 0
  App.reverb_enabled = item.reverb || false
  App.panning_enabled = item.panning || false
  App.cutoff_enabled = item.cutoff || false
  App.delay_enabled = item.delay || false
  App.check_effects()
  App.save_effects()

  App.beat_title = item.beat_title
  App.play_action(item.code, true)
}