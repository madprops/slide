/* Astro | Star Data
RA: 211 | DEC: 54 | MAG: 6
North Star: HR 5293
Loner Star: HR 5293
Center Star: 86 UMa
Brightest Star: 17Kap2Boo */

setcpm(23)

let s1 = stack(
  note("d3 ~ c#3 [e7 d6]").sound("sine").pan(0).room("<0.0 1.0 0.8>").gain(0.6),
  note("[f2 d3 bb6]").sound("pink").pan(0).gain(0.15).attack(0.05).release(0.1).crush(9).lpf(2836),
  sound("brown").gain(0.1).attack(0.5).release(1).pan(1).vowel('i').lpf(2631),
  note("~ b6 f#1 c3 g#2 f#4").sound("glockenspiel").gain(0.5)
)

let s2 = stack(
  note("f4 ~ d2 [g#4 eb3]").sound("rd").pan(0).room("<0.1 1.0 0.6>").gain(0.6),
  note("[eb5 a2 g6]").sound("oceandrum").pan(0).gain(0.15).attack(0.05).release(0.1),
  sound("brown").gain(0.1).attack(0.5).release(1),
  note("~ f3 bb5 b5 c6 e0").sound("marimba").crush(9),
  note("f4 ~").sound("vibraphone").pan(0).hpf(966).gain(0.5)
)

let s3 = stack(
  note("c#2 ~ f#5 [f3 c4]").sound("glo").pan(0).room("<0.3 0.5 1.0>").vowel('e').gain(0.6),
  note("[c6 e6 g#4]").sound("brown").pan(sine.range(0, 1).slow(4)).gain(0.15).attack(0.05).release(0.1).lpf(1268),
  sound("brown").gain(0.1).attack(0.5).release(1).pan(1),
  note("~ d4 c#4 c#3 a bb1").sound("piano").crush(8).gain(0.5)
)

let s4 = stack(
  note("eb3 ~ e1 [b2 d]").sound("belltree").pan(0).room("<0.2 0.5 0.0>").hpf(558).vowel('a').gain(0.6),
  note("[g4 bb1 g]").sound("pink").pan(0).gain(0.15).attack(0.05).release(0.1).lpf(1774),
  sound("brown").gain(0.1).attack(0.5).release(1).hpf(969),
  note("~ a eb1 f#1 d c").sound("piano").vowel('u').gain(0.5),
  note("c6 ~").sound("darbuka").pan(1)
)

$: cat(s1, s2, s3, s4)
$: sound("bd sd [bd bd] sd").bank("RhodesPolaris")