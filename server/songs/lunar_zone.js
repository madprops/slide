/* Lunar Zone
RA: 15 | DEC: 3 | MAG: 6
North Star: HR 281
Loner Star: 14 Cet
Center Star: 26 Cet
Brightest Star: 20 Cet */

setcpm(37)

let s1 = stack(
  note("<c3 f#6 bb6> ~ c0 [<eb1 c> f2]").sound("dantranh").pan(0).room("<0.9 0.2 0.8>").delay(0.6).gain(0.6),
  note("[c#5 b1 f#1]").sound("pink").pan(0).gain(0.15).attack(0.05).release(0.1).delay(0.56),
  sound("brown").gain(0.1).attack(0.8).release(1.0).pan(0.6).delay(0.48),
  note("~ e5 c#4 f#1 d2 f#6").sound("marimba").vowel('u').crush(9).gain(0.5)
)

let s2 = stack(
  note("a1 ~ d4 [d4 b1]").sound("piano").pan(0).room("<0.8 0.7 0.2>").crush(14).gain(0.6),
  note("[e6 f#4 g#6]").sound("<oceandrum brown brown>").pan(0).gain(0.15).attack(0.05).release(0.1).delay(0.58),
  sound("brown").gain(0.1).attack(0.6).release(1.1),
  note("~ g#5 f2 <a5 a6> eb3 e0").sound("marimba").hpf(660),
  note("f4 ~").sound("<fingercymbal fingercymbal>").pan(0).gain(0.5)
)

let s3 = stack(
  note("g1 ~ e6 [c#2 d6]").sound("wind").pan(0).room("<0.8 0.9 0.7>").vowel('e').gain(0.6),
  note("[e b3 c2]").sound("brown").pan(sine.range(0, 1).slow(4)).gain(0.15).attack(0.05).release(0.1),
  sound("brown").gain(0.1).attack(0.7).release(1.2).pan(0.8),
  note("~ d6 b bb4 f6 g#1").sound("piano").gain(0.5)
)

let s4 = stack(
  note("eb3 ~ a1 [f#6 c1]").sound("sine").pan(0).room("<0.4 0.2 0.7>").crush(12).gain(0.6),
  note("[<d5 d4> g f#5]").sound("pink").pan(0).gain(0.15).attack(0.05).release(0.1),
  sound("brown").gain(0.1).attack(0.2).release(2.2).delay(0.19),
  note("~ e d1 b2 <e3 e7 b5> eb3").sound("darbuka").vowel('o').delay(0.17).gain(0.5),
  note("g#2 ~").sound("<strumstick glo>").pan(0.6).crush(8)
)

let p1 = sound("bd sd bd sd").bank("BossDR550")
let p2 = sound("bd hh hh hh").bank("BossDR550")
let p3 = sound("bd hh hh hh").bank("BossDR550")
let p4 = sound("bd hh hh hh").bank("BossDR550")

$: cat(s1, s2, s3, s4)
$: cat(p1, p2, p3, p4)