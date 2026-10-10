# セットアップ手順

ポータルを Cloudflare にデプロイし、使う人だけが開ける状態にするまでの手順です。Cloudflare アカウント・workers.dev のサブドメイン・Zero Trust の初期設定は kaitokune のときに済んでいる前提です（まだなら [kaitokune の docs/setup.md](https://github.com/ohiaeni/kaitokune/blob/main/docs/setup.md) の手順 3・4・9-1）。すべて無料の範囲で完結します。

## 1. ローカルで動かす

Node.js 24 以上（npm 11 以上）が必要です。

```sh
npm install
cp .dev.vars.example .dev.vars
npm run dev
```

<http://localhost:4321> を開き、`.dev.vars` の `DEV_USER_EMAIL` のメールアドレスと、アプリの一覧が表示されれば成功です。

## 2. アプリの URL を設定する

`wrangler.jsonc` の `vars` に、各アプリの本番の URL を書きます。

```jsonc
"vars": {
  "KAITOKUNE_URL": "https://kaitokune.ohiaeni.workers.dev",
  "KAKEIBOU_URL": "https://kakeibou-oftg.onrender.com",
},
```

変えたら `npm run cf-typegen` で型を更新します。

## 3. デプロイする

```sh
npx wrangler login   # 未ログインの場合だけ
npm run deploy
```

完了すると `https://qol-portal.<サブドメイン>.workers.dev` が表示されます。

> [!CAUTION]
> **この時点ではまだ使えません。** Worker は Access の設定がないと、すべてのページを 401 で断ります。続けて手順 4 を必ず行ってください。

## 4. Cloudflare Access で使える人を制限する

### 4-1. workers.dev に Access を有効にする

1. ダッシュボードで **Workers & Pages** → **qol-portal** → **Settings** → **Domains & Routes** を開く
2. `workers.dev` の行のメニュー（`⋯`）から **Cloudflare Access** を有効にする
3. 表示されるリンク（**Manage Cloudflare Access**）から、自動で作成された Access アプリケーションを開く

### 4-2. 使う人のメールアドレスだけを許可する

1. Access アプリケーションの **Policies** で、**Include** のルールを **Emails** にし、使う人のメールアドレスだけを入力する（kaitokune と同じ人にする）
2. 保存する

kaitokune と同じ Zero Trust のチームにあるので、どちらかで一度ログインすれば、もう一方はコードを入力し直さずに開けます。

### 4-3. Worker に Access の設定を登録する

1. Zero Trust の **Settings** でチームドメイン（`https://<チーム名>.cloudflareaccess.com`）を確認する
2. **Access** → **Applications** で 4-1 のアプリケーションを開き、**Application Audience (AUD) Tag** をコピーする（kaitokune とは別の値です）
3. Worker のシークレットに登録する

```sh
npx wrangler secret put ACCESS_TEAM_DOMAIN   # https://<チーム名>.cloudflareaccess.com を貼り付ける
npx wrangler secret put ACCESS_AUD           # 2 でコピーした AUD タグを貼り付ける
```

> [!WARNING]
> `DEV_USER_EMAIL` は本番に登録しないでください。`ACCESS_TEAM_DOMAIN` と `ACCESS_AUD` があれば無視されますが、それらを消すと JWT を検証せずにそのユーザーとして通してしまいます。

### 4-4. 制限されていることを確認する

1. ブラウザのシークレットウィンドウで `https://qol-portal.<サブドメイン>.workers.dev` を開き、Access のログイン画面が出ることを確認する
2. 許可したメールアドレスでログインし、自分のメールアドレスとアプリの一覧が表示されることを確認する

## 5. GitHub Actions でデプロイする

本番版のタグ（`v0.1.0` など）を push すると、`.github/workflows/deploy.yml` がチェック・ビルド・テストを実行してからデプロイします。初回だけ、Cloudflare の API トークンを GitHub の production の Environment に登録します。登録するまでは、ワークフローは警告を出してデプロイを飛ばします。

1. [Cloudflare のダッシュボード](https://dash.cloudflare.com/profile/api-tokens) の「Create Token」で「Edit Cloudflare Workers」テンプレートを選び、「Account Resources」を自分のアカウントだけにして発行する（D1 の権限は要りません）
2. アカウント ID を確認する（`npx wrangler whoami`）
3. Secrets に登録する

```sh
gh secret set CLOUDFLARE_API_TOKEN --env production
gh secret set CLOUDFLARE_ACCOUNT_ID --env production
```

## 6. 要望フォームの GitHub トークンを登録する

`/request` の要望フォームは、送られた内容を kaitokune・かけいぼのリポジトリの issue にします。そのために、issue を作るだけの権限を持つトークンを Worker のシークレットに登録します。登録するまでは、フォームを送ると「送信できませんでした」と出ます。

1. GitHub の [Fine-grained personal access tokens](https://github.com/settings/personal-access-tokens/new) で新しいトークンを作る
2. **Repository access** は「Only select repositories」で、`wrangler.jsonc` の `KAITOKUNE_REPO`・`KAKEIBOU_REPO` に書いたリポジトリだけを選ぶ
3. **Permissions** は Repository permissions の **Issues** を「Read and write」にする（ほかは付けない）
4. 有効期限は最長（1 年）にし、切れる前に作り直す
5. Worker のシークレットに登録する

```sh
npx wrangler secret put GITHUB_TOKEN
```

ローカル開発で試すときは `.dev.vars` に `GITHUB_TOKEN` を書きます。書かなければ送信は失敗するだけで、ほかの画面は動きます。

## 困ったとき

| 症状                                       | 原因と対処                                                                                                                                    |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 「ログインを確認できませんでした」と出る   | 本番では `ACCESS_TEAM_DOMAIN` と `ACCESS_AUD` が未登録か間違っています（手順 4-3）。ローカルでは `.dev.vars` に `DEV_USER_EMAIL` がありません |
| アプリに「URL が未設定です」と出る         | `wrangler.jsonc` の `vars` が空です（手順 2）                                                                                                 |
| 要望を送ると「送信できませんでした」と出る | `GITHUB_TOKEN` が未登録・期限切れ、またはトークンの対象リポジトリに含まれていません（手順 6）。`npx wrangler tail` で原因を見られます         |
| 本番のログを見たい                         | `npx wrangler tail`                                                                                                                           |
