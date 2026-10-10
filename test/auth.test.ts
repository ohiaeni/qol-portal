import { describe, expect, it } from "vitest";
import { AccessError, type AccessVerifier } from "../src/lib/access";
import { authenticate } from "../src/lib/auth";

const TEAM = "https://example.cloudflareaccess.com";
const AUD = "test-aud";
const access = { ACCESS_TEAM_DOMAIN: TEAM, ACCESS_AUD: AUD };

/** JWT の検証を真似る。"valid" だけを正しいトークンとして扱う */
const verify: AccessVerifier = (token, config) => {
  if (token !== "valid" || config.teamDomain !== TEAM || config.aud !== AUD) {
    return Promise.reject(new AccessError("invalid token"));
  }
  return Promise.resolve("Owner@Example.invalid");
};

describe("authenticate", () => {
  it("returns the lowercased email of a valid Access token", async () => {
    expect(await authenticate(access, "valid", verify)).toBe("owner@example.invalid");
  });

  it("rejects a request without the Access token", async () => {
    await expect(authenticate(access, null, verify)).rejects.toThrow(AccessError);
  });

  it("rejects an invalid Access token", async () => {
    await expect(authenticate(access, "forged", verify)).rejects.toThrow(AccessError);
  });

  it("ignores DEV_USER_EMAIL when Access is configured", async () => {
    await expect(authenticate({ ...access, DEV_USER_EMAIL: "owner@example.invalid" }, null, verify)).rejects.toThrow(
      AccessError,
    );
  });

  it("rejects every request when only one of the Access settings is set", async () => {
    await expect(
      authenticate({ ACCESS_TEAM_DOMAIN: TEAM, DEV_USER_EMAIL: "owner@example.invalid" }, "valid", verify),
    ).rejects.toThrow("must be set together");
  });

  it("rejects every request when neither Access nor DEV_USER_EMAIL is set", async () => {
    await expect(authenticate({}, null, verify)).rejects.toThrow(AccessError);
  });

  it("uses DEV_USER_EMAIL in local development", async () => {
    expect(await authenticate({ DEV_USER_EMAIL: "OWNER@example.invalid" }, null, verify)).toBe("owner@example.invalid");
  });
});
