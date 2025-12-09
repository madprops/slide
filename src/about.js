App.create_about_modal = () => {
  let modal = App.create_modal(`about`)
  let header = DOM.el(`.modal-header`, modal)
  let image = DOM.create(`img`, ``, `modal-about-image`)
  image.src = `/img/slide.png`
  header.prepend(image)
  let title = DOM.el(`.modal-title`, modal)
  let version = `v${App.config.version}`
  title.textContent = `Slide ${version} | Merkoba | 2025`
  title.id = `modal-title-about`
  let body = DOM.el(`.modal-body`, modal)
  body.id = `modal-body-about`

  body.innerHTML = `
    <div class="about-item">Slide is a music player that uses <a target=_blank class="popup" href="https://strudel.cc">strudel</a> code.</div>
    <div class="about-item">It's meant to allow automatic & seamless code updates.</a></div>
    <div class="about-item">There's a song picker to play elaborate tunes.</a></div>
    <div class="about-item">The code can be edited in real time and applied with Play.</a></div>
    <div class="about-item">The scope visualizer can be clicked in the left/center/right.</a></div>
    <div class="about-item">Clicking the scope produces a tone and a reverb affect.</a></div>
    <div class="about-item">Clicking the scope on the left produces left panning.</a></div>
    <div class="about-item">Clicking the scope on the right produces right panning.</a></div>
    <div class="about-item">A straight line to the left on the scope sets the next visual.</a></div>
    <div class="about-item">A straight line to the right on the scope opens a random song.</a></div>
    <div class="about-item">Ctrl+s = Starts playback / Updates code.</a></div>
    <div class="about-item">Escape = Closes top modal or stops playback.</a></div>
    <div class="about-item">Ctrl+1 = Show the sound context.</a></div>
    <div class="about-item">Ctrl+2 = Show the note context.</a></div>
    <div class="about-item">Ctrl+3 = Show the bank context.</a></div>
    <div class="about-item">Try drawing a triangle on the scope.</a></div>
    <div class="about-item">Try drawing a rectangle on the scope.</a></div>
    <div class="about-item">Try drawing a circle on the scope.</a></div>
    <div class="about-item">Credit: Gemini</a></div>
    <div class="about-item">Credit: ChatGPT</a></div>
    <div class="about-item">Credit: Claude</a></div>
  `
}

App.open_about_modal = () => {
  App.open_modal(`about`)
}
