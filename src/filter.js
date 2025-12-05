import {Pattern} from "@strudel.cycles/core"

// Generic code filter to remove or neutralize unwanted calls
App.filter_code = (code) => {
  // Remove setcps() calls with any arguments
  code = code.replace(/setcps\s*\([^)]*\)/gi, ``)

  // Remove setbpm() calls with any arguments
  code = code.replace(/setbpm\s*\([^)]*\)/gi, ``)

  // Remove setcpm() calls with any arguments
  code = code.replace(/setcpm\s*\([^)]*\)/gi, ``)

  // Remove .cpm() calls with any arguments
  code = code.replace(/\._?cpm\s*\([^)]*\)/gi, ``)

  // Replace multiple empty lines with single empty line
  code = code.replace(/\n\s*\n\s*\n+/g, `\n\n`)

  return code.trim()
}

// Disable Hydra
globalThis.initHydra = async () => console.log("Hydra disabled")

// Disable Scopes & Analyzers (Monkey-patching the Pattern prototype)
// This ensures .scope(), .pianoroll(), etc. return 'this' (the pattern) without doing anything.
const noop = function() { return this; };

Pattern.prototype.scope = noop;
Pattern.prototype._scope = noop;

Pattern.prototype.pianoroll = noop;
Pattern.prototype._pianoroll = noop;

Pattern.prototype.spectrogram = noop;
Pattern.prototype._spectrogram = noop;

Pattern.prototype.spiral = noop;
Pattern.prototype._spiral = noop;

Pattern.prototype._punchcard = noop;
Pattern.prototype.__punchcard = noop;