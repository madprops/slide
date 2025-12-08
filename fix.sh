#!/usr/bin/env bash
files=$(git ls-files -- "*.js")
files=$(echo $files | tr " " "\n" | grep -vE '(^|/)strudel/' | grep -vE '(^|/)songs/' | grep -vE '(^|/)dist/' | grep -vE '(^|/)vite.config.js$' | grep -vE '(^|/)src/jdenticon.js' | tr "\n" " ")

if [ -n "$files" ]; then
  npm run --silent fix $files
fi