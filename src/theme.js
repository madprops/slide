App.editor_theme = {
  "& .cm-activeLine": {
    backgroundColor: `transparent !important`,
  },
  "& .cm-activeLineGutter": {
    backgroundColor: `transparent !important`,
  },
  "& .cm-gutters": {
    backgroundColor: `#202020 !important`,
    borderRight: `1px solid #4C566A`,
    paddingRight: `0.66rem`,
  },
  "& .cm-lineNumbers .cm-gutterElement": {
    paddingLeft: `8px`,
    color: `#aaa`,
  },
  // TARGET: Matching brackets (parenthesis)
  "& .cm-matchingBracket": {
    // Use a low opacity white or a specific Nord color
    backgroundColor: `rgba(136, 192, 208, 0.2) !important`, // Nord "Frost" cyan with low opacity
    color: `#ECEFF4 !important`, // Bright white text to make the bracket itself stand out
  },
  // Optional: Style non-matching (error) brackets
  "& .cm-nonmatchingBracket": {
    backgroundColor: `rgba(191, 97, 106, 0.3) !important`, // Nord "Aurora" red
  },
  // TARGET: All other occurrences of the selected word
  "& .cm-selectionMatch": {
    // A subtle background color (Nord 'Frost' with low opacity)
    backgroundColor: `rgba(136, 192, 208, 0.25) !important`,
    // Optional: Add a border to make it crisp without being bright
    outline: `1px solid rgba(136, 192, 208, 0.4)`,
  },
  // Optional: Just in case you want to change the Main Selection color too
  "& .cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
    backgroundColor: `rgba(67, 76, 94, 0.8) !important`, // Nord 'Polar Night' selection
  },
  ".cm-panels": {
    backgroundColor: `#2E3440`, // Nord Polar Night
    color: `#D8DEE9`,
    borderTop: `1px solid #4C566A`,
    borderBottom: `1px solid #4C566A`,
  },
  ".cm-panels-top": {
    borderBottom: `2px solid #3B4252`,
  },
  ".cm-panels-bottom": {
    borderTop: `2px solid #3B4252`,
  },
  ".cm-search": {
    display: `block`,
    alignItems: `center`,
    gap: `8px`,
    padding: `8px 12px`,
    fontFamily: `inherit`,
  },
  ".cm-search .cm-textfield": {
    backgroundColor: `#3B4252`,
    color: `#ECEFF4`,
    border: `1px solid #4C566A`,
    borderRadius: `4px`,
    padding: `4px 8px`,
    outline: `none`,
    minWidth: `200px`,
  },
  ".cm-search .cm-textfield:focus": {
    border: `1px solid #88C0D0`, // Nord Frost Blue
  },
  ".cm-button": {
    backgroundImage: `none`,
    backgroundColor: `#434C5E`,
    color: `#ECEFF4`,
    border: `none`,
    borderRadius: `4px`,
    padding: `4px 10px`,
    cursor: `pointer`,
    textTransform: `capitalize`,
    fontSize: `0.9em`,
  },
  ".cm-button:hover": {
    backgroundColor: `#5E81AC`, // Nord Blue
  },
  ".cm-button:active": {
    transform: `translateY(1px)`,
  },
  ".cm-search label": {
    display: `inline-flex`,
    alignItems: `center`,
    gap: `4px`,
    fontSize: `0.85em`,
    cursor: `pointer`,
  },
  ".cm-search input[type='checkbox']": {
    cursor: `pointer`,
    accentColor: `#88C0D0`,
  },
  ".cm-panel.cm-search [name='close']": {
    marginLeft: `auto`, // Push close button to the far right
    padding: `2px 6px`,
    fontSize: `1.2em`,
    background: `transparent`,
  },
  ".cm-panel.cm-search [name='close']:hover": {
    color: `#C3C3C3`,
  },
  // Highlight colors
  ".cm-searchMatch": {
    backgroundColor: `rgba(235, 203, 139, 0.4)`, // Nord Yellow (dim)
    outline: `1px solid #EBCB8B`,
  },
  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: `#EBCB8B`, // Nord Yellow (bright)
    color: `#2E3440`,
  },
}