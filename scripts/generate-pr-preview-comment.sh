#!/usr/bin/env bash

set -euo pipefail

mode="${1:?mode is required}"
branch="${2:?branch is required}"
summary_file="${3:?summary file is required}"
comment_file="${4:?comment file is required}"
base_url="${BASE_URL:-https://ietf-wg-jose.github.io/json-web-proof}"
marker="<!-- pr-preview-links -->"
preview_url="${base_url}/${branch}"
tmpdir="$(mktemp -d)"

cleanup() {
  rm -rf "${tmpdir}"
}

trap cleanup EXIT

DATERE='[0-9]* [A-Z][a-z]* 20[0-9][0-9]'

normalize_text() {
  sed \
    -e "/^   This Internet-Draft will expire on ${DATERE}./d" \
    -e "s/^Expires: ${DATERE}/Expires: DATEHERE/" \
    -e 's/\(.\{56\}\).\{11\} 20[0-9][0-9]$/\1/' \
    "$1"
}

has_changes_vs_main() {
  local draft_txt="$1"
  local base_name="${draft_txt%.txt}"
  local main_txt="${tmpdir}/${base_name}.main.txt"
  local main_url="${base_url}/${base_name}.txt"

  if ! curl -fsSL "${main_url}" -o "${main_txt}"; then
    # If we cannot fetch the main published text, keep the row so reviewers
    # still get the preview links.
    return 0
  fi

  if diff -q <(normalize_text "${main_txt}") <(normalize_text "${draft_txt}") >/dev/null; then
    return 1
  fi

  return 0
}

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

rows_written=0
for txt in draft-*.txt; do
  [ -f "${txt}" ] || continue
  has_changes_vs_main "${txt}" || continue
  base="${txt%.txt}"
  short="${base#draft-ietf-jose-}"
  html_url="${preview_url}/${base}.html"
  text_url="${preview_url}/${base}.txt"
  diff_url="https://author-tools.ietf.org/api/iddiff?url_1=${base_url}/${base}.txt&url_2=${preview_url}/${base}.txt"
  row="| ${short} | [html](${html_url}) | [text](${text_url}) | [diff with main](${diff_url}) |"
  echo "${row}" >>"${summary_file}"
  echo "${row}" >>"${comment_file}"
  rows_written=1
done

if [ "${rows_written}" -eq 0 ]; then
  echo "| No changed drafts | All rendered draft text matches main after normalizing date lines. | | |" >>"${summary_file}"
  echo "| No changed drafts | All rendered draft text matches main after normalizing date lines. | | |" >>"${comment_file}"
fi
