/* Astro | Star Data
RA: 269 | DEC: -7 | MAG: 6
North Star: HR 6675
Loner Star: HR 6590
Center Star: HR 6650
Brightest Star: 64Nu Oph */

setcpm(30)

let s1 = stack(
  note("e5 ~ c3 [f g#4]").sound("piano").pan(0).room("<0.8 0.9 0.1>").crush(14).gain(0.6),
  note("[g#1 e3 e6]").sound("brown").pan(0).gain(0.15).attack(0.05).release(0.1),
  sound("brown").gain(0.1).attack(0.5).release(1).pan(1).vowel('u'),
  note("~ c3 b5 c#2 a4 e4").sound("sine").lpf(2737).lpf(2985).gain(0.5)
)

let s2 = stack(
  note("g0 ~ g [f#4 e6]").sound("sine").pan(0).room("<0.4 0.0 0.8>").hpf(104).gain(0.6),
  note("[f5 c1 d5]").sound("pink").pan(0).gain(0.15).attack(0.05).release(0.1).vowel('e'),
  sound("brown").gain(0.1).attack(0.5).release(1).hpf(672).hpf(761),
  note("~ a3 c3 bb3 b2 d3").sound("sine").delay(0.5),
  note("f4 ~").sound("piano").pan(0).gain(0.5)
)

let s3 = stack(
  note("eb3 ~ f2 [a4 g0]").sound("sine").pan(0).room("<0.2 0.0 0.1>").hpf(294).gain(0.6),
  note("[f e3 eb1]").sound("brown").pan(sine.range(0, 1).slow(4)).gain(0.15).attack(0.05).release(0.1).vowel('u').vowel('a'),
  sound("brown").gain(0.1).attack(0.5).release(1).pan(1).delay(0.43).hpf(765),
  note("~ f1 b4 f1 g#3 f#1").sound("sine").delay(0.57).delay(0.69).gain(0.5)
)

let s4 = stack(
  note("eb3 ~ e3 [g4 g5]").sound("sine").pan(0).room("<0.8 0.7 0.3>").crush(11).gain(0.6),
  note("[a1 e6 c5]").sound("brown").pan(0).gain(0.15).attack(0.05).release(0.1),
  sound("brown").gain(0.1).attack(0.5).release(1),
  note("~ bb3 c#5 d4 g2 e6").sound("piano").gain(0.5),
  note("b5 ~").sound("sine").pan(1)
)

$: cat(s1, s2, s3, s4)
$: sound("bd hh hh hh").bank("RolandSystem100").delay(0.47)