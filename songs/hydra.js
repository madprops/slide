// 1. Initialize Hydra visuals with Strudel audio feed
await initHydra({ feedStrudel: 1 })
// 2. Hydra visual setup (audio-reactive cleanliness visuals)
src(s0)
  .kaleid(H("<4 5 6>"))
  .diff(osc(1, 0.5, 5))
  .modulateScale(osc(2, -0.25, 1))
  .out()
// 3. Drum groove – daily rhythm of cleaning
$: s("bd*4,[hh:0:<.5 1>]*8,~ rim")
  .bank("RolandTR909")
  .speed(0.9)
// 4. Bass – underlying cleanliness structure
$: note("[<g1!3 <bb1 <f1 d1>>>]*3")
  .s("sawtooth")
  .room(0.75)
  .sometimes(add(note(12)))
  .clip(0.3)
  .lpa(0.05)
  .lpenv(-4)
  .lpf(2000)
  .lpq(8)
  .ftype("24db")
// 5. (Optional) Melody layer – rising satisfaction
$: note("[b4 d5 e5 f#5] [e5 f#5 g5 a5] [f#5 g5 a5 b5]")
  .s("sine")
  .gain(0.8)
  .room(0.3)
  .lpf(1200)
  .color("white")
// 6. Audio → Visual FFT sync
all(x => x.fft(4).scope({ pos: 0, smear: 0.95 }))
// @version 1.2