App.editor_theme = {
  "& .cm-activeLine": {
    backgroundColor: `transparent !important`,
  },
  "& .cm-activeLineGutter": {
    backgroundColor: `transparent !important`,
  },
  "& .cm-gutters": {
    backgroundColor: `#2E3440`,
    color: `#D8DEE9`,
    borderRight: `1px solid #4C566A`,
  },
  "& .cm-lineNumbers .cm-gutterElement": {
    paddingLeft: `8px`,
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
    backgroundColor: "#2e3440",
    color: "#d8dee9",
    borderTop: "1px solid #4c566a"
  },
  ".cm-panels.cm-panels-top": {
    borderBottom: "2px solid black"
  },
  ".cm-panels.cm-panels-bottom": {
    borderTop: "2px solid black"
  },
  ".cm-textfield": {
    backgroundColor: "#3b4252",
    color: "#eceff4",
    border: "1px solid #4c566a",
    borderRadius: "4px"
  },
  ".cm-button": {
    backgroundImage: "none",
    backgroundColor: "#4c566a",
    color: "#eceff4",
    border: "1px solid #434c5e",
    borderRadius: "4px",
    cursor: "pointer"
  },
  ".cm-button:hover": {
    backgroundColor: "#5e81ac"
  },
  ".cm-searchMatch": {
    backgroundColor: "#725920", // dimmed highlight
    outline: "1px solid #fab387"
  },
  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: "#fab387", // active highlight
    color: "#2e3440"
  },
}