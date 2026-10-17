# 皇居RUNLOO — iPhone版の配信手順

この資料は、Apple Developer Programに登録済みで、MacとiPhoneをお持ちの所有者向けです。

## 今回用意したもの

- Capacitor 8のiOS/Xcodeプロジェクト（`ios/App/App.xcodeproj`）。配信対象はiPhone、iOS 16以降。
- 外部Webサイトを表示する方式ではなく、画面・コード・ポリシーページをアプリに同梱。主要機能はオフラインで利用可能。
- ランナー手帳の記録・編集・検索・削除、RUN計測と比較。
- iPhone版はPreferences（UserDefaults）で記録・計測状態を保存。Web版の保存先と独立。
- JSONバックアップの共有シートへの書き出しと、ファイル選択による復元。Web版の旧バックアップも読み込み可能。
- アイコン（1024px、不透明）、起動画面、日本語表示、Privacy Manifest、公開用プライバシー・サポートページ。

iOSプロジェクトの生成・Webアセットのビルド・JavaScriptのテストまではLinuxで実施できます。**Xcodeビルド、署名、iPhoneでの実機確認、Archive、TestFlight、App Store審査は未実施です。** ブラウザ上のネイティブ保存モック検証は、実際のiPhoneでの検証とは別です。

## 1. Macでプロジェクトを開く

最新の安定版Xcode（Capacitor 8用にXcode 26以降を準備し、提出時点のAppleのSDK要件も確認）とNode.js 22以降を用意します。Xcode初回起動の追加コンポーネント導入と利用規約への同意を完了してください。

Mac上にまだリポジトリがない場合：

```sh
git clone https://github.com/kabutochoo/-.git runloo
cd runloo
npm ci
npm test
npm run ios:sync
npm run ios:open
```

既存のチェックアウトがあればその場所を使い、手元の変更を保存してから最新の変更を取得してください。クラウドタスクも既存のチェックアウトを使い、明示的な依頼がない限りGit worktreeは作りません。

`ios:sync`は`dist/`とXcodeの`public/`を再生成します。これらを直接編集しないでください。Swift Package ManagerがCapacitorと各プラグインを解決するため、Macの初回ビルドにはネット接続が必要です。

## 2. ご自身の開発チームで署名する

1. Xcode → Settings → Accountsに、登録済みのApple Accountを追加。
2. 左側の青い「App」プロジェクト → TARGETS「App」→ Signing & Capabilities。
3. Automatically manage signingを有効化し、Teamでご自身の開発チームを選択。
4. Bundle Identifierの`jp.runloo.kokyo`は**仮の識別子**です。ご自身のチームで登録できる一意の識別子に確定してください。変更する場合は`capacitor.config.json`の`appId`と、XcodeターゲットのDebug/Release両方のBundle Identifierを同じ値にします。
5. Generalで表示名、Version `1.0.0`、Build `1`を確認。アップロードのたびにBuildを増やします。

Appleのパスワード、証明書の秘密鍵、API秘密鍵は、チャットやGitリポジトリへ貼り付けないでください。Xcodeでログイン・署名できます。

## 3. ビルドとiPhoneでの確認

まずSimulatorを選びRun。その後、iPhoneをMacにつなぎ、信頼設定・必要に応じてDeveloper Modeを有効化して実機を選びRunします。

Macでの署名なしSimulatorビルド確認例：

```sh
xcodebuild -project ios/App/App.xcodeproj -scheme App \
  -configuration Debug -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath DerivedData CODE_SIGNING_ALLOWED=NO build
```

提出前に実機で以下を確認し、結果を記録します。

- [ ] 初回起動時にランナー手帳が開く。ノッチ・ホームバー・キーボードで操作が隠れない。
- [ ] 手帳の保存・編集・検索・削除。日本語や絵文字、長いメモも扱える。
- [ ] 強制終了・再起動後も記録が残る。
- [ ] 機内モードで手帳・タイマー・比較・同梱ポリシーページが動く。
- [ ] コンマ秒の計測、停止、再開、保存、距離別の前回比較。
- [ ] 画面ロック・バックグラウンド・アプリ終了後にタイマーを再表示して経過時間が合う。
- [ ] 共有シートから「ファイルに保存」、保存したJSONの復元。
- [ ] 旧Web版からバックアップを書き出し、iPhone版に読み込める。
- [ ] 不正なバックアップの拒否、復元キャンセルで既存の記録が変わらない。
- [ ] Privacy Manifestがアーカイブに同梱され、XcodeのValidate Appを通る。
- [ ] 実機でプライバシー・サポートリンクが機能する。

タイマーは開始時刻との差で経過時間を再計算し、OSから常時バックグラウンド実行の許可を取得する方式ではありません。端末時計を手動変更すると影響を受けます。表示の百分の一秒は競技用計測精度の保証ではありません。再起動・ロック後の挙動は実機で必ず確認してください。

## Macからまとめてアップロードする

App Store Connectでアプリを作成し、Xcodeで開発チームの選択と実機動作確認まで済んでいる場合は、次のスクリプトでも署名付きArchiveの作成とアップロードを行えます。Xcodeにログイン済みのアカウント・キーチェーンを使い、パスワードやAPI秘密鍵をコードへ入力する必要はありません。

```sh
# 既存チェックアウトの最新コードを取得した後、Macで実行
bash scripts/upload-ios.sh
```

Release設定のTeamを読み取り、未設定なら送信せず停止します。依存導入・テスト・Archive・App Store Connectへのアップロードを順に行い、失敗時は次の工程へ進みません。ログとArchiveはMacの一時ディレクトリに保持し、場所を実行時に表示します。Xcodeのアカウント認証やキーチェーンの確認画面が出た場合はMac上で対応してください。成功してもApple側の処理完了はTestFlightで確認が必要です。審査提出や一般公開は行いません。

このスクリプトの実際の署名・アップロードは所有者のMacで実施する必要があります。クラウド環境にはAppleへの認証接続がないため、GitHubの署名なしArchive成功と、Appleへのアップロード成功は別です。

## 4. App Store ConnectとTestFlight

1. [App Store Connect](https://appstoreconnect.apple.com/)で契約・メンバーシップが有効であることを確認。
2. 「マイApp」→ 新規App。プラットフォームiOS、名前「皇居RUNLOO」、主言語日本語、上で確定したBundle ID、任意の一意のSKU（例 `kokyo-runloo-ios`）。
3. Xcodeで配信先「Any iOS Device」を選びProduct → Archive。
4. OrganizerでValidate App → Distribute App → App Store Connectへアップロード。
5. 処理が終わったらTestFlightの内部テスターとしてご自身を追加し、iPhoneのTestFlightアプリでインストールして同じ確認を行う。外部テスターへ配る場合はAppleのベータ審査が必要になることがあります。

## Xcode Cloudを使う場合

`ios/App/ci_scripts/ci_post_clone.sh`を追加しています。Xcode Cloudはチェックアウト後、Swift Package Managerによる依存解決より前にこのスクリプトを実行します。Node.js 22以降がなければHomebrewでNode.js 24を導入し、ロックファイルに従って`npm ci --include=dev`、`npm run ios:sync`を行います。`node_modules`と同梱WebアセットはGit管理しません。

Xcode Cloudで`node_modules/@capacitor/share`等が存在しないというエラーが出た場合は、このフックを含む最新の`main`コミットを対象に**新しいビルド**を開始してください。古いコミットのRebuildでは修正が含まれません。ビルド詳細のCommitが最新か確認し、ログに`RUNLOO: native dependencies and bundled web assets are ready.`が出ることを確認します。

実機へのインストールとクラウドでのArchiveは別の操作です。App Store Connect/TestFlightへ送るには、Xcode CloudワークフローにArchiveアクションと対象の配信設定が必要です。ローカルMacのProduct → Archive → Organizerからのアップロードでも進められます。

## GitHubのMacビルド確認

`.github/workflows/ios-build.yml`は`main`の変更または手動実行でMacランナーを使い、iPhone用の署名なしArchiveをビルドします。GitHubのActionsタブの「iPhone archive check」で結果を確認できます。成功時は署名なしArchive、失敗時も取得できたビルドログを7日間保存します。このArchiveは署名済みIPAではなく、TestFlight/App Storeへアップロードしたことを意味しません。Appleアカウントや証明書は使用しません。配信には上記のXcode Organizerまたは設定済みのXcode Cloudでの署名・配信が必要です。

## 5. ストア情報を入力して審査へ

説明文の案は `release/STORE_LISTING_JA.md` を参照。以下はアカウント所有者が最終確認して入力します。

- 販売者の氏名/法人名、著作権表記（権利者の正しい名称を使う）、審査連絡先。
- 配信地域、価格、公開方法。自動公開か手動公開かを選択。
- カテゴリ（候補：ヘルスケア／フィットネス）、年齢制限の質問票。単なる個人用メモであり、利用者同士の公開投稿・メッセージ機能はありません。
- iPhoneの実機またはSimulatorで撮影したスクリーンショット。必要な端末サイズは提出時点のApp Store Connectの表示に従う。ブラウザで撮った画像を実機スクリーンショットと称して使わない。
- サポートURL：`https://kabutochoo.github.io/-/support.html`
- プライバシーポリシーURL：`https://kabutochoo.github.io/-/privacy.html`
- App Privacy：現実装は入力内容を開発者へ送信せず、広告・解析SDKもないため「データを収集しない」が想定。実際の配信ビルドと利用するサービスに照らして所有者が確認。将来クラウド同期や解析を足す場合は申告・ポリシーを更新。
- 暗号化の申告：現実装は独自暗号を使用せず、`ITSAppUsesNonExemptEncryption=false`。機能やSDKを変更したら再確認。
- 審査用ログイン：アカウント機能がないため不要。操作手順を審査メモに記載。

ビルドを選択して審査へ提出します。審査通過・公開はAppleの判断であり、この資料やプロジェクト生成だけでは配信完了にはなりません。

## 公開後の更新

Web版はGitHub Pagesの同じURLに反映できます。iPhone版は更新のたびに`npm run ios:sync`→Build番号更新→Archive→アップロード→審査が必要です。Webを更新しても、配信済みのiPhoneアプリの同梱コードは自動では変わりません。
