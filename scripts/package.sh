#!/usr/bin/env bash
# Package the extension into extension.zip for Chrome Web Store upload.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${ROOT}/extension.zip"
STAGE="${ROOT}/.package-stage"

rm -rf "${STAGE}" "${OUT}"
mkdir -p "${STAGE}"

# Copy only the files Chrome needs to load the extension.
cp "${ROOT}/manifest.json" "${STAGE}/"
cp "${ROOT}/background.js" "${STAGE}/"
cp "${ROOT}/popup.html" "${ROOT}/popup.js" "${ROOT}/popup.css" "${STAGE}/"
cp "${ROOT}/options.html" "${ROOT}/options.js" "${ROOT}/options.css" "${STAGE}/"
cp -R "${ROOT}/icons" "${STAGE}/icons"

(
  cd "${STAGE}"
  zip -r -q "${OUT}" .
)

rm -rf "${STAGE}"

VERSION="$(python -c "import json; print(json.load(open('${ROOT}/manifest.json'))['version'])")"
echo "Created ${OUT} (manifest version ${VERSION})"
