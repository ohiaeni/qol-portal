# 生活の質向上ポータル（qol-portal）

「生活の質向上プロジェクト」のアプリへの入口になるページです。開くと、各アプリへのリンクが並びます。

| アプリ                                            | 内容                                   | 動いている場所     |
| ------------------------------------------------- | -------------------------------------- | ------------------ |
| [kaitokune](https://github.com/ohiaeni/kaitokune) | AI の質問に答えるだけで書ける日記      | Cloudflare Workers |
| [kakeibou](https://github.com/ohiaeni/kakeibou)   | 毎日の支出を記録する家計簿（かけいぼ） | Render + Supabase  |

## 構成

- [Astro](https://astro.build/) で書き、[`@astrojs/cloudflare`](https://docs.astro.build/en/guides/integrations-guide/cloudflare/) で Cloudflare Workers に載せる
- ページはリクエストのたびに Worker で描画する。そのとき Cloudflare Access の JWT を検証し、ログインしているメールアドレスを表示する
- 使える人は Cloudflare Access のポリシーで決める。ポータルはユーザーごとのデータを持たないので、データベースはない
- Cloudflare の無料枠だけで動く（KV・Images などのバインディングは使わない）

```text
src/
├── middleware.ts       すべてのページで Access の JWT を検証する
├── pages/index.astro   トップページ（アプリの一覧）
└── lib/
    ├── access.ts       Access の JWT の検証（kaitokune と同じもの）
    ├── auth.ts         本番は JWT、ローカルは DEV_USER_EMAIL でユーザーを決める
    ├── apps.ts         並べるアプリの一覧
    └── env.ts          環境変数・シークレットの型
```

## 設定値

| 名前                 | 種類                        | 内容                                                                      |
| -------------------- | --------------------------- | ------------------------------------------------------------------------- |
| `KAITOKUNE_URL`      | vars（`wrangler.jsonc`）    | kaitokune の URL。空なら画面に「URL が未設定」と出る                      |
| `KAKEIBOU_URL`       | vars（`wrangler.jsonc`）    | kakeibou の URL                                                           |
| `ACCESS_TEAM_DOMAIN` | シークレット（本番で必須）  | Access のチームドメイン（`https://<チーム名>.cloudflareaccess.com`）      |
| `ACCESS_AUD`         | シークレット（本番で必須）  | ポータルの Access アプリケーションの AUD タグ                             |
| `DEV_USER_EMAIL`     | `.dev.vars`（ローカルだけ） | ローカル開発で表示するメールアドレス。Access の設定があるときは無視される |

## 開発

```sh
npm install
cp .dev.vars.example .dev.vars
npm run dev   # http://localhost:4321
```

Cloudflare への登録・デプロイ・Access の設定は [docs/setup.md](docs/setup.md) を参照してください。
