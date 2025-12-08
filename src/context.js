App.strudel_sounds = [
  `bd`, `sd`, `hh`, `cp`, `mt`, `ht`, `lt`, `sn`, `rs`, `cb`, `oh`, `ch`, `hc`, `lc`, `mc`,
  `arpy`, `bass`, `bin`, `bleep`, `blip`, `click`, `coin`, `crow`,
  `dorkbot`, `drum`, `e`, `f`, `g`, `glitch`,
  `hardcore`, `hoover`, `industrial`,
  `jazz`, `jungbass`, `jungle`,
  `kurt`, `led`, `less`, `lighter`,
  `metal`, `mini`, `moog`, `mouth`,
  `newnotes`, `noise`, `numbers`,
  `pad`, `perc`, `peri`, `piano`, `pluck`,
  `rave`, `rm`, `sax`,
  `sid`, `sine`, `sitar`, `speech`,
  `stab`, `sundance`,
  `tabla`, `tech`, `techno`, `tink`, `tok`, `toy`,
  `v`, `voodoo`,
  `wind`, `wobble`, `world`,
  `x`, `y`, `z`,
]

App.strudel_banks = [
  `808`, `909`, `808bd`, `808cy`, `808hc`, `808ht`, `808lc`, `808mc`, `808mt`, `808oh`, `808sd`,
  `ab`, `ade`, `ades2`, `ades3`, `ades4`, `alex`, `alphabet`, `amencutup`, `armora`,
  `auto`, `ba`, `bass0`, `bass1`, `bass2`, `bass3`,
  `bev`, `birds`, `birds3`, `bottle`,
  `breaks125`, `breaks152`, `breaks157`, `breaks165`,
  `bubble`, `can`, `casio`, `chin`, `circus`,
  `clak`, `clubkick`, `co`, `control`, `cosmicg`,
  `cr`, `dist`, `dork2`, `dr`, `dr2`, `dr55`, `drumtraks`,
  `east`, `electro1`, `em2`, `erk`,
  `feel`, `feelfx`, `fest`, `fire`, `flick`, `fm`, `foo`, `future`,
  `gab`, `gabba`, `gabbaloud`, `gabbalouder`,
  `glass`, `glitch2`, `gretsch`,
  `h`, `hand`, `haw`, `hh27`, `hit`, `hmm`, `ho`, `house`,
  `if`, `incoming`, `ind`, `insect`, `invaders`,
  `juno`, `jvbass`, `koy`, `latibro`,
  `les`, `linnhats`, `made`, `mash`, `mash2`, `miniping`,
  `mp3`, `msg`, `oc`, `odx`, `off`,
  `padlong`, `pebbles`, `phone`,
  `popkick`, `print`, `proc`, `procshort`, `psr`,
  `rave2`, `ravemono`, `realclaps`, `reverbkick`,
  `seawolf`, `sequential`, `sf`, `sheffield`, `short`,
  `space`, `speakspell`, `speechless`, `speedupdown`,
  `stomp`, `subroc3d`, `tabla2`, `tablex`, `tacscan`, `tek`,
  `toys`, `trump`, `ul`, `ulgab`, `uxay`,
  `yeah`,
]

App.show_sound_context = (event) => {
  let items = []

  for (let sound of App.strudel_sounds) {
    items.push({
      text: sound,
      action: () => {
        console.log(sound)
      },
    })
  }

  console.log(items)
  NeedContext.show({items})
}

App.show_bank_context = () => {

}