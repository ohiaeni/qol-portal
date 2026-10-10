import type { AppLink } from "./apps";
import type { Bindings } from "./env";

export const TITLE_MAX = 80;
export const BODY_MAX = 2000;

export const KINDS = {
  feature: { label: "機能の要望", issueLabel: "enhancement" },
  bug: { label: "不具合の報告", issueLabel: "bug" },
} as const;

type Kind = keyof typeof KINDS;

export type RequestInput = { appId: string; kind: Kind; title: string; body: string };

export type ParseResult = { ok: true; value: RequestInput } | { ok: false; error: string };

/** フォームの入力を検証する。送信先に選べるのは、リポジトリが設定されているアプリだけ */
export function parseRequest(form: FormData, apps: AppLink[]): ParseResult {
  const text = (name: string) => String(form.get(name) ?? "").trim();
  const appId = text("app");
  const kind = text("kind");
  const title = text("title");
  const body = text("body");

  if (!apps.some((app) => app.id === appId && app.repo)) {
    return { ok: false, error: "対象のアプリを選んでください" };
  }
  if (!Object.hasOwn(KINDS, kind)) {
    return { ok: false, error: "種類を選んでください" };
  }
  if (!title || title.length > TITLE_MAX) {
    return { ok: false, error: `タイトルは 1〜${TITLE_MAX} 文字で入力してください` };
  }
  if (!body || body.length > BODY_MAX) {
    return { ok: false, error: `内容は 1〜${BODY_MAX} 文字で入力してください` };
  }
  return { ok: true, value: { appId, kind: kind as Kind, title, body } };
}

/** issue の本文。公開リポジトリにも作るので、送った人のメールアドレスなどは書かない */
export function buildIssueBody(input: RequestInput): string {
  return `## 内容\n\n${input.body}\n\n---\nポータルから送信された${KINDS[input.kind].label}です。`;
}

type IssueEnv = Pick<Bindings, "GITHUB_TOKEN">;

/** GitHub API で issue を作る。失敗したら Error を投げる（トークンやレスポンスの中身はメッセージに入れない） */
export async function createIssue(
  env: IssueEnv,
  fetcher: typeof fetch,
  repo: string,
  input: RequestInput,
): Promise<void> {
  if (!env.GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN is not set");
  }
  const res = await fetcher(`https://api.github.com/repos/${repo}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "qol-portal",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      title: input.title,
      body: buildIssueBody(input),
      labels: [KINDS[input.kind].issueLabel],
    }),
  });
  if (!res.ok) {
    throw new Error(`GitHub API returned ${res.status} for ${repo}`);
  }
}
