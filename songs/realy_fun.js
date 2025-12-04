_$: s("[bd <hh oh>]*2").bank("tr909").dec(.4)

samples('https://samples.grbt.com.au/strudel.json')

$: s("kvbass")
  .struct("t(7,16)")
  .delay(1)
  .lpf("<100 100 500 100>*4")
  .clip("<0.4 2 0 0.4 0.4>*4")

$: s("sbd")
  .struct("x!4")
  .lpf("500 500 2000!2")
  .gain("1.5")
  .delay(.1)

$: s("kit1")
  .loopAt(4)
  .chop(64)
  .struct("t(7,16,1)")
  .hpf("1000")
  .delay(1)
  .dfb("0.99?")
  .mask("<0 1 0 0>")
  .clip(0.5)

$: s("bbox:3")
  .struct(`<[x [- x] [ x x - x] x]
           [x [- x] [ x x - x] x]
           [x [- x] [ x x x x] [- x]]
           [x [- x] [ x x - x] x]>`)
  .delay("<0 .25 0 .5>")
  .clip(.4)
  .lpf("400")
  .distort("2:.2:3")

$: s("vp330koleen:E3")
  .loopAt(4)
  .clip(0.6)
  .chop(512)
  .mask("<0 0 0 1>")
  .gain("1.5")
  .delay(2.5)
  .lpf("350")