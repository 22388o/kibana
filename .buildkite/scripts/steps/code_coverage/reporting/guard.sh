#!/usr/bin/env bash

empties=()
emptiesFailureThreshold=2

emptyCheck() {
  echo "### Checking $1 for ''empty'' (contains Unknown)"
  head -5 "$1" | grep -E -i "pct.+Unknown" >/dev/null
  local lastCode=$?
  if [ $lastCode -eq 0 ]; then
    echo "--- Empty Summary File: $1"
    empties+=("$1")
  fi
}

guardIngestion () {
 for x in functional jest; do
   local COVERAGE_SUMMARY_FILE="target/kibana-coverage/${x}-combined/coverage-summary.json"

   if [[ -e "$COVERAGE_SUMMARY_FILE" ]]; then
      emptyCheck "$COVERAGE_SUMMARY_FILE"
   else
     printf "### %s does not exist, FAIL the build\n" "$COVERAGE_SUMMARY_FILE"
     echo "### Perhaps the path is incorrect?"
     echo "### KIBANA_DIR: $KIBANA_DIR"
     exit 11
   fi
 done

 if [[ ${#empties[@]} -ge $emptiesFailureThreshold ]]; then
   echo "--- Empty count = ${#empties[@]}, FAIL the build"
   exit 11
 else
   echo "### Empty count = ${#empties[@]}, DO NOT fail the build"
 fi
}
