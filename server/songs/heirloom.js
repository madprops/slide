// Heirloom
// by madprops
setcpm(25)

let s1 = stack(
	note("eb3 ~ d4 [g4 g4]").sound("sine").pan(0).room("<0 .5 .6>"),
	note("[d4 d4 d4]").sound("pink").pan(0).gain(0.4),
	sound("brown").gain(0.4).pan(1),
	note("~ g g a a4 eb3").sound("sine"),
)

let s2 = stack(
	note("eb3 ~ d4 [g4 g4]").sound("sine").pan(0).room("<0 .5 .6>"),
	note("[d4 d4 d4]").sound("pink").pan(0).gain(0.4),
	sound("brown").gain(0.4),
	note("~ g g a a4 eb3").sound("sine"),
	note("f4 ~").sound("sine").pan(0),
)

let s3 = stack(
	note("eb3 ~ d4 [g4 g4]").sound("sine").pan(0).room("<0 .5 .6>"),
	note("[d4 d4 d4]").sound("white").pan(sine.range(0, 1).slow(4)).gain(0.2),
	sound("brown").gain(0.4).pan(1),
	note("~ g f a a4 f").sound("sine"),
)

let s4 = stack(
	note("eb3 ~ d4 [g4 g4]").sound("sine").pan(0).room("<0 .5 .6>"),
	note("[d4 d4 d4]").sound("pink").pan(0).gain(0.4),
	sound("brown").gain(0.4),
	note("~ g g a a4 eb3").sound("sine"),
	note("g ~").sound("sine").pan(1),
)

cat(s1, s2, s3, s4)