import { defineMiddleware } from "astro:middleware";
import { env } from "cloudflare:workers";
import { AccessError, createAccessVerifier } from "./lib/access";
import { authenticate } from "./lib/auth";
import type { Bindings } from "./lib/env";

const verifyAccess = createAccessVerifier(fetch);

/** シークレット（ACCESS_TEAM_DOMAIN など）は Env の型に入らないので、Bindings として読む */
const bindings: Bindings = env;

/** すべてのページで Access の JWT を検証し、ログインしているメールアドレスを Astro.locals に入れる */
export const onRequest = defineMiddleware(async (context, next) => {
  try {
    context.locals.email = await authenticate(
      bindings,
      context.request.headers.get("cf-access-jwt-assertion"),
      verifyAccess,
    );
  } catch (e) {
    if (e instanceof AccessError) {
      console.warn(`access denied: ${e.message}`);
      return new Response("ログインを確認できませんでした", { status: 401 });
    }
    throw e;
  }
  return next();
});
