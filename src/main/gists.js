// Trigger this when the user clicks "Connect GitHub"
App.initiate_github_login = () => {
  // This hits the python route which redirects to GitHub
  window.location.href = `/github_login`
}

// Trigger this to actually save the file
App.save_private_gist = async (content, filename) => {
  let payload = {filename, content}

  let response = await fetch(`/create_gist`, {
    method: `POST`,
    headers: {
      "Content-Type": `application/json`
    },
    body: JSON.stringify(payload)
  })

  if (response.ok) {
    let result = await response.json()
    console.log(`Gist created:`, result.html_url)
    return result.html_url
  }

  else {
    let error_data = await response.json()
    console.error(`Error saving gist:`, error_data)

    // If 401, it means the user session expired or doesn't exist
    if ((response.status == 401)) {
      console.log(`User needs to login first`)
      App.initiate_github_login()
    }

    return null
  }
}

// Example usage
// save_private_gist(`my_song.js`, `console.log("hello world")`)