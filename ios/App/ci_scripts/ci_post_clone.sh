#!/bin/bash
# Xcode Cloud runs this hook before resolving Swift Package dependencies.
set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
repository_dir="${CI_PRIMARY_REPOSITORY_PATH:-$(cd "$script_dir/../../.." && pwd)}"
cd "$repository_dir"

# Capacitor 8 requires Node.js 22+. Homebrew is supplied by Xcode Cloud.
if ! command -v node >/dev/null 2>&1 || ! node -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 22 ? 0 : 1)'; then
  if ! command -v brew >/dev/null 2>&1; then
    echo "Node.js 22+ is required, and Homebrew is unavailable." >&2
    exit 1
  fi
  export HOMEBREW_NO_AUTO_UPDATE=1
  brew install node@24
  export PATH="$(brew --prefix node@24)/bin:$PATH"
fi

node --version
npm --version
# Include the CLI and bundler even if the runner sets NODE_ENV=production.
npm ci --include=dev --cache "${TMPDIR:-/tmp}/runloo-npm-cache"
npm run ios:sync

# The packages must exist before Xcode resolves the local Swift packages.
for plugin in filesystem preferences share; do
  test -f "node_modules/@capacitor/$plugin/Package.swift"
done
test -f ios/App/App/public/index.html
test -f ios/App/App/public/app.js
test -f ios/App/App/capacitor.config.json
echo "RUNLOO: native dependencies and bundled web assets are ready."
