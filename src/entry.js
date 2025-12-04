import './dom.js'
import './main.js'
import './scope.js'
import './songs.js'

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
