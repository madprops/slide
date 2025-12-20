#!/usr/bin/env bash

# Base URLs
DS_URL="https://raw.githubusercontent.com/felixroos/dough-samples/main"
TS_URL="https://raw.githubusercontent.com/todepond/samples/main"
TC_URL="https://raw.githubusercontent.com/tidalcycles/uzu-drumkit/main"

target_dir="samples"

# Ensure directory exists using multiline if
if [ ! -d "$target_dir" ]
then
  mkdir -p "$target_dir"
fi

urls=(
  "$DS_URL/tidal-drum-machines.json"
  "$DS_URL/piano.json"
  "$DS_URL/Dirt-Samples.json"
  "$DS_URL/vcsl.json"
  "$DS_URL/mridangam.json"
  "$TC_URL/strudel.json"
  "$TS_URL/tidal-drum-machines-alias.json"
)

for url in "${urls[@]}"
do
  file_name=$(basename "$url")

  echo "Downloading $file_name to $target_dir..."

  # -L follows redirects, -o specifies the output path
  curl -L "$url" -o "$target_dir/$file_name"
done

echo "Done"