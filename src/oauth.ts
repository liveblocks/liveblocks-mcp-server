import { createHash } from "node:crypto";
import { jwtDecrypt } from "jose";

/**
 * OAuth 2.1 resource-server support.
 *
 * liveblocks.io is the authorization server: it hosts the metadata, dynamic
 * client registration, the login + consent screen and the token endpoint.
 * This server only needs to (1) tell MCP clients where that authorization
 * server lives and (2) verify the access tokens it issues.
 *
 * Access tokens are JWEs encrypted with a key derived from a secret shared
 * between liveblocks.io and this deployment (`MCP_OAUTH_TOKEN_SECRET`). Each
 * token embeds the secret key of the development project the user picked at
 * consent time, so verification is entirely local: no state is stored here
 * and liveblocks.io is never called back.
 */

const ACCESS_TOKEN_TYP = "liveblocks-oauth-access";

/**
 * Public URL of this resource server, `https://mcp.liveblocks.io` in
 * production.
 *
 * It is published as `resource` in the protected resource metadata, which MCP
 * clients echo back as the RFC 8707 `resource` parameter when they request a
 * token, and liveblocks.io then uses as the token's `aud`. So on a preview
 * deployment `MCP_PUBLIC_URL` must be the preview's own origin, and that
 * origin must be allowlisted on the authorization server.
 */
export const RESOURCE_URL = (
  process.env.MCP_PUBLIC_URL ?? "https://mcp.liveblocks.io"
).replace(/\/+$/, "");

/** Issuer of the access tokens, i.e. the liveblocks.io deployment. */
export const AUTHORIZATION_SERVER_URL =
  process.env.MCP_OAUTH_ISSUER ?? "https://liveblocks.io";

export const PROTECTED_RESOURCE_METADATA_PATH =
  "/.well-known/oauth-protected-resource";

export function isOAuthEnabled(): boolean {
  return Boolean(process.env.MCP_OAUTH_TOKEN_SECRET);
}

/**
 * RFC 9728 protected resource metadata, served at
 * `/.well-known/oauth-protected-resource`.
 */
export function getProtectedResourceMetadata() {
  return {
    resource: RESOURCE_URL,
    authorization_servers: [AUTHORIZATION_SERVER_URL],
    bearer_methods_supported: ["header"],
    resource_documentation: "https://liveblocks.io/docs/tools/mcp-server",
  };
}

export interface AccessTokenPayload {
  iss: string;
  aud: string;
  iat: number;
  exp: number;
  client_id?: string;
  /** User id. */
  sub: string;
  /** Team id. */
  account_id: string;
  project_id: string;
  /** Secret key of the development project the user granted access to. */
  secret_key: string;
}

let cachedKey: { secret: string; key: Uint8Array } | undefined;

/**
 * Derives the A256GCM content-encryption key from the shared secret. Must stay
 * in sync with liveblocks.io: `sha256(MCP_OAUTH_TOKEN_SECRET)` as 32 bytes.
 */
function getEncryptionKey(secret: string): Uint8Array {
  if (cachedKey?.secret !== secret) {
    cachedKey = {
      secret,
      key: new Uint8Array(createHash("sha256").update(secret).digest()),
    };
  }
  return cachedKey.key;
}

/**
 * Verifies an OAuth access token issued by liveblocks.io and returns its
 * claims, or `null` when the token is invalid for any reason (wrong key,
 * wrong `typ`, expired, wrong issuer/audience, malformed claims, ...).
 *
 * Never throws. Returns `null` when OAuth is not configured.
 */
export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload | null> {
  const secret = process.env.MCP_OAUTH_TOKEN_SECRET;
  if (!secret) {
    return null;
  }

  try {
    const { payload } = await jwtDecrypt(token, getEncryptionKey(secret), {
      issuer: AUTHORIZATION_SERVER_URL,
      audience: RESOURCE_URL,
      // Refresh tokens, authorization codes and client ids are encrypted with
      // the same key but carry a different `typ`; this keeps them from being
      // accepted as bearer tokens.
      typ: ACCESS_TOKEN_TYP,
      contentEncryptionAlgorithms: ["A256GCM"],
      keyManagementAlgorithms: ["dir"],
    });

    const { sub, account_id, project_id, secret_key } = payload;
    if (
      typeof sub !== "string" ||
      typeof account_id !== "string" ||
      typeof project_id !== "string" ||
      typeof secret_key !== "string" ||
      !secret_key.startsWith("sk_")
    ) {
      return null;
    }

    return payload as unknown as AccessTokenPayload;
  } catch {
    return null;
  }
}
