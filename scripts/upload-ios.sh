#!/bin/bash
# Run on the owner's Mac, where Xcode is already signed into their Apple Account.
set -euo pipefail

if [ "$(uname -s)" != Darwin ]; then
  echo "このスクリプトはXcodeとApple Accountを設定したMacで実行してください。" >&2
  exit 1
fi
script_dir="$(cd "$(dirname "$0")" && pwd)"
cd "$script_dir/.."
if ! command -v node >/dev/null 2>&1 || ! node -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 22 ? 0 : 1)'; then
  echo "Node.js 22以降を有効にしてから、もう一度実行してください。" >&2
  exit 1
fi
if [ -d /Applications/Xcode.app/Contents/Developer ] && [ -z "${DEVELOPER_DIR:-}" ]; then
  export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
fi
xcodebuild -version
output_dir="$(mktemp -d "${TMPDIR:-/tmp}/runloo-upload.XXXXXX")"
echo "ビルド・アップロードの記録先: $output_dir"

npm ci --include=dev
npm run ios:sync
npm test

# Read the development team the owner already selected in Xcode; never invent an ID.
xcodebuild -quiet -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -showBuildSettings -json > "$output_dir/settings.json"
python3 - "$output_dir/settings.json" "$output_dir/ExportOptions.plist" <<'PY'
import json, plistlib, sys
with open(sys.argv[1]) as f:
    settings=json.load(f)
teams={item.get('buildSettings',{}).get('DEVELOPMENT_TEAM','').strip()
       for item in settings if item.get('target')=='App'}
if len(teams)!=1 or not next(iter(teams)):
    raise SystemExit('XcodeのApp → Signing & Capabilities → AllでTeamを選択してから実行してください。')
options={'method':'app-store-connect','destination':'upload','signingStyle':'automatic',
         'teamID':next(iter(teams)),'manageAppVersionAndBuildNumber':True,'uploadSymbols':True}
with open(sys.argv[2],'wb') as f:
    plistlib.dump(options,f)
PY

xcodebuild archive \
  -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$output_dir/RUNLOO.xcarchive" \
  -allowProvisioningUpdates \
  | tee "$output_dir/archive.log"

# Xcode uses the account and signing keys in the owner's keychain.
# This uploads to App Store Connect; it does not submit for review or release the app.
xcodebuild -exportArchive \
  -archivePath "$output_dir/RUNLOO.xcarchive" \
  -exportPath "$output_dir/export" \
  -exportOptionsPlist "$output_dir/ExportOptions.plist" \
  -allowProvisioningUpdates \
  | tee "$output_dir/upload.log"

echo "App Store Connectへのアップロード処理が完了しました。"
echo "TestFlightでApple側の処理完了を確認してください。審査提出・一般公開はまだ行っていません。"
