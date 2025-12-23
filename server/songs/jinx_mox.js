/* Astro 🌌 Star Data

RA: 21.624462289087198
DEC: 12.168388106416275

North Star: HR 283
Loner Star: HR 417
Center Star: 99Eta Psc
Brightest Star: 37Del Cas
*/

setcpm(29)

let s1 = stack(
  note("g7 ~ b6 [eb3 f4]").sound("piano").pan(0).room("<0.5 0.5 0.8>").gain(0.6),
  note("[g0 f#1 b6]").sound("pink").pan(0).gain(0.15).attack(0.05).release(0.1),
  sound("brown").gain(0.1).attack(0.5).release(1).pan(1).hpf(214).delay(0.34),
  note("~ c#5 g4 d4 b6 c#1").sound("sine").crush(10).crush(14).gain(0.5)
)

let s2 = stack(
  note("bb1 ~ c7 [bb6 a3]").sound("sine").pan(0).room("<0.1 0.7 0.2>").crush(10).lpf(1590).gain(0.6),
  note("[c#1 b6 c#1]").sound("pink").pan(0).gain(0.15).attack(0.05).release(0.1),
  sound("brown").gain(0.1).attack(0.5).release(1).delay(0.2),
  note("~ f5 bb5 bb3 eb1 f3").sound("piano"),
  note("f4 ~").sound("sine").pan(0).vowel('i').gain(0.5)
)

let s3 = stack(
  note("b5 ~ a4 [b5 bb3]").sound("piano").pan(0).room("<0.9 0.4 0.3>").gain(0.6),
  note("[bb5 e2 c0]").sound("pink").pan(sine.range(0, 1).slow(4)).gain(0.15).attack(0.05).release(0.1).crush(4).delay(0.27),
  sound("brown").gain(0.1).attack(0.5).release(1).pan(1).hpf(679).lpf(2671),
  note("~ f#6 g2 c0 g6 bb2").sound("sine").gain(0.5)
)

let s4 = stack(
  note("eb3 ~ e2 [bb2 d1]").sound("sine").pan(0).room("<1.0 0.7 0.4>").lpf(1780).vowel('a').gain(0.6),
  note("[d3 f#1 c6]").sound("pink").pan(0).gain(0.15).attack(0.05).release(0.1).vowel('o'),
  sound("brown").gain(0.1).attack(0.5).release(1).lpf(2456),
  note("~ c#6 d4 g7 g7 bb3").sound("piano").gain(0.5),
  note("c3 ~").sound("sine").pan(1)
)

$: cat(s1, s2, s3, s4)
$: sound("bd sd bd sd").bank("YamahaRM50").delay(0.22)