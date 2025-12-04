import {getSuperdoughAudioController} from "superdough"

App.volume_percent = 100
App.volume_storage_key = `slide.volumePercent`

App.get_volume_slider = () => {
    return DOM.el(`#volume-slider`)
}

App.get_volume_value = () => {
    return DOM.el(`#volume-value`)
}

App.read_volume_value = (input_el) => {
    if (!input_el) {
        return App.volume_percent
    }

    const slider_value = input_el.valueAsNumber

    if (Number.isFinite(slider_value)) {
        return slider_value
    }

    const numeric_value = parseInt(input_el.value, 10)

    if (Number.isFinite(numeric_value)) {
        return numeric_value
    }

    return App.volume_percent
}

App.refresh_volume_ui = () => {
    const slider = App.get_volume_slider()
    const display = App.get_volume_value()

    if (slider) {
        slider.value = `${App.volume_percent}`
    }

    if (display) {
        display.innerText = `${App.volume_percent}%`
    }
}

App.persist_volume = () => {
    if (typeof window === `undefined`) {
        return
    }

    try {
        window.localStorage?.setItem(App.volume_storage_key, `${App.volume_percent}`)
    }
    catch (err) {
        console.warn(`Failed to persist volume`, err)
    }
}

App.load_saved_volume = () => {
    if (typeof window === `undefined`) {
        return undefined
    }

    try {
        const stored_value = window.localStorage?.getItem(App.volume_storage_key)

        if (stored_value == null) {
            return undefined
        }

        const parsed_value = Number(stored_value)

        if (!Number.isFinite(parsed_value)) {
            return undefined
        }

        return parsed_value
    }
    catch (err) {
        console.warn(`Failed to load volume`, err)
        return undefined
    }
}

App.apply_volume = () => {
    if (!App.audio_started) {
        return
    }

    try {
        const controller = getSuperdoughAudioController()
        const destination_gain = controller?.output?.destinationGain

        if (!destination_gain) {
            console.warn(`Destination gain node missing`)
            return
        }

        destination_gain.gain.value = App.volume_percent / 100
    }
    catch (err) {
        console.error(`Failed to apply volume`, err)
    }
}

App.update_volume = (percent) => {
    let next_value = Number(percent)

    if (!Number.isFinite(next_value)) {
        next_value = App.volume_percent
    }

    next_value = Math.min(100, Math.max(0, next_value))
    App.volume_percent = next_value
    App.refresh_volume_ui()
    App.persist_volume()
    App.apply_volume()
}

App.init_volume_controls = () => {
    const slider = App.get_volume_slider()

    if (!slider) {
        return
    }

    const saved_volume = App.load_saved_volume()
    const slider_volume = App.read_volume_value(slider)

    if (Number.isFinite(saved_volume)) {
        App.volume_percent = saved_volume
    }
    else {
        App.volume_percent = slider_volume
    }

    App.refresh_volume_ui()
    App.persist_volume()

    slider.addEventListener(`input`, (event) => {
        App.update_volume(App.read_volume_value(event.target))
    })

    slider.addEventListener(`wheel`, (event) => {
        event.preventDefault()
        let step = parseInt(event.target.step, 10) || 1
        let current = parseInt(event.target.value, 10)

        if (event.deltaY < 0) {
            event.target.value = current + step
        }
        else {
            event.target.value = current - step
        }

        App.update_volume(App.read_volume_value(event.target))
    })
}