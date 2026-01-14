/* Astro | Star Data
RA: 231 | DEC: 76 | MAG: 5
North Star: HR 5587
Loner Star: HR 5470
Center Star: 15The UMi
Brightest Star: 13Gam UMi */

setcpm(23)

let s1 = stack(
  note("f#1 ~ c7 [b g4]").sound("sine").pan(0).room("<0.6 0.3 0.1>").vowel('o').gain(0.6),
  note("[f#3 g7 eb6]").sound("oceandrum").pan(0).gain(0.15).attack(0.05).release(0.1).delay(0.24),
  sound("brown").gain(0.1).attack(0.5).release(1).pan(1),
  note("~ g5 g#5 eb3 g2 b1").sound("marimba").lpf(298).delay(0.15).gain(0.5)
)

let s2 = stack(
  note("g7 ~ b4 [e1 a3]").sound("marimba").pan(0).room("<0.7 0.6 1.0>").crush(8).gain(0.6),
  note("[d2 bb2 c3]").sound("pink").pan(0).gain(0.15).attack(0.05).release(0.1).crush(5),
  sound("brown").gain(0.1).attack(0.5).release(1).lpf(2072),
  note("~ eb5 bb1 f5 e0 g4").sound("rd").vowel('i').vowel('a'),
  note("f4 ~").sound("darbuka").pan(0).delay(0.2).gain(0.5)
)

let s3 = stack(
  note("f5 ~ f#5 [f4 e0]").sound("marimba").pan(0).room("<0.8 0.7 1.0>").crush(12).gain(0.6),
  note("[c#2 bb6 g#6]").sound("oceandrum").pan(sine.range(0, 1).slow(4)).gain(0.15).attack(0.05).release(0.1).delay(0.42).vowel('a'),
  sound("brown").gain(0.1).attack(0.5).release(1).pan(1),
  note("~ e4 g7 e4 f5 c4").sound("strumstick").hpf(442).gain(0.5)
)

let s4 = stack(
  note("eb3 ~ e5 [g5 g4]").sound("fingercymbal").pan(0).room("<0.8 0.5 0.5>").gain(0.6),
  note("[d2 g1 g#6]").sound("pink").pan(0).gain(0.15).attack(0.05).release(0.1).delay(0.33),
  sound("brown").gain(0.1).attack(0.5).release(1),
  note("~ f#1 a3 c6 b1 b4").sound("sine").vowel('u').hpf(760).gain(0.5),
  note("f3 ~").sound("marimba").pan(1).hpf(679)
)

$: cat(s1, s2, s3, s4)
$: sound("bd [hh hh] sd hh").bank("RolandJD990").delay(0.2)