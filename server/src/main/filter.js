// Generic code filter to remove or neutralize unwanted calls
App.filter_code = (code) => {
  // Replace multiple empty lines with single empty line
  code = code.replace(/\n\s*\n\s*\n+/g, `\n\n`)

  return code.trim()
}