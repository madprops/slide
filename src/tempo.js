App.tempo_cpm = App.default_cpm
App.tempo_storage_key = `slide.tempoCpm`
App.tempo_debounce_timer = undefined
App.min_tempo = 20
App.max_tempo = 160

App.get_tempo_slider = () => {
    return DOM.el(`#tempo-slider`)
}

App.get_tempo_value = () => {
    return DOM.el(`#tempo-value`)
}

App.refresh_tempo_ui = () => {
    let slider = App.get_tempo_slider()
    let display = App.get_tempo_value()

    if (slider) {
        slider.value = `${App.tempo_cpm}`
    }

    if (display) {
        display.textContent = `${App.tempo_cpm} cpm`
    }
}

App.persist_tempo = () => {
    if (typeof window === `undefined`) {
        return
    }

    try {
        window.localStorage?.setItem(App.tempo_storage_key, `${App.tempo_cpm}`)
    }
    catch (err) {
        console.warn(`Failed to persist tempo`, err)
    }
}

App.load_saved_tempo = () => {
    if (typeof window === `undefined`) {
        return undefined
    }

    try {
        let saved = window.localStorage?.getItem(App.tempo_storage_key)

        if (saved == null) {
            return undefined
        }

        let parsed = parseInt(saved, 10)

        if (!Number.isFinite(parsed)) {
            return undefined
        }

        return parsed
    }
    catch (err) {
        console.warn(`Failed to load tempo`, err)
        return undefined
    }
}

App.update_tempo = (cpm) => {
    let next_value = parseInt(cpm, 10)

    if (!Number.isFinite(next_value)) {
        next_value = App.tempo_cpm
    }

    // Round to nearest 5 for stepped values
    next_value = Math.round(next_value / 5) * 5

    next_value = Math.min(App.max_tempo, Math.max(App.min_tempo, next_value))
    App.tempo_cpm = next_value
    App.refresh_tempo_ui()
    App.persist_tempo()

    if (App.current_song) {
        App.update_song_query_param(App.current_song)
    }
}

App.on_tempo_change = (event) => {
    App.update_tempo(event.target.value)

    if (App.tempo_debounce_timer) {
        clearTimeout(App.tempo_debounce_timer)
    }

    App.tempo_debounce_timer = setTimeout(() => {
        App.tempo_debounce_timer = undefined
        App.set_tempo()
    }, 10)
}

App.init_tempo_controls = () => {
    let slider = App.get_tempo_slider()

    if (!slider) {
        return
    }

    let saved_tempo = App.load_saved_tempo()

    if (Number.isFinite(saved_tempo)) {
        App.tempo_cpm = saved_tempo
    }

    App.refresh_tempo_ui()
    App.persist_tempo()

    DOM.ev(slider, `input`, (event) => {
        App.update_tempo(event.target.value)
    })

    DOM.ev(slider, `auxclick`, (event) => {
        if (event.button === 1) {
            event.target.value = App.default_cpm
            App.update_tempo(App.default_cpm)
            App.set_tempo()
        }
    })

    DOM.ev(slider, `wheel`, (event) => {
        event.preventDefault()
        let step = parseInt(event.target.step, 10) || 1
        let current = parseInt(event.target.value, 10)

        if (event.deltaY < 0) {
            event.target.value = current - step
        }
        else {
            event.target.value = current + step
        }

        App.on_tempo_change(event)
    })

    DOM.ev(slider, `change`, (event) => {
        App.on_tempo_change(event)
    })
}