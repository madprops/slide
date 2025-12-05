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