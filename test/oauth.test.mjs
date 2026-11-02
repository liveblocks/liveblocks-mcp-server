import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { EncryptJWT } from "jose";

const secret = "oauth-test-secret";
const issuer = "https://liveblocks.io";
const audience = "https://preview.example";

process.env.MCP_OAUTH_TOKEN_SECRET = secret;
process.env.MCP_OAUTH_ISSUER = issuer;
process.env.MCP_PUBLIC_URL = "https://preview.example";

const { getProtectedResourceMetadata, verifyAccessToken } = await import(
  "../build/oauth.js"
);

const key = new Uint8Array(createHash("sha256").update(secret).digest());

async function createAccessToken({ exp, aud = audience }) {
  const claims = {
    iss: issuer,
    aud,
    iat: Math.floor(Date.now() / 1000),
    sub: "user_123",
    account_id: "team_123",
    project_id: "project_123",
    secret_key: "sk_test",
  };

  if (exp !== undefined) {
    claims.exp = exp;
  }

  return new EncryptJWT(claims)
    .setProtectedHeader({
      alg: "dir",
      enc: "A256GCM",
      typ: "liveblocks-oauth-access",
    })
    .encrypt(key);
}

test("rejects access tokens without an expiration", async () => {
  const token = await createAccessToken({});

  assert.equal(await verifyAccessToken(token), null);
});

test("accepts a correctly expiring token for the configured resource URL", async () => {
  const token = await createAccessToken({
    exp: Math.floor(Date.now() / 1000) + 60,
  });

  assert.equal(
    getProtectedResourceMetadata().resource,
    "https://preview.example"
  );
  assert.equal((await verifyAccessToken(token))?.aud, audience);
});
