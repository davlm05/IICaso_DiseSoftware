#!/usr/bin/env bash
# Frontend startup: install deps against the mounted source, then start the Expo
# Metro dev server. Connect a device/emulator via Expo Go to the host's :8081.
#
# Note: the browser ("web") target additionally requires react-dom +
# react-native-web; add them to frontend/package.json to enable `--web`.
set -euo pipefail

cd /app

echo "[frontend] installing dependencies (npm install)..."
npm install

echo "[frontend] starting Expo Metro bundler on 0.0.0.0:8081 ..."
exec npx expo start --port 8081
