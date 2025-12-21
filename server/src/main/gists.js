App.github_login = () => {
  // 1. Open the auth route in a small popup window
  let width = 600
  let height = 700
  let left = (window.innerWidth - width) / 2
  let top = (window.innerHeight - height) / 2

  let popup = window.open(
    `/github/login`,
    `GitHub Auth`,
    `width=${width},height=${height},top=${top},left=${left}`,
  )

  // 2. Listen for a message from that popup
  window.addEventListener(`message`, function on_message(event) {
    // Security check: ensure the message comes from your own domain
    if (event.origin !== window.location.origin) {
      return
    }

    if (event.data === `github_authorized`) {
      console.log(`GitHub Auth successful! Retrying save...`)

      // Cleanup: remove listener
      window.removeEventListener(`message`, on_message)
    }
  })
}

// Trigger this to actually save the file
App.save_gist = async (content, filename) => {
  let payload = {filename, content}

  let response = await fetch(`/github/create_gist`, {
    method: `POST`,
    headers: {
      "Content-Type": `application/json`,
    },
    body: JSON.stringify(payload),
  })

  if (response.ok) {
    let result = await response.json()
    let raw_url = result.raw_url

    console.log(`Gist created:`, raw_url)
    App.show_gist_url(raw_url)

    return raw_url
  }

  let error_data = await response.json()
  console.error(`Error saving gist:`, error_data)

  // If 401, it means the user session expired or doesn't exist
  if (response.status === 401) {
    console.log(`User needs to login first`)
  }

  return null
}

App.show_gist_url = (url) => {
  let location = window.location.origin
  App.show_alert(`${location}?url=${url}`)
}