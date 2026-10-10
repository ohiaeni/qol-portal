import { describe, expect, it } from "vitest";
import { listApps } from "../src/lib/apps";

describe("listApps", () => {
  it("returns the apps in display order with the configured URLs", () => {
    const apps = listApps({
      KAITOKUNE_URL: "https://kaitokune.example.workers.dev",
      KAKEIBOU_URL: "",
      KAITOKUNE_REPO: "owner/kaitokune",
      KAKEIBOU_REPO: "",
    });
    expect(apps.map((app) => app.name)).toEqual(["kaitokune", "かけいぼ"]);
    expect(apps.map((app) => app.url)).toEqual(["https://kaitokune.example.workers.dev", null]);
    expect(apps.map((app) => app.repo)).toEqual(["owner/kaitokune", null]);
  });
});
