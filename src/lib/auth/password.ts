/**
 * 密码哈希 —— getfrp(en/海外)邮箱+密码直接注册用。仅在 Node 路由
 * (runtime="nodejs")调用,用 node:crypto scrypt(无第三方依赖)。
 * 存储格式: "scrypt$<saltHex>$<hashHex>"。
 */
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEYLEN = 64;

export function isValidPassword(pw: unknown): pw is string {
  return typeof pw === "string" && pw.length >= 8 && pw.length <= 200;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(parts[1], "hex");
    expected = Buffer.from(parts[2], "hex");
  } catch {
    return false;
  }
  if (expected.length === 0) return false;
  let actual: Buffer;
  try {
    actual = scryptSync(password, salt, expected.length);
  } catch {
    return false;
  }
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
