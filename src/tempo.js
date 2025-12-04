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
    console.log(next_value)
    next_value = Math.min(App.max_tempo, Math.max(App.min_tempo, next_value))
    App.tempo_cpm = next_value
    App.refresh_tempo_ui()
}

App.on_tempo_change = (is_final = false) => {
    let slider = App.get_tempo_slider()
    App.update_tempo(slider.value, true)

    if (is_final) {
        App.persist_tempo()

        if (App.current_song) {
            App.update_song_query_param(App.current_song)
        }

        App.set_tempo()
    }
}

App.init_tempo_controls = () => {
    let slider = App.get_tempo_slider()
    const container = DOM.el(`#tempo-control`)

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

    DOM.ev(container, `auxclick`, (event) => {
        if (event.button === 1) {
            slider.value = App.default_cpm
            App.update_tempo(App.default_cpm)
            App.set_tempo()
        }
    })

    DOM.ev(container, `wheel`, (event) => {
        event.preventDefault()
        let slider = App.get_tempo_slider()
        let step = parseInt(slider.step, 10) || 1
        let current = parseInt(slider.value, 10)

        if (event.deltaY < 0) {
            slider.value = current + step
        }
        else {
            slider.value = current - step
        }

        App.on_tempo_change(true)
    }, {passive: false})

    DOM.ev(container, `change`, (event) => {
        App.on_tempo_change(true)
    })
}