#!/usr/bin/env bash

set -euo pipefail

node .buildkite/scripts/lifecycle/print_agent_links.js || true

IS_TEST_EXECUTION_STEP="$(buildkite-agent meta-data get "${BUILDKITE_JOB_ID}_is_test_execution_step" --default '')"

if [[ "$IS_TEST_EXECUTION_STEP" == "true" ]]; then
  echo "--- Upload Artifacts"
  buildkite-agent artifact upload 'target/junit/**/*'
  buildkite-agent artifact upload 'target/kibana-*'
  buildkite-agent artifact upload 'target/kibana-security-solution/**/*.png'
  buildkite-agent artifact upload 'target/test-metrics/*'
  buildkite-agent artifact upload 'target/test-suites-ci-plan.json'
  buildkite-agent artifact upload 'test/**/screenshots/diff/*.png'
  buildkite-agent artifact upload 'test/**/screenshots/failure/*.png'
  buildkite-agent artifact upload 'test/**/screenshots/session/*.png'
  buildkite-agent artifact upload 'test/functional/failure_debug/html/*.html'
  buildkite-agent artifact upload 'x-pack/test/**/screenshots/diff/*.png'
  buildkite-agent artifact upload 'x-pack/test/**/screenshots/failure/*.png'
  buildkite-agent artifact upload 'x-pack/test/**/screenshots/session/*.png'
  buildkite-agent artifact upload 'x-pack/test/functional/apps/reporting/reports/session/*.pdf'
  buildkite-agent artifact upload 'x-pack/test/functional/failure_debug/html/*.html'
  buildkite-agent artifact upload '.es/**/*.hprof'

  if [[ "$CODE_COVERAGE" == "1" ]]; then
    buildkite-agent artifact upload 'kibana-jest-coverage.tar.gz'
    buildkite-agent artifact upload 'kibana-jest-thread-coverage.tar.gz'
    buildkite-agent artifact upload 'kibana-functional-coverage.tar.gz'
    buildkite-agent artifact upload 'kibana-functional-ciGroup-coverage.tar.gz'
    buildkite-agent artifact upload 'target/kibana-coverage/functional/*'
    buildkite-agent artifact upload 'target/kibana-coverage/jest/*'
  else
    buildkite-agent artifact upload 'target/kibana-coverage/jest/**/*'
  fi

  if [[ -d 'target/junit' ]]; then
    echo "--- Run Failed Test Reporter"
    node scripts/report_failed_tests --build-url="${BUILDKITE_BUILD_URL}#${BUILDKITE_JOB_ID}" 'target/junit/**/*.xml'
  fi

  if [[ -d 'target/test_failures' ]]; then
    buildkite-agent artifact upload 'target/test_failures/**/*'
    node .buildkite/scripts/lifecycle/annotate_test_failures.js
  fi
fi
