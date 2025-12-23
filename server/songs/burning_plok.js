/* Astro 🌌 Star Data

RA: 27.459428112089743
DEC: 7.7239609053497915

North Star: 42 Cas
Loner Star: HR 568
Center Star: 110Omi Psc
Brightest Star: 6Bet Ari
*/

setcpm(29)

let s1 = stack(
  note("f5 ~ e5 [b1 c#4]").sound("sine").pan(0).room("<0.6 0.9 0.4>").delay(0.51).gain(0.6),
  note("[d b4 c4]").sound("pink").pan(0).gain(0.15).attack(0.05).release(0.1).crush(4),
  sound("brown").gain(0.1).attack(0.5).release(1).pan(1).crush(11),
  note("~ b1 b2 f#6 f bb3").sound("sine").crush(15).gain(0.5)
)

let s2 = stack(
  note("d1 ~ c4 [c0 g2]").sound("piano").pan(0).room("<0.1 0.0 0.5>").gain(0.6),
  note("[f#6 f1 eb1]").sound("pink").pan(0).gain(0.15).attack(0.05).release(0.1).vowel('u'),
  sound("brown").gain(0.1).attack(0.5).release(1),
  note("~ d b5 c5 d3 a3").sound("piano").vowel('a'),
  note("f4 ~").sound("sine").pan(0).gain(0.5)
)

let s3 = stack(
  note("bb6 ~ g [g4 f2]").sound("piano").pan(0).room("<0.3 0.7 0.5>").gain(0.6),
  note("[g0 d6 f5]").sound("brown").pan(sine.range(0, 1).slow(4)).gain(0.15).attack(0.05).release(0.1).crush(12),
  sound("brown").gain(0.1).attack(0.5).release(1).pan(1).hpf(595).vowel('i'),
  note("~ eb5 e6 f6 e7 c#5").sound("sine").lpf(1516).lpf(1047).gain(0.5)
)

let s4 = stack(
  note("eb3 ~ f4 [f#5 b5]").sound("sine").pan(0).room("<0.7 0.9 0.5>").crush(13).lpf(264).gain(0.6),
  note("[d4 f#5 e2]").sound("brown").pan(0).gain(0.15).attack(0.05).release(0.1).hpf(797),
  sound("brown").gain(0.1).attack(0.5).release(1).delay(0.55),
  note("~ g7 c d2 g5 c2").sound("piano").lpf(696).gain(0.5),
  note("c0 ~").sound("sine").pan(1).crush(7)
)

$: cat(s1, s2, s3, s4)
$: sound("bd hh hh hh").bank("RhodesPolaris").lpf(759)