// "G.T.A. Hoffmann" @by superdirtspatz

samples('github:yaxu/clean-breaks')

let p1 = n("[0, 5, <10 12 10!2>]@2 <[3, 5][3 <[7, 5][6,5]>@2]>@3 3@2 [3, <6 7 6>]/2")
  .scale("<G F <D D D A>>:<minor minor <minor minor major>>:pentatonic")
  .velocity("[.66 [.99 | .91 | .84]]*2")
  .s("piano")

let p2 = n("[[5, <<1 0> 2 3>, 0], <10 10 <12 9 10>>]@2 <[3, 5, 2][3 <[7 5][6 5]>@2]>@3 3@2 [3, <6 7 6>]")
  .add.squeeze(n("<0 [0 1 2]>"))
  .scale("<G F <D>>:<minor minor <minor minor major>>:pentatonic")
  .velocity("[.66 [.99 | .91 | .84]]*2")
  .s("piano")
  .when("<0 0 0 0 0 1>", x=>x.ply(2)).ply(2)

let p3 = n("[[5, <<1 0> 2 3>, 0], <10 10 <12 9 10>>]@2 <[3, 5, 2][3 <[7, 5][6, 5]>@2]>@3 3@2 [3, <6 7 6>]")
  .add.squeeze(n("<0 [0 1] 0 [0 1 0]>"))
  .scale("<G F <D>>:<minor minor <minor minor major>>:pentatonic")
  .velocity("[.66 [.99 | .91 | .84]]*2")
  .s("piano")
  .when("<0 0 0 0 0 1>", x=>x.ply(2))//.ply(2)

// pianos
x1: "< p1@12 p2@12 p3@8>".pick({p1, p2, p3})
  //.ply(2)
  .shape("<.777@12 .8@12 .822@12>").gain(.111)
  .when("<0!10 1!2>", x=>x.ply(2))

  //.hush()


// using phasing by using different speeds

let d1 = s("<eeloil [sport sport]>/2")
  .fit()
//  .splice(8, "[0 1 2 3 4 5 6 7]")
.mul(speed("1, <1.005 1.003 1.001>/2.718"))
  .shape(.35).gain(.2).scope()
.mask("<0!9 0 0 0 0 0 0 1 1 1>".invert())
//  .jux(rev)

let d2 = s("<[sport sport]>/2")
  .fit()
  .splice(8, "[0 1 2 3 4 5 6 7]")
.mul(speed("1, <1.005 1.004 1.003 1.002 1.001>/1.5"))
  .shape(.35).gain(.2).scope()
.mask("<0!9 0 0 0 0 0 0 1 1 1>".invert())
//  .jux(rev)

let d3 = s("<[sport sport]>/2")
  .fit()
  .splice(8, "[1 1 <2!2 [[2, 2] [2]] 2!3> 3 4 5 6 <7!5 [1 2]>]")
  .when("<0!12 1 0!5>", x=>x.ply("[2 1]").shape("<.35 .1>*8*2"))
.mul(speed("1, < 1.001>/1.5"))
  .shape(.35).gain(.2)

  .stack(s("hh*<4!7 8!2>").bank("RolandTR707").velocity("<.4 .1>*<4!7 8!2>"))

         .scope()
.mask("<0!9 0 0 0 0 0 0 1 1 1>".invert())


x2: "< d1@12 d1@12 d2@8 d1@12 d1@12 d3@8>".pick({d1, d2, d3}).mask("<0 1!999>")

//kicks
x3: note("<G1 D1 <D1 D1 D1 A1>>")
  .struct("x@2 - - [- <- x>] - -")
  .s("sine")
  .decay(1.977)
  .pdec(.41).penv(32)
  .pcurve(1).lpf(277).velocity(5).dist(1)
//.off("[.625, < ~ ~ .5>] ", x => x.velocity(3))
  .mask("<1 0>")

x4: chord("[<Gm Fm <Dm Dm D>>!2 -!2]").voicing()
  .add(note("[0, 12]"))
  .dec(.2).delay(".777:.1:.888")
  .orbit(9).s("[triangle, sine]")
  .lpf(200).fm(8)
  .lpd(.1).lpenv("<<2.5 -3>!2 -3>").lpq(sine.range(4.5, 7.5).slow(7.77))
.shape(.15).gain(.111)
.mask("<0 0 0 0 0 0 1 1 1>")

// dub stabs with high delay feedback
x5: chord("[<Gm Fm <Dm Dm D>>!1 -!2]").voicing()
  .late(.75)
  .add(note("[0, 12]"))
  .dec(.4)
   .delay(.777)
  .delaytime(.1)
  .delayfeedback(.555)
  .sometimesBy(.3, x=>x.delayfeedback(.777))
  .sometimesBy(.1, x=>x.delayfeedback(.888))


  //.delay(".777:.1:<.555 .555 .555 .777>")

  .orbit(9).room(1)
  .s("[triangle, sine]")
  .lpf(222).fm(12)
  .lpd(.1).lpenv("<<2.5 2.75 3>!2 3>").lpq(sine.range(4.5, 7.5).slow(7.77))
.shape(.35).gain(.111)
.mask("<0!12 0!12 1!8>")

//all(x=>x.coarse(8).lpf(777))


// @version 1.1