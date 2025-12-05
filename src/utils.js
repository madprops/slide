App.escape_regex = (s) => {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
}

App.underspace = (s) => {
  return s.replace(/_+/g, ` `).trim()
}