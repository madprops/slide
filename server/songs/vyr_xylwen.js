/* Astro | Star Data
RA: 307 | DEC: 78 | MAG: 6
North Star: HR 7917
Loner Star: HR 7791
Center Star: 1Kap Cep
Brightest Star: 1Kap Cep */

setcpm(28)

let s1 = stack(
  note("eb3 ~ bb5 [c1 <g0 b2>]").sound("<dantranh darbuka>").pan(0).room("<0.6 1.0 1.0>").hpf(478).vowel('i').gain(0.6),
  note("[<b5 f1> f3 ~]").sound("brown").pan(0).gain(0.15).attack(0.05).release(0.1).crush(7),
  sound("brown").gain(0.1).attack(0.5).release(1).pan(1).delay(0.26),
  note("~ eb4 f#5 <e a2> b4 a").sound("strumstick").gain(0.5)
)

let s2 = stack(
  note("c#2 ~ c#5 [~ g3]").sound("kawai").pan(0).room("<0.7 0.4 0.2>").gain(0.6),
  note("[d4 f#1 c#6]").sound("pink").pan(0).gain(0.15).attack(0.05).release(0.1),
  sound("brown").gain(0.1).attack(0.5).release(1),
  note("~ g6 f#1 <e1 g#1> f3 b5").sound("glo").delay(0.41).lpf(1280),
  note("f4 ~").sound("fingercymbal").pan(0).hpf(368).crush(11).gain(0.5)
)

let s3 = stack(
  note("g2 ~ g3 [e7 g0]").sound("wind").pan(0).room("<1.0 0.0 1.0>").gain(0.6),
  note("[e2 bb3 c#6]").sound("oceandrum").pan(sine.range(0, 1).slow(4)).gain(0.15).attack(0.05).release(0.1),
  sound("brown").gain(0.1).attack(0.5).release(1).pan(1).delay(0.68),
  note("~ e e5 eb3 d5 eb5").sound("<sine dantranh>").gain(0.5)
)

let s4 = stack(
  note("eb3 ~ <a c#5> [<bb6 c0> f#4]").sound("<vibraphone darbuka rd>").pan(0).room("<0.6 0.9 0.1>").hpf(473).gain(0.6),
  note("[c#5 f#5 eb5]").sound("pink").pan(0).gain(0.15).attack(0.05).release(0.1).vowel('u'),
  sound("brown").gain(0.1).attack(0.5).release(1),
  note("~ g#1 <e2 e0 g4> d1 <eb2 g#2 g#5> g#1").sound("<piano1 rd kawai>").hpf(262).vowel('u').gain(0.5),
  note("e ~").sound("fingercymbal").pan(1).delay(0.54)
)

let p1 = sound("bd hh sd hh").bank("YamahaRM50")
let p2 = sound("bd sd [bd bd] sd").bank("RolandSystem100")
let p3 = sound("bd sd [bd bd] sd").bank("RolandSystem100")
let p4 = sound("bd hh hh [sd sd]").bank("SakataDPM48")

$: cat(s1, s2, s3, s4)
$: cat(p1, p2, p3, p4)