#!/usr/bin/env bash

set -euo pipefail

mode="${1:?mode is required}"
branch="${2:?branch is required}"
summary_file="${3:?summary file is required}"
comment_file="${4:?comment file is required}"
base_url="${BASE_URL:-https://ietf-wg-jose.github.io/json-web-proof}"
marker="<!-- pr-preview-links -->"
preview_url="${base_url}/${branch}"

case "${mode}" in
  pending)
    status_heading="## PR Preview Links"
    status_text="Preview publication is pending."
    availability_text="These are the expected preview URLs for branch \`${branch}\`. They might not be live until the branch publish workflow completes."
    ;;
  published)
    status_heading="## PR Preview Links"
    status_text="Preview publication is confirmed."
    availability_text="These preview URLs are confirmed from the published \`gh-pages\` branch for \`${branch}\`."
    ;;
  *)
    echo "Unsupported mode: ${mode}" >&2
    exit 1
    ;;
esac

{
  echo "${status_heading}"
  echo
  echo "${status_text}"
  echo
  echo "${availability_text}"
  echo
  echo "| Draft | HTML | Text | Diff |"
  echo "| --- | --- | --- | --- |"
} >"${summary_file}"

{
  echo "${marker}"
  echo "${status_heading}"
  echo
  echo "${status_text}"
  echo
  echo "${availability_text}"
  echo
  echo "| Draft | HTML | Text | Diff |"
  echo "| --- | --- | --- | --- |"
} >"${comment_file}"

for txt in draft-*.txt; do
  [ -f "${txt}" ] || continue
  base="${txt%.txt}"
  short="${base#draft-ietf-jose-}"
  html_url="${preview_url}/${base}.html"
  text_url="${preview_url}/${base}.txt"
  diff_url="https://author-tools.ietf.org/api/iddiff?url_1=${base_url}/${base}.txt&url_2=${preview_url}/${base}.txt"
  row="| ${short} | [html](${html_url}) | [text](${text_url}) | [diff with main](${diff_url}) |"
  echo "${row}" >>"${summary_file}"
  echo "${row}" >>"${comment_file}"
done
