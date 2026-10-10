import { AccessError, type AccessVerifier } from "./access";
import type { Bindings } from "./env";

type AuthEnv = Pick<Bindings, "ACCESS_TEAM_DOMAIN" | "ACCESS_AUD" | "DEV_USER_EMAIL">;

/**
 * リクエストしたユーザーのメールアドレス（小文字）を決める。
 * 本番では Access の JWT を検証し、ローカル開発では DEV_USER_EMAIL を使う。どちらもなければ誰も通さない。
 * 使える人は Access のポリシーで絞り込む（ポータルはユーザーごとのデータを持たないので、users テーブルは持たない）
 */
export async function authenticate(env: AuthEnv, token: string | null, verify: AccessVerifier): Promise<string> {
  const { ACCESS_TEAM_DOMAIN: teamDomain, ACCESS_AUD: aud, DEV_USER_EMAIL: devEmail } = env;
  if (teamDomain || aud) {
    if (!teamDomain || !aud) {
      throw new AccessError("ACCESS_TEAM_DOMAIN and ACCESS_AUD must be set together");
    }
    if (!token) {
      throw new AccessError("missing Cf-Access-Jwt-Assertion header");
    }
    return (await verify(token, { teamDomain, aud })).toLowerCase();
  }
  if (devEmail) {
    return devEmail.toLowerCase();
  }
  throw new AccessError("ACCESS_TEAM_DOMAIN / ACCESS_AUD (or DEV_USER_EMAIL for local development) is not set");
}
