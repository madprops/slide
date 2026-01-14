/* High Spirit
RA: 153 | DEC: -61 | MAG: 6
North Star: HR 3998
Loner Star: HR 4056
Center Star: HR 3990
Brightest Star: HR 4041 */

setcpm(45)

let s1 = stack(
  note("c3 ~ g4 [b e]").sound("darbuka").pan(0).room("<0.0 0.6 0.4>").crush(9).crush(11).gain(0.6),
  note("[f4 a1 b]").sound("pink").pan(0).gain(0.15).attack(0.05).release(0.1).delay(0.52),
  sound("brown").gain(0.1).attack(0.8).release(2.9).pan(0.4),
  note("~ a3 d5 g0 g1 c#5").sound("fingercymbal").delay(0.64).lpf(2982).gain(0.5)
)

let s2 = stack(
  note("<b5 c#1> ~ f#2 [a3 c1]").sound("darbuka").pan(0).room("<0.4 0.9 0.2>").delay(0.51).gain(0.6),
  note("[c3 <e2 f#3> b6]").sound("brown").pan(0).gain(0.15).attack(0.05).release(0.1).lpf(562).lpf(2612),
  sound("brown").gain(0.1).attack(0.7).release(0.8).crush(11),
  note("~ <e3 g0 f#2> e1 g2 a c0").sound("glockenspiel").delay(0.16).delay(0.38),
  note("f4 ~").sound("dantranh").pan(0).gain(0.5)
)

let s3 = stack(
  note("a5 ~ a3 [bb6 e3]").sound("vibraphone").pan(0).room("<0.7 0.6 0.3>").vowel('a').gain(0.6),
  note("[c3 eb4 f#3]").sound("pink").pan(sine.range(0, 1).slow(4)).gain(0.15).attack(0.05).release(0.1).crush(11),
  sound("brown").gain(0.1).attack(0.1).release(0.9).pan(0.9),
  note("~ f6 a3 a6 f5 c0").sound("<dantranh piano fingercymbal>").hpf(203).gain(0.5)
)

let s4 = stack(
  note("eb3 ~ g0 [c5 g#6]").sound("rd").pan(0).room("<0.5 1.0 0.3>").hpf(437).vowel('u').gain(0.6),
  note("[bb6 bb4 c5]").sound("oceandrum").pan(0).gain(0.15).attack(0.05).release(0.1).crush(5).hpf(857),
  sound("brown").gain(0.1).attack(0.7).release(2.3).delay(0.49),
  note("~ c1 <g#4 d4 d1> f5 g5 b5").sound("sine").gain(0.5),
  note("e5 ~").sound("<piano sine glockenspiel>").pan(0.2)
)

let p1 = sound("bd sd [bd bd] sd").bank("RolandTR626")
let p2 = sound("bd hh hh [sd sd]").bank("YamahaRM50")
let p3 = sound("bd [hh hh] sd hh").bank("SakataDPM48").lpf(1600)
let p4 = sound("bd sd bd sd").bank("RhodesPolaris")

$: cat(s1, s2, s3, s4)
$: cat(p1, p2, p3, p4)