App.visual_mode = `auto`

App.create_visual_modal = () => {
  let modal = App.create_list_modal(`visual`)
  let title = DOM.el(`.modal-title`, modal)
  title.textContent = `Select Visual`
}

App.open_visual_modal = async () => {
  let items = [
    `Auto`,
    `None`,
    `Hydra`,
    `Scope`,
    `Piano`,
  ]

  App.show_items_modal(`visual`, {
    items,
    action: (item) => {
      let mode = item.toLowerCase()
      App.apply_visual(mode)
      App.close_modal(`visual`)
    },
  })
}

App.get_visual_snippet = (mode) => {
  if (mode === `hydra`) {
    return `initHydra(); osc(10, 0.1, 0.8).rotate(0, 0.1).out();`
  }
  else if (mode === `scope`) {
    return `
    stack(
      n("[0 .. 11]")

      // .chord("<Fm Fm7 Fm9 Fm11>".slow(2))
      .chord("<<[Fm7|Fm9|Fm11] <Ab7 Ab9>> Cm7 Ebm9 <F7 Dm7 B>>".slow(2))

      .voicing()
      .add(note("-12, -24.2, <.1 [.1, 12.1]>".slow(8)))
      .s("square, triangle, sawtooth".fast(8))
      .lpf(saw.rangex(50,cosine.range(10,10).slow(6)).slow(8))
      .lpe(rand.range(3,6).slow(8))
      .lpq(saw.range(1,1).slow(8))
      .room(rand.range(0.1,1.5).slow(1))
      .gain(".2")
      .dist("3:.17")
      .hpf(rand.rangex(10,200).slow(8))
      .pan(rand)
      .delay(".1:0.5")
    ,
      // --------------------------------------//
      s(\` bd <~ bd> [~|hh] ~
          hh ~ [hh|bd] [~|bd]
          [sd|cp] ~ [~|hh|bd] [hh|oh]
        \`)
      .bank("RolandTR909")
      .end(rand.rangex(
        .01, tri.range(.1, .9).slow(4)
      ))
      .distort("2:.8")
      .lpf(saw.rangex(
        cosine.range(4000,2000).slow(2), 5000).slow(8))

      .delay("<0.01@3 0.5>")
      .dt("[0.01|0.02|0.03]*4")
      .dfb("0.4")
      .room(saw.rangex(.001,.4).slow(4))
    ).cpm(10).scope().analyze().gain(0)
    `
  }
  else if (mode === `pianoroll`) {
    return `.layer(() => n("c3 ~ e3 g3").struct("x*8").pianoroll().gain(0))`
  }

  return ``
}

App.apply_visual = (mode) => {
  App.clean_canvas()

  if ([`auto`, `mode`].includes(mode)) {
    return App
  }

  App.visual_code = App.get_visual_snippet(mode).trim()
  App.show_visual()
}

App.show_visual = () => {
  visual_scheduler.setPattern(App.visual_code)
}