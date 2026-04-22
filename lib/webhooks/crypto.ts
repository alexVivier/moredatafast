import "server-only";

import crypto from "node:crypto";

import { decrypt, encrypt } from "@/lib/crypto/keyring";

const SECRET_BYTES = 32;

export function generateSecret(): string {
  return `whsec_${crypto.randomBytes(SECRET_BYTES).toString("base64url")}`;
}

export function encryptSecret(plaintext: string): string {
  return encrypt(plaintext);
}

export function decryptSecret(ciphertext: string): string {
  return decrypt(ciphertext);
}

/**
 * Stripe-style signature header: `t=<unix>,v1=<hex hmac>`. Receivers verify
 * by recomputing HMAC-SHA256(secret, `${t}.${rawBody}`) and comparing
 * constant-time against v1.
 */
export function signPayload(
  secret: string,
  rawBody: string,
  timestampSec: number,
): string {
  const toSign = `${timestampSec}.${rawBody}`;
  const mac = crypto.createHmac("sha256", secret).update(toSign).digest("hex");
  return `t=${timestampSec},v1=${mac}`;
}
