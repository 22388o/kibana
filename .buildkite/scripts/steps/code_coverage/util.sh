#!/usr/bin/env bash

set -euo pipefail

# $1 file name, ex: "target/dir-listing-jest.txt"
# $2 directory to be listed (ls -la DIR), ex: target/kibana-coverage/jest
dirListing() {
  local fileName=$1
  local dir=$2

  ls -l "$dir" >"$fileName"

  printf "\n### %s \n\tlisted to: %s\n" "$dir" "$fileName"
  buildkite-agent artifact upload "$fileName"
  printf "\n### %s Uploaded\n" "$fileName"
}
