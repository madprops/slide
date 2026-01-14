/* Titan Mox
RA: 188 | DEC: -63 | MAG: 5
North Star: HR 4759
Loner Star: HR 4759
Center Star: HR 4762
Brightest Star: Alp1Cru */

setcpm(48)

let s1 = stack(
  note("g1 ~ e1 [a5 <eb6 bb5 c2>]").sound("dantranh").pan(0).room("<0.9 0.9 0.8>").vowel('a').gain(0.6),
  note("[<d6 bb3 g#3> ~ <e2 b1 b5>]").sound("pink").pan(0).gain(0.15).attack(0.05).release(0.1).crush(8),
  sound("brown").gain(0.1).attack(0.9).release(1.1).pan(0.7),
  note("~ b1 <g g#5 e2> a e3 f").sound("<strumstick belltree vibraphone>").crush(10).gain(0.5)
)

let s2 = stack(
  note("g4 ~ g2 [b3 <bb3 c>]").sound("glockenspiel").pan(0).room("<0.6 0.6 0.3>").crush(16).gain(0.6),
  note("[e3 g a5]").sound("oceandrum").pan(0).gain(0.15).attack(0.05).release(0.1),
  sound("brown").gain(0.1).attack(0.8).release(0.6).crush(15),
  note("~ f2 g#3 c#2 a6 <f#1 b4>").sound("strumstick"),
  note("f4 ~").sound("kawai").pan(0).lpf(2676).gain(0.5)
)

let s3 = stack(
  note("g2 ~ f6 [f1 <e3 g1 bb4>]").sound("vibraphone").pan(0).room("<0.0 1.0 0.4>").gain(0.6),
  note("[c#3 f5 b3]").sound("brown").pan(sine.range(0, 1).slow(4)).gain(0.15).attack(0.05).release(0.1).vowel('i').delay(0.41),
  sound("brown").gain(0.1).attack(0.4).release(2.1).pan(0.7).lpf(2537).hpf(413),
  note("~ c6 f6 f2 c4 f#6").sound("marimba").gain(0.5)
)

let s4 = stack(
  note("eb3 ~ g#6 [g e]").sound("piano").pan(0).room("<0.5 0.4 0.5>").gain(0.6),
  note("[g0 c#3 <d bb3 e2>]").sound("<brown pink>").pan(0).gain(0.15).attack(0.05).release(0.1).vowel('e').vowel('a'),
  sound("brown").gain(0.1).attack(0.4).release(1.5).lpf(1961).hpf(823),
  note("~ d6 bb6 f5 c4 a1").sound("fingercymbal").crush(11).gain(0.5),
  note("g#6 ~").sound("glockenspiel").pan(0.2)
)

let p1 = sound("bd hh hh hh").bank("<DoepferMS404 RhodesPolaris RolandJD990>").crush(15).delay(0.2)
let p2 = sound("bd [hh hh] sd hh").bank("RolandTR626")
let p3 = sound("bd sd [bd bd] sd").bank("SakataDPM48")
let p4 = sound("bd [hh hh] sd hh").bank("CasioRZ1")

$: cat(s1, s2, s3, s4)
$: cat(p1, p2, p3, p4)