App.create_about_modal = () => {
  let modal = App.create_modal(`about`)
  let header = DOM.el(`.modal-header`, modal)
  let image = DOM.create(`img`, ``, `modal-about-image`)
  image.src = `/img/slide.png`
  header.prepend(image)
  let title = DOM.el(`.modal-title`, modal)
  let version = `v${App.config.version}`
  title.textContent = `Slide | ${version} | Merkoba | 2025 | ${App.commit_hash}`
  title.id = `modal-title-about`
  title.title = `Name | Version | Company | Year | Commit Hash`
  let body = DOM.el(`.modal-body`, modal)
  body.id = `modal-body-about`

  body.innerHTML = `
    <div class="about-item">Slide is a music player that uses <a target=_blank class="popup" href="https://strudel.cc">strudel</a> code.</div>
    <div class="about-item">It's meant to allow automatic & seamless code updates.</div>
    <div class="about-item">There's a song picker to play elaborate tunes.</div>
    <div class="about-item">The code can be edited in real time and applied with Play.</div>
    <hr>
    <div class="about-item">The scope visualizer can be clicked in the left/center/right.</div>
    <div class="about-item">Clicking the scope produces a tone and a reverb affect.</div>
    <div class="about-item">Clicking the scope on the left produces left panning.</div>
    <div class="about-item">Clicking the scope on the right produces right panning.</div>
    <div class="about-item">A straight line to the left changes the visual.</div>
    <div class="about-item">A straight line to the right changes the theme.</div>
    <div class="about-item">Try drawing a triangle.</div>
    <div class="about-item">Try drawing a rectangle.</div>
    <div class="about-item">Try drawing a circle.</div>
    <div class="about-item">Try drawing a plus sign.</div>
    <div class="about-item">Try drawing many stars.</div>
    <hr>
    <div class="about-item">Ctrl+s = Starts playback / Updates code.</div>
    <div class="about-item">Ctrl+1 = Show the sound context.</div>
    <div class="about-item">Ctrl+2 = Show the note context.</div>
    <div class="about-item">Ctrl+3 = Show the bank context.</div>
    <div class="about-item">Escape = Closes top modal or stops playback.</div>
  `
}

App.show_about = () => {
  App.open_modal(`about`)
}
