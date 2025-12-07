import "./dom.js"
import "./webaudio.js"
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
import "./audio.js"
import "./player.js"
import "./settings.js"
import "./status.js"

const start_app_events = () => {
  if (!window?.App?.start_events) {
    return
  }

  window.App.start_events()
}

if (document.readyState === `loading`) {
  document.addEventListener(`DOMContentLoaded`, () => {
    start_app_events()
  }, {once: true})
}
else {
  start_app_events()
}
