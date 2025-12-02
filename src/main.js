import './process-env.js'
import * as strudelCore from '@strudel.cycles/core'
import * as strudelMini from '@strudel.cycles/mini'
import * as strudelWebAudio from '@strudel.cycles/webaudio'

const { evaluate, evalScope } = strudelCore
const { initAudio } = strudelWebAudio

let scopePromise

const ensureStrudelScope = () => {
    if (!scopePromise) {
        scopePromise = evalScope(strudelCore, strudelMini, strudelWebAudio).catch((err) => {
            scopePromise = undefined
            console.error(`Strudel scope failed to load`, err)
            throw err
        })
    }

    return scopePromise
}

let audioStarted = false

// 1. Export a setup function to the global window object
// This allows your HTML/Flask templates to call it easily.
window.strudel_init = async () => {
    if (audioStarted) {
        return
    }

    console.log(`Initializing Audio...`)

    try {
        await ensureStrudelScope()
        await initAudio()
        audioStarted = true
        console.log(`Audio Ready.`)
    }
    catch (err) {
        console.error(`Audio Failed:`, err)
    }
}

// 2. Export the update function
window.strudel_update = (code) => {
    if (!audioStarted) {
        console.warn(`Audio not started yet. Call strudel_init() first.`)
        return
    }

    console.log(`Running:`, code)
    evaluate(code)
}

// 3. Export stop
window.strudel_stop = () => {
    evaluate(`hush`)
}