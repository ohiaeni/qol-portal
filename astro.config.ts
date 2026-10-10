import cloudflare from "@astrojs/cloudflare";
import { defineConfig } from "astro/config";

export default defineConfig({
  // ページを返すたびに Access の JWT を検証するので、すべてサーバー（Worker）で描画する
  output: "server",
  adapter: cloudflare({
    // 画像の変換に Cloudflare Images（無料枠を超えると課金）を使わない
    imageService: "passthrough",
  }),
  // セッションを使わない（使うと KV の namespace が自動で作られる）
  session: false,
});
