/* Astro | Star Data
RA: 92 | DEC: -19 | MAG: 6
North Star: 17 Lep
Loner Star: HR 2161
Center Star: 19 Lep
Brightest Star: 15Del Lep */

setcpm(20)

let s1 = stack(
  note("g3 ~ e1 [c#6 bb2]").sound("fingercymbal").pan(0).room("<1.0 0.0 0.1>").gain(0.6),
  note("[eb3 eb6 g6]").sound("pink").pan(0).gain(0.15).attack(0.05).release(0.1).hpf(286),
  sound("brown").gain(0.1).attack(0.5).release(1).pan(1).crush(13).vowel('o'),
  note("~ f3 b6 c#1 g4 e6").sound("vibraphone").gain(0.5)
)

let s2 = stack(
  note("g#6 ~ g#5 [e2 e4]").sound("wind").pan(0).room("<0.1 0.3 0.8>").gain(0.6),
  note("[e5 c#5 e1]").sound("brown").pan(0).gain(0.15).attack(0.05).release(0.1).delay(0.15),
  sound("brown").gain(0.1).attack(0.5).release(1),
  note("~ b e2 a3 d1 d6").sound("sine"),
  note("f4 ~").sound("glockenspiel").pan(0).gain(0.5)
)

let s3 = stack(
  note("e3 ~ e2 [e5 f2]").sound("marimba").pan(0).room("<0.2 0.8 0.6>").delay(0.24).crush(16).gain(0.6),
  note("[e0 b5 g5]").sound("pink").pan(sine.range(0, 1).slow(4)).gain(0.15).attack(0.05).release(0.1),
  sound("brown").gain(0.1).attack(0.5).release(1).pan(1).hpf(997),
  note("~ b6 g#6 g#5 g#1 c#4").sound("piano1").vowel('o').gain(0.5)
)

let s4 = stack(
  note("eb3 ~ bb4 [a1 e]").sound("rd").pan(0).room("<0.4 0.3 0.3>").hpf(147).gain(0.6),
  note("[bb1 f#2 f4]").sound("pink").pan(0).gain(0.15).attack(0.05).release(0.1).delay(0.38).lpf(1988),
  sound("brown").gain(0.1).attack(0.5).release(1),
  note("~ b4 b2 d2 c3 eb4").sound("vibraphone").gain(0.5),
  note("c4 ~").sound("piano1").pan(1)
)

$: cat(s1, s2, s3, s4)
$: sound("bd hh hh hh").bank("SakataDPM48").hpf(656)