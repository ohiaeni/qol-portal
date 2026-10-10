import type { Bindings } from "./env";

export type AppLink = {
  name: string;
  description: string;
  /** 一覧に出すアイコン（絵文字） */
  icon: string;
  /** wrangler.jsonc の vars で設定した URL。未設定なら null */
  url: string | null;
};

type AppsEnv = Pick<Bindings, "KAITOKUNE_URL" | "KAKEIBOU_URL">;

/** ポータルに並べるアプリ（表示する順） */
export function listApps(env: AppsEnv): AppLink[] {
  return [
    {
      name: "kaitokune",
      description: "AI の質問に答えるだけで書ける日記",
      icon: "📔",
      url: env.KAITOKUNE_URL || null,
    },
    {
      name: "かけいぼ",
      description: "毎日の支出を記録する家計簿",
      icon: "💰",
      url: env.KAKEIBOU_URL || null,
    },
  ];
}
