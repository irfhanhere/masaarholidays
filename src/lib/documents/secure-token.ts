import "server-only";
import crypto from "crypto";

interface SecurePackagePayload {
  applicationId: string;
  docIds?: string[];
  exp: number; // Unix timestamp in milliseconds
}

function getSigningSecret(): string {
  const secret =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.CRON_SECRET ||
    process.env.STRIPE_SECRET_KEY ||
    "masaar-secure-visa-documents-default-secret-salt";
  return secret;
}

/**
 * Creates a tamper-proof, time-limited token granting access to download
 * an application's selected visa documents as a package.
 */
export function generateSecurePackageToken(
  applicationId: string,
  docIds?: string[],
  expiresInHours: number = 48
): string {
  const exp = Date.now() + expiresInHours * 60 * 60 * 1000;
  const payload: SecurePackagePayload = {
    applicationId,
    docIds: docIds && docIds.length > 0 ? docIds : undefined,
    exp,
  };

  const jsonStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(jsonStr, "utf8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSigningSecret())
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies the validity, tamper-resistance, and expiration of a secure package token.
 */
export function verifySecurePackageToken(token: string): {
  valid: boolean;
  error?: string;
  payload?: SecurePackagePayload;
} {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return { valid: false, error: "Malformed or missing secure package token." };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false, error: "Invalid token structure." };
  }

  const [payloadB64, signature] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", getSigningSecret())
    .update(payloadB64)
    .digest("base64url");

  // Constant-time comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return { valid: false, error: "Invalid cryptographic signature." };
  }

  try {
    const jsonStr = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload: SecurePackagePayload = JSON.parse(jsonStr);

    if (!payload.applicationId || !payload.exp) {
      return { valid: false, error: "Invalid token payload contents." };
    }

    if (Date.now() > payload.exp) {
      return {
        valid: false,
        error: "This secure download link has expired. Please contact Masaar Holidays to request a renewed link.",
      };
    }

    return { valid: true, payload };
  } catch (err: unknown) {
    return { valid: false, error: "Failed to parse token payload." };
  }
}
