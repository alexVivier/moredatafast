import "server-only";

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;

const DATA_DIR = path.join(process.cwd(), "data");
const KEY_FILE = path.join(DATA_DIR, "master.key");

let cachedKey: Buffer | null = null;

export class KeyringError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "KeyringError";
  }
}

function loadOrCreateMasterKey(): Buffer {
  const envKey = process.env.DASHBOARD_ENCRYPTION_KEY;
  if (envKey) {
    try {
      const decoded = Buffer.from(envKey, "base64");
      if (decoded.length !== KEY_BYTES) {
        throw new KeyringError(
          `DASHBOARD_ENCRYPTION_KEY must decode to ${KEY_BYTES} bytes; got ${decoded.length}`
        );
      }
      return decoded;
    } catch (e) {
      if (e instanceof KeyringError) throw e;
      throw new KeyringError("DASHBOARD_ENCRYPTION_KEY is not valid base64", e);
    }
  }

  if (process.env.NODE_ENV === "production") {
    throw new KeyringError(
      "DASHBOARD_ENCRYPTION_KEY is required in production. Generate one with `openssl rand -base64 32`."
    );
  }

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  if (fs.existsSync(KEY_FILE)) {
    const raw = fs.readFileSync(KEY_FILE, "utf8").trim();
    const decoded = Buffer.from(raw, "base64");
    if (decoded.length !== KEY_BYTES) {
      throw new KeyringError(
        `Master key file ${KEY_FILE} is corrupted (expected ${KEY_BYTES} bytes after base64 decode)`
      );
    }
    return decoded;
  }

  const fresh = crypto.randomBytes(KEY_BYTES);
  fs.writeFileSync(KEY_FILE, fresh.toString("base64"), { mode: 0o600 });
  console.warn(
    `[datafast] Generated fresh master key at ${KEY_FILE}. Back this file up — losing it loses all stored API keys.`
  );
  return fresh;
}

function getMasterKey(): Buffer {
  if (!cachedKey) cachedKey = loadOrCreateMasterKey();
  return cachedKey;
}

export function encrypt(plaintext: string): string {
  const key = getMasterKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString("base64");
}

export function decrypt(ciphertextB64: string): string {
  const key = getMasterKey();
  let buf: Buffer;
  try {
    buf = Buffer.from(ciphertextB64, "base64");
  } catch (e) {
    throw new KeyringError("Ciphertext is not valid base64", e);
  }
  if (buf.length < IV_BYTES + TAG_BYTES + 1) {
    throw new KeyringError("Ciphertext is too short");
  }
  const iv = buf.subarray(0, IV_BYTES);
  const tag = buf.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const ct = buf.subarray(IV_BYTES + TAG_BYTES);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  try {
    const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
    return pt.toString("utf8");
  } catch (e) {
    throw new KeyringError(
      "Unable to decrypt API key — master key mismatch or corrupted ciphertext",
      e
    );
  }
}
