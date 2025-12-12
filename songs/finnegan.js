// Finnegan
// By madprops
setcpm(60)

let s1 = stack(
	note("a b c@3 d"),
	note("g@2 a@0.5 a@0.5"),
	sound("bd bd [sd hh]").bank("EmuSP12"),
	sound("hh [hh hh hh]").bank("CasioRZ1").pan(0.9),
)

let s2 = stack(
	note("a b c@2 d"),
	note("g@2 a@0.3 a@0.4"),
	sound("bd bd [sd hh]").bank("EmuSP12"),
	sound("hh [hh hh hh]").bank("CasioRZ1").pan(0.2),
)

cat(s1, s2, s1, s2, s1, s2, s1, s2.cpm(2))