/* Astro 🌌 Star Data
RA: 331 | DEC: 13 | MAG: 6
North Star: HR 8422
Loner Star: HR 8300
Center Star: 20 Peg
Brightest Star: 17 Peg */

setcpm(27)

let s1 = stack(
  note("g#3 ~ c7 [f5 g#4]").sound("sine").pan(0).room("<0.4 0.6 0.5>").gain(0.6),
  note("[a g6 bb5]").sound("brown").pan(0).gain(0.15).attack(0.05).release(0.1),
  sound("brown").gain(0.1).attack(0.5).release(1).pan(1).hpf(477),
  note("~ g4 a1 e6 c d6").sound("piano").gain(0.5)
)

let s2 = stack(
  note("g2 ~ d [b3 d5]").sound("piano").pan(0).room("<0.9 0.5 0.4>").lpf(2149).crush(13).gain(0.6),
  note("[g2 f#5 g5]").sound("pink").pan(0).gain(0.15).attack(0.05).release(0.1).vowel('i'),
  sound("brown").gain(0.1).attack(0.5).release(1).delay(0.15).delay(0.65),
  note("~ f2 g#3 e7 a4 g#4").sound("sine").vowel('i').hpf(568),
  note("f4 ~").sound("sine").pan(0).gain(0.5)
)

let s3 = stack(
  note("b3 ~ g#5 [f bb1]").sound("piano").pan(0).room("<0.3 0.4 0.0>").vowel('a').gain(0.6),
  note("[c2 f5 bb2]").sound("pink").pan(sine.range(0, 1).slow(4)).gain(0.15).attack(0.05).release(0.1).vowel('u'),
  sound("brown").gain(0.1).attack(0.5).release(1).pan(1),
  note("~ f6 e3 a6 g4 f#4").sound("piano").gain(0.5)
)

let s4 = stack(
  note("eb3 ~ c#5 [d3 g4]").sound("sine").pan(0).room("<1.0 0.0 1.0>").hpf(782).gain(0.6),
  note("[bb4 b f]").sound("pink").pan(0).gain(0.15).attack(0.05).release(0.1),
  sound("brown").gain(0.1).attack(0.5).release(1).vowel('o'),
  note("~ eb2 c#1 bb3 g#6 g5").sound("piano").gain(0.5),
  note("eb6 ~").sound("sine").pan(1).crush(15)
)

$: cat(s1, s2, s3, s4)
$: sound("bd hh sd hh").bank("RhodesPolaris")