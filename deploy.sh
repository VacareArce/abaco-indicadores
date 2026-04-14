#!/bin/bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
BRANCH="${1:-master}"
COMPOSER_BIN="${COMPOSER_BIN:-composer}"

echo "[DEPLOY] App directory: $APP_DIR"
cd "$APP_DIR"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "[DEPLOY] Working tree has local changes. Aborting deploy to avoid conflicts."
  exit 1
fi

echo "[DEPLOY] Fetching latest refs..."
git fetch origin

echo "[DEPLOY] Switching to branch: $BRANCH"
git checkout "$BRANCH"

echo "[DEPLOY] Pulling latest changes..."
git pull --ff-only origin "$BRANCH"

if ! command -v "$COMPOSER_BIN" >/dev/null 2>&1 && [ -x "/opt/cpanel/composer/bin/composer" ]; then
  COMPOSER_BIN="/opt/cpanel/composer/bin/composer"
fi

if command -v "$COMPOSER_BIN" >/dev/null 2>&1 || [ -x "$COMPOSER_BIN" ]; then
  echo "[DEPLOY] Installing PHP dependencies..."
  "$COMPOSER_BIN" install --no-dev --optimize-autoloader --no-interaction
else
  echo "[DEPLOY] Composer not found. Set COMPOSER_BIN or install composer in server PATH."
  exit 1
fi

echo "[DEPLOY] Completed successfully."
