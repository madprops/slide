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

App.get_snapshot_hash = async (data) => {
  // Create a consistent string representation of the data
  let source = [
    data.code,
    data.title,
    data.eq_low,
    data.eq_mid,
    data.eq_high,
    data.reverb,
    data.panning,
    data.cutoff,
    data.delay,
  ].join(`|||`)

  let msg_buffer = new TextEncoder().encode(source)
  let hash_buffer = await crypto.subtle.digest(`SHA-256`, msg_buffer)
  let hash_array = Array.from(new Uint8Array(hash_buffer))
  let hash_hex = hash_array.map(b => b.toString(16).padStart(2, `0`)).join(``)

  return hash_hex
}

App.save_snapshot = () => {
  App.show_confirm({
    title: `Save Snapshot`,
    message: `Save the current code and effects?`,
    ok_action: () => {
      App.do_save_snapshot()
    },
  })
}

App.do_save_snapshot = async (code = ``, title = ``) => {
  if (!code) {
    code = App.last_code
  }

  if (!code || !code.trim()) {
    return
  }

  if (!title) {
    title = App.last_playing
  }

  if (code.length > App.max_snapshot_size) {
    return
  }

  if (title.length > App.max_snapshot_title) {
    return
  }

  // Prepare data object first to calculate hash
  let raw_entry = {
    code,
    title,
    eq_low: App.eq.low,
    eq_mid: App.eq.mid,
    eq_high: App.eq.high,
    reverb: App.reverb_enabled,
    panning: App.panning_enabled,
    cutoff: App.cutoff_enabled,
    delay: App.delay_enabled,
  }

  let hash = await App.get_snapshot_hash(raw_entry)

  let final_entry = {
    ...raw_entry,
    hash,
    timestamp: Date.now(),
  }

  let db = await App.init_db()
  let transaction = db.transaction([App.db_store_name], `readwrite`)
  let store = transaction.objectStore(App.db_store_name)

  // Use index if available (Fastest), otherwise scan (Slower)
  let request
  let using_index = store.indexNames.contains(`hash`)

  if (using_index) {
    request = store.index(`hash`).openCursor(hash)
  }
  else {
    request = store.openCursor()
  }

  request.onsuccess = (event) => {
    let cursor = event.target.result

    if (cursor) {
      let v = cursor.value

      // If using index, we know it matches.
      // If scanning, we check the hash manually.
      // Fallback: If old entry has no hash, we assume it's not a duplicate
      // (or you could add the manual field check here as a fallback)
      if (using_index || (v.hash === hash)) {
        cursor.delete()
      }

      cursor.continue()
    }
    else {
      // Duplicates deleted, add new
      store.add(final_entry)
      App.prune_snapshots(store)

      try {
        App.save_gist(JSON.stringify(raw_entry), App.filename(title))
      }
      catch (err) {
        console.error(err)
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

App.prune_snapshots = (store) => {
  let count_request = store.count()

  count_request.onsuccess = () => {
    let current_count = count_request.result

    if (current_count > App.max_snapshots) {
      let overflow = current_count - App.max_snapshots
      let delete_cursor_req = store.openCursor()
      let deleted_so_far = 0

      delete_cursor_req.onsuccess = (e) => {
        let del_cursor = e.target.result

        if (del_cursor && (deleted_so_far < overflow)) {
          del_cursor.delete()
          deleted_so_far++
          del_cursor.continue()
        }
      }
    }
  }
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
    let msg = `No snapshots saved yet. Use the 💾 button.`
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

App.use_snapshot = (item) => {
  App.eq.low = item.eq_low || 0
  App.eq.mid = item.eq_mid || 0
  App.eq.high = item.eq_high || 0
  App.reverb_enabled = item.reverb || false
  App.panning_enabled = item.panning || false
  App.cutoff_enabled = item.cutoff || false
  App.delay_enabled = item.delay || false
  App.beat_title = item.title
  App.check_effects()
  App.save_effects()
}

App.load_snapshot = (item) => {
  App.use_snapshot(item)
  App.stop_auto()
  App.play_action(item.code, true)
  App.close_modal(`snapshots`)
}