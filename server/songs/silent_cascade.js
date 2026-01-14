/* Silent Cascade
RA: 184 | DEC: -75 | MAG: 6
North Star: HR 4636
Loner Star: HR 4636
Center Star: HR 4608
Brightest Star: Bet Cha */

setcpm(44)

let s1 = stack(
  note("a5 ~ f1 [e3 ~]").sound("<belltree glockenspiel fingercymbal>").pan(0).room("<0.9 0.3 0.5>").delay(0.67).crush(3).gain(0.6),
  note("[b2 g7 g#4]").sound("oceandrum").pan(0).gain(0.15).attack(0.05).release(0.1),
  sound("brown").gain(0.1).attack(0.4).release(1.8).pan(0.6).hpf(623),
  note("~ c1 bb4 d1 a4 e7").sound("sine").vowel('o').gain(0.5)
)

let s2 = stack(
  note("f3 ~ <b4 b6 c1> [c#5 c0]").sound("belltree").pan(0).room("<0.6 0.8 0.4>").gain(0.6),
  note("[<d2 eb6 g#3> <d3 b> a4]").sound("<brown oceandrum oceandrum>").pan(0).gain(0.15).attack(0.05).release(0.1).vowel('a'),
  sound("brown").gain(0.1).attack(0.1).release(1.6),
  note("~ f5 eb1 g4 f a4").sound("darbuka"),
  note("f4 ~").sound("marimba").pan(0).crush(4).gain(0.5)
)

let s3 = stack(
  note("<e5 c6 b4> ~ b6 [<g7 g4> b]").sound("piano").pan(0).room("<0.5 0.8 0.2>").gain(0.6),
  note("[f#1 c#4 e1]").sound("pink").pan(sine.range(0, 1).slow(4)).gain(0.15).attack(0.05).release(0.1).crush(6).vowel('u'),
  sound("brown").gain(0.1).attack(0.2).release(1.1).pan(0.9).crush(9),
  note("~ <c2 f#3> b2 g7 <g5 a6> bb1").sound("<piano belltree strumstick>").gain(0.5)
)

let s4 = stack(
  note("eb3 ~ bb4 [g#2 f]").sound("<glo piano1>").pan(0).room("<0.6 0.7 0.8>").gain(0.6),
  note("[eb3 <g#3 b4 b1> g1]").sound("pink").pan(0).gain(0.15).attack(0.05).release(0.1).lpf(582),
  sound("brown").gain(0.1).attack(0.5).release(2.8).hpf(402),
  note("~ bb1 g2 g0 c7 bb5").sound("belltree").gain(0.5),
  note("c#6 ~").sound("marimba").pan(0.1)
)

let p1 = sound("bd sd [bd bd] sd").bank("YamahaRM50")
let p2 = sound("bd hh sd hh").bank("YamahaRM50").delay(0.13)
let p3 = sound("~ ~ ~ ~")
let p4 = sound("bd sd bd sd").bank("DoepferMS404")

$: cat(s1, s2, s3, s4)
$: cat(p1, p2, p3, p4)