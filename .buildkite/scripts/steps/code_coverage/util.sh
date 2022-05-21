#!/usr/bin/env bash

set -euo pipefail

# $1 file name, ex: "target/dir-listing-jest.txt"
# $2 directory to be listed, ex: target/kibana-coverage/jest
dirListing() {
  local fileName=$1
  local dir=$2

  ls -l "$dir" >"$fileName"

  printf "\n### %s \n\tlisted to: %s\n" "$dir" "$fileName"
  buildkite-agent artifact upload "$fileName"
  printf "\n### %s Uploaded\n" "$fileName"
}

replacePaths() {
  for x in $(ls "$1"); do
    echo "### KIBANA_DIR: $KIBANA_DIR"
    node .buildkite/scripts/steps/code_coverage/clean_coverage_paths.js "$1/$x"
  done
}
