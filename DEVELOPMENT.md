# 皇居RUNLOO

皇居で出会ったランナーの手帳と、RUNの計測・記録比較。Web版に加え、CapacitorによるiPhone版のプロジェクトを含みます。

## Web版

Node.js 22以降（テスト用）とPython 3を使用。Web版の起動自体にはnpm依存の導入は不要です。

```sh
npm start
npm test
```

ポート3000で起動します。GitHub PagesはルートのHTML/JS/CSSを配信します。

## iPhone版

```sh
npm ci
npm run ios:sync
# Mac上でのみ実行
npm run ios:open
```

`ios:sync`はWebアセットをesbuildで`dist/`に生成し、Xcodeプロジェクトに同期します。`dist/`や`ios/App/App/public/`は生成物なので直接編集しません。署名・ビルドにはMacとXcodeが必要です。詳細は [配信手順](release/APP_STORE.md) と [ストア掲載文案](release/STORE_LISTING_JA.md) を参照。

## データ

- Web：従来と同じlocalStorageキー `kokyo-runru-v1`。既存記録を保持。
- iPhone：Preferences（UserDefaults）。旧WebViewに記録がある場合は初回読み込み時に移行。SafariのWeb版データとは独立。
- JSONバックアップは新旧形式を検証して復元。復元時は現在の記録を置き換える。復元前データは端末に1世代保持。
- 手帳は編集・検索・削除可能。連絡先は相手の了承を得た内容だけ記録する。
- タイマーは開始時刻を永続保存し、復帰時に経過時間を再計算。端末時計の変更に影響されるため、実機のロック・バックグラウンド動作確認はリリース前に必要。
- 新規タイムは60分未満、分:秒.百分の一秒表示。既存の長い記録は総分数で表示。
- アカウント、クラウド同期、他ユーザーとの投稿・メッセージ、GPSは未実装。

## 検証範囲

`npm test`でタイム処理、距離別比較、バックアップ検証・互換性、ネイティブ保存への移行、タイマーの再開計算を確認します。Linuxでは`npm run ios:sync`まで実行可能です。Xcodeによるコンパイル、実機、署名、TestFlight、審査を済ませたことは意味しません。
