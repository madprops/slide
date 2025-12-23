#!/usr/bin/env ruby
require "git"
require "json"

# specific path to the config file
config_path = "server/config/config.json"

# Check if file exists
unless File.exist?(config_path)
  abort "Error: Could not find config file at #{config_path}"
end

# Parse JSON
file_content = File.read(config_path)
config = JSON.parse(file_content)

# Extract version
version = config["version"]

unless version
  abort "Error: No 'version' key found in #{config_path}"
end

tag_name = "v#{version}"
repo = Git.open(".")

# Check against existing tags to avoid git errors
existing_tags = repo.tags.map(&:name)

if existing_tags.include?(tag_name)
  abort "Error: Tag #{tag_name} already exists. Please bump the version in #{config_path} first."
end

# Create and push
repo.add_tag(tag_name)
repo.push("origin", tag_name)

puts "Created and pushed tag: #{tag_name}"