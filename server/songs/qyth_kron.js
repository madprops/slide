/* Qyth Kron
RA: 127 | DEC: -23 | MAG: 6
North Star: HR 3328
Loner Star: HR 3423
Center Star: HR 3337
Brightest Star: HR 3423 */

setcpm(44)

let s1 = stack(
  note("eb6 ~ bb2 [b eb1]").sound("darbuka").pan(0).room("<0.2 0.8 0.5>").gain(0.6),
  note("[a4 b5 eb5]").sound("<pink pink oceandrum>").pan(0).gain(0.15).attack(0.05).release(0.1),
  sound("brown").gain(0.1).attack(0.8).release(0.8).pan(0.5),
  note("~ <d2 c#1 a2> <e3 d2> e5 <bb2 c#6 f1> e5").sound("fingercymbal").delay(0.16).gain(0.5)
)

let s2 = stack(
  note("a4 ~ b3 [g#4 a2]").sound("vibraphone").pan(0).room("<0.0 0.8 0.9>").gain(0.6),
  note("[<f#6 f#3 c6> <b1 e1 g#1> eb5]").sound("<pink pink brown>").pan(0).gain(0.15).attack(0.05).release(0.1),
  sound("brown").gain(0.1).attack(0.5).release(2.8).lpf(961).delay(0.38),
  note("~ c#1 e0 d eb6 c5").sound("marimba"),
  note("f4 ~").sound("vibraphone").pan(0).delay(0.11).hpf(335).gain(0.5)
)

let s3 = stack(
  note("eb1 ~ f6 [eb6 a6]").sound("strumstick").pan(0).room("<0.6 0.1 0.6>").vowel('o').gain(0.6),
  note("[<bb4 d5 b2> b4 f#5]").sound("brown").pan(sine.range(0, 1).slow(4)).gain(0.15).attack(0.05).release(0.1).crush(9),
  sound("brown").gain(0.1).attack(0.3).release(1.7).pan(0.1).hpf(135),
  note("~ b4 d3 g#6 c6 eb6").sound("piano").gain(0.5)
)

let s4 = stack(
  note("eb3 ~ c#6 [bb3 <g#4 eb5 b6>]").sound("piano").pan(0).room("<0.6 1.0 0.3>").gain(0.6),
  note("[bb4 d f1]").sound("brown").pan(0).gain(0.15).attack(0.05).release(0.1).lpf(1086),
  sound("brown").gain(0.1).attack(0.4).release(2.8).vowel('e').hpf(586),
  note("~ g7 a3 f#4 c#1 g4").sound("belltree").gain(0.5),
  note("b5 ~").sound("strumstick").pan(0.9).lpf(642)
)

let p1 = sound("~ ~ ~ ~")
let p2 = sound("bd hh hh [sd sd]").bank("RhodesPolaris")
let p3 = sound("bd sd bd sd").bank("RolandJD990")
let p4 = sound("bd sd [bd bd] sd").bank("BossDR550")

$: cat(s1, s2, s3, s4)
$: cat(p1, p2, p3, p4)