import "./dom.js"
import "./main.js"
import "./filter.js"
import "./input.js"
import "./volume.js"
import "./tempo.js"
import "./scope.js"
import "./songs.js"
import "./modals.js"
import "./about.js"
import "./auto.js"
import "./visual.js"
import "./utils.js"
import "./storage.js"

const startAppEvents = () => {
  if (!window?.App?.start_events) {
    return
  }

  window.App.start_events()
}

if (document.readyState === `loading`) {
  document.addEventListener(`DOMContentLoaded`, () => {
    startAppEvents()
  }, {once: true})
}
else {
  startAppEvents()
}
