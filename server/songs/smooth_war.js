/* Smooth War
RA: 104 | DEC: 81 | MAG: 6
North Star: HR 2602
Loner Star: HR 2360
Center Star: HR 2702
Brightest Star: HR 2520 */

setcpm(26)

let s1 = stack(
  note("b5 ~ <g5 b2 eb4> [<b2 a3> e]").sound("vibraphone").pan(0).room("<0.3 1.0 0.3>").gain(0.6),
  note("[d5 f#5 g5]").sound("oceandrum").pan(0).gain(0.15).attack(0.05).release(0.1).delay(0.34),
  sound("brown").gain(0.1).attack(0.1).release(2.8).pan(0.9).crush(13).vowel('o'),
  note("~ c0 <g3 f#2> d2 g c7").sound("<glo belltree marimba>").gain(0.5)
)

let s2 = stack(
  note("eb4 ~ g4 [g#4 c#3]").sound("fingercymbal").pan(0).room("<0.0 0.6 0.9>").lpf(531).hpf(339).gain(0.6),
  note("[c#4 <e4 f1 a2> e4]").sound("pink").pan(0).gain(0.15).attack(0.05).release(0.1).delay(0.6),
  sound("brown").gain(0.1).attack(0.6).release(2.5).vowel('i'),
  note("~ g1 <g5 c#6 e2> e5 e4 <bb6 eb3 b>").sound("piano1").vowel('a'),
  note("f4 ~").sound("<darbuka fingercymbal>").pan(0).gain(0.5)
)

let s3 = stack(
  note("eb6 ~ <f#4 f4 b2> [b5 <a4 d3 a3>]").sound("marimba").pan(0).room("<0.5 0.3 0.1>").crush(9).gain(0.6),
  note("[e6 f#2 <c5 b6 e>]").sound("<pink pink oceandrum>").pan(sine.range(0, 1).slow(4)).gain(0.15).attack(0.05).release(0.1).vowel('a').lpf(1085),
  sound("brown").gain(0.1).attack(0.8).release(2.0).pan(0.1).delay(0.27),
  note("~ g3 a3 g5 d1 <a5 e5>").sound("<glockenspiel sine>").lpf(1514).gain(0.5)
)

let s4 = stack(
  note("eb3 ~ c0 [c2 c#3]").sound("fingercymbal").pan(0).room("<0.2 0.8 0.4>").gain(0.6),
  note("[a4 a4 g]").sound("brown").pan(0).gain(0.15).attack(0.05).release(0.1).hpf(390),
  sound("brown").gain(0.1).attack(0.2).release(1.0),
  note("~ f b3 g f2 e7").sound("glo").gain(0.5),
  note("f#3 ~").sound("sine").pan(0.3).hpf(699)
)

let p1 = sound("bd sd [bd bd] sd").bank("YamahaRM50")
let p2 = sound("bd sd [bd bd] sd").bank("YamahaRM50")
let p3 = sound("bd hh sd hh").bank("RolandTR626").hpf(748)
let p4 = sound("bd sd [bd bd] sd").bank("YamahaRM50")

$: cat(s1, s2, s3, s4)
$: cat(p1, p2, p3, p4)