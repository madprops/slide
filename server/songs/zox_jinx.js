/* Astro | Star Data
RA: 274 | DEC: 78 | MAG: 5
North Star: HR 7014
Loner Star: HR 7014
Center Star: HR 6995
Brightest Star: 44Chi Dra */

setcpm(29)

let s1 = stack(
  note("bb1 ~ <g b5 a> [c#6 f1]").sound("piano").pan(0).room("<0.7 0.7 0.6>").vowel('i').gain(0.6),
  note("[f6 b2 g5]").sound("pink").pan(0).gain(0.15).attack(0.05).release(0.1).lpf(1699).vowel('o'),
  sound("brown").gain(0.1).attack(0.5).release(1).pan(1),
  note("~ g4 c3 bb1 g0 <bb4 f#6 c>").sound("<marimba fingercymbal>").gain(0.5)
)

let s2 = stack(
  note("e5 ~ b4 [eb6 g#3]").sound("sine").pan(0).room("<0.4 0.3 0.6>").vowel('u').gain(0.6),
  note("[b3 <c a1> c1]").sound("oceandrum").pan(0).gain(0.15).attack(0.05).release(0.1),
  sound("brown").gain(0.1).attack(0.5).release(1),
  note("~ c d g g0 f#3").sound("vibraphone").hpf(722),
  note("f4 ~").sound("belltree").pan(0).hpf(790).gain(0.5)
)

let s3 = stack(
  note("b4 ~ bb1 [<bb4 c#2 eb3> e0]").sound("darbuka").pan(0).room("<0.0 0.7 0.5>").lpf(2451).gain(0.6),
  note("[d2 a6 g]").sound("brown").pan(sine.range(0, 1).slow(4)).gain(0.15).attack(0.05).release(0.1),
  sound("brown").gain(0.1).attack(0.5).release(1).pan(1).vowel('o'),
  note("~ g#1 bb5 c5 a6 d").sound("dantranh").gain(0.5)
)

let s4 = stack(
  note("eb3 ~ g3 [c5 bb2]").sound("glo").pan(0).room("<0.6 0.0 1.0>").gain(0.6),
  note("[c#1 eb6 <d g2 d1>]").sound("<oceandrum pink pink>").pan(0).gain(0.15).attack(0.05).release(0.1).delay(0.31),
  sound("brown").gain(0.1).attack(0.5).release(1).hpf(469),
  note("~ d1 bb2 <c5 c#4 f#3> f2 <e3 g0>").sound("<rd dantranh sine>").gain(0.5),
  note("e2 ~").sound("kawai").pan(1).hpf(986)
)

let p1 = sound("bd sd [bd bd] sd").bank("SakataDPM48")
let p2 = sound("bd hh hh hh").bank("<CasioRZ1 SakataDPM48>")
let p3 = sound("bd hh hh [sd sd]").bank("RolandJD990")
let p4 = sound("bd hh hh [sd sd]").bank("RolandJD990")

$: cat(s1, s2, s3, s4)
$: cat(p1, p2, p3, p4)