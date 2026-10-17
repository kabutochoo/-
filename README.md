# 皇居RUNLOO

また走る、また関わる。皇居で出会ったランナーの手帳と、RUNの計測・記録比較。

- [Web版](https://kabutochoo.github.io/-/)
- [開発・起動手順](DEVELOPMENT.md)
- [iPhone版をビルド・配信する手順](release/APP_STORE.md)
- [App Store掲載文案](release/STORE_LISTING_JA.md)

iPhone版のプロジェクトは `ios/App/App.xcodeproj`。MacでNode.js 22以降とXcodeを用意し、以下を実行します。

```sh
npm ci
npm run ios:sync
npm run ios:open
```

署名する開発チームとBundle IDの確定、iPhoneでの実機確認、TestFlight・審査提出はMac側で行います。リポジトリにiOSプロジェクトがあるだけではApp Storeへの配信完了にはなりません。
