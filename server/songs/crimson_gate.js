/* Astro | Star Data
RA: 283 | DEC: 78 | MAG: 6
North Star: HR 7413
Loner Star: HR 7149
Center Star: HR 7235
Brightest Star: 59 Dra */

setcpm(27)

let s1 = stack(
  note("f#1 ~ a5 [<bb1 g#4 c#1> e3]").sound("kawai").pan(0).room("<0.4 0.3 0.9>").hpf(420).gain(0.6),
  note("[<f#1 a> c7 b3]").sound("oceandrum").pan(0).gain(0.15).attack(0.05).release(0.1).vowel('u').vowel('e'),
  sound("brown").gain(0.1).attack(0.5).release(1).pan(1).crush(16).delay(0.39),
  note("~ d1 f#6 bb5 d e1").sound("<fingercymbal piano1>").gain(0.5)
)

let s2 = stack(
  note("g5 ~ e1 [e4 d4]").sound("rd").pan(0).room("<0.3 0.2 0.0>").crush(7).gain(0.6),
  note("[g4 eb3 f#5]").sound("<oceandrum oceandrum pink>").pan(0).gain(0.15).attack(0.05).release(0.1),
  sound("brown").gain(0.1).attack(0.5).release(1),
  note("~ d ~ d3 f3 bb6").sound("glockenspiel"),
  note("f4 ~").sound("strumstick").pan(0).delay(0.41).hpf(836).gain(0.5)
)

let s3 = stack(
  note("c#4 ~ f2 [b5 g#4]").sound("glo").pan(0).room("<0.7 0.1 0.6>").crush(14).gain(0.6),
  note("[<eb6 c#1> c <g0 f1>]").sound("brown").pan(sine.range(0, 1).slow(4)).gain(0.15).attack(0.05).release(0.1).hpf(511).lpf(2384),
  sound("brown").gain(0.1).attack(0.5).release(1).pan(1),
  note("~ e0 f3 g7 e4 c2").sound("<piano1 fingercymbal glo>").gain(0.5)
)

let s4 = stack(
  note("eb3 ~ e2 [f#1 <f1 g#1 c3>]").sound("rd").pan(0).room("<0.6 0.6 0.0>").hpf(466).gain(0.6),
  note("[eb5 g7 <bb5 f#4 a3>]").sound("<oceandrum oceandrum>").pan(0).gain(0.15).attack(0.05).release(0.1).lpf(2845).hpf(324),
  sound("brown").gain(0.1).attack(0.5).release(1),
  note("~ <g4 e g7> <f4 b4> c2 f#6 d5").sound("piano").vowel('e').delay(0.55).gain(0.5),
  note("eb1 ~").sound("piano1").pan(1).lpf(2319)
)

let p1 = sound("bd hh hh hh").bank("RolandTR626")
let p2 = sound("bd sd bd sd").bank("YamahaRM50")
let p3 = sound("bd hh hh [sd sd]").bank("<CasioRZ1 SakataDPM48>")
let p4 = sound("bd hh hh hh").bank("RolandJD990")

$: cat(s1, s2, s3, s4)
$: cat(p1, p2, p3, p4)