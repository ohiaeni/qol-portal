import { describe, expect, it, vi } from "vitest";
import type { AppLink } from "../src/lib/apps";
import { BODY_MAX, buildIssueBody, createIssue, parseRequest, TITLE_MAX } from "../src/lib/requests";

const apps: AppLink[] = [
  { id: "kaitokune", name: "kaitokune", description: "", icon: "", url: null, repo: "owner/kaitokune" },
  { id: "kakeibou", name: "かけいぼ", description: "", icon: "", url: null, repo: null },
];

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    data.set(key, value);
  }
  return data;
}

const valid = { app: "kaitokune", kind: "feature", title: " 検索したい ", body: " 過去の日記を検索したい " };

describe("parseRequest", () => {
  it("accepts a valid request and trims the text", () => {
    expect(parseRequest(form(valid), apps)).toEqual({
      ok: true,
      value: { appId: "kaitokune", kind: "feature", title: "検索したい", body: "過去の日記を検索したい" },
    });
  });

  it.each([
    ["unknown app", { app: "other" }],
    ["app without a repo", { app: "kakeibou" }],
    ["unknown kind", { kind: "toString" }],
    ["empty title", { title: "  " }],
    ["too long title", { title: "あ".repeat(TITLE_MAX + 1) }],
    ["empty body", { body: "" }],
    ["too long body", { body: "あ".repeat(BODY_MAX + 1) }],
  ])("rejects %s", (_name, override) => {
    expect(parseRequest(form({ ...valid, ...override }), apps).ok).toBe(false);
  });

  it("rejects a missing field", () => {
    expect(parseRequest(new FormData(), apps).ok).toBe(false);
  });
});

describe("buildIssueBody", () => {
  it("includes the body and the kind", () => {
    const body = buildIssueBody({ appId: "kaitokune", kind: "bug", title: "t", body: "落ちる" });
    expect(body).toContain("落ちる");
    expect(body).toContain("不具合の報告");
  });
});

describe("createIssue", () => {
  const input = { appId: "kaitokune", kind: "bug", title: "落ちる", body: "詳細" } as const;

  it("posts the issue with the label and the token", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("{}", { status: 201 }));
    await createIssue({ GITHUB_TOKEN: "secret" }, fetcher, "owner/kaitokune", input);
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://api.github.com/repos/owner/kaitokune/issues");
    expect(init.headers.Authorization).toBe("Bearer secret");
    expect(JSON.parse(init.body)).toMatchObject({ title: "落ちる", labels: ["bug"] });
  });

  it("throws without a token", async () => {
    const fetcher = vi.fn();
    await expect(createIssue({}, fetcher, "owner/kaitokune", input)).rejects.toThrow("GITHUB_TOKEN");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("throws on a GitHub error without leaking the token", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("{}", { status: 403 }));
    const error = await createIssue({ GITHUB_TOKEN: "secret" }, fetcher, "owner/kaitokune", input).catch((e) => e);
    expect(error.message).toContain("403");
    expect(error.message).not.toContain("secret");
  });
});
