// Author: madprops
// CPM: 25

cat(
	cat(
		stack(
			note("eb3 f4b d4 [g4 g4]").sound("sine").pan(-0.3).room("<0 .5 .6>"),
			note("[d4 d4 d4]").sound("pink").pan(-0.6).gain(0.4),
			sound("brown").gain(0.4).pan(1.8),
			sound('rim sd').pan(0.6).gain(0.5).room("<0 .2 .4 .6 .8>"),
			sound('~12 moog').pan(0.6).gain(0.666).room("<0 .2 .4 .6 .8>"),
			note("~ g g a a4 eb3").sound("sine"),
		),
		stack(
			note("eb3 f4b d4 [g4 g4]").sound("sine").pan(-0.3).room("<0 .5 .6>"),
			note("[d4 d4 d4]").sound("pink").pan(-0.6).gain(0.4),
			sound("brown").gain(0.4),
			sound('rim sd').pan(0.6).gain(0.5).room("<0 .2 .4 .6 .8>"),
			sound('~12 moog').pan(0.6).gain(0.666).room("<0 .2 .4 .6 .8>"),
			note("~ g g a a4 eb3").sound("sine"),
			note("f4 ~8").sound("sine").pan(-.8),
		)
	),
	cat(
		stack(
			note("eb3 f4b d4 [g4 g4]").sound("sine").pan(-0.3).room("<0 .5 .6>"),
			note("[d4 d4 d4]").sound("white").pan(sine.range(0, 1).slow(4)).gain(0.2),
			sound("brown").gain(0.4).pan(1.8),
			sound('rim sd').pan(0.6).gain(0.5).room("<0 .2 .4 .6 .8>"),
			sound('~12 moog').pan(0.6).gain(0.666).room("<0 .2 .4 .6 .8>"),
			note("~ g f a a4 f").sound("sine"),
		),
		stack(
			note("eb3 f4b d4 [g4 g4]").sound("sine").pan(-0.3).room("<0 .5 .6>"),
			note("[d4 d4 d4]").sound("pink").pan(-0.6).gain(0.4),
			sound("brown").gain(0.4),
			sound('rim sd').pan(0.6).gain(0.5).room("<0 .2 .4 .6 .8>"),
			sound('~12 moog').pan(0.6).gain(0.666).room("<0 .2 .4 .6 .8>"),
			note("~ g g a a4 eb3").sound("sine"),
			note("g ~8").sound("sine").pan(1.8),
		)
	)
)