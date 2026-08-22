// 複数団体対応ダッシュボードの認証まわり。
// 「初回アクセス時にパスワードを1回入力すれば、以後は署名付きCookieで自動的に
//  本人と認識され、更新ボタンもパスワード無しで押せる」という挙動にするための
// セッションCookieの発行・検証と、bcryptjsによるパスワード照合をまとめている。

import { createHmac, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30日

function getSessionSecret(): string {
  const secret = process.env.DASHBOARD_SESSION_SECRET;
  if (!secret) {
    throw new Error("DASHBOARD_SESSION_SECRET が設定されていません");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
}

/** slug専用のCookie名(団体ごとに別Cookieにして、他団体のセッションと混ざらないようにする) */
export function tenantCookieName(slug: string): string {
  return `td_session_${slug}`;
}

/** ログイン成功時に発行する、署名付きセッショントークンを作る */
export function createSessionToken(slug: string): { token: string; maxAgeSeconds: number } {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${slug}.${expiresAt}`;
  const signature = sign(payload);
  return { token: `${payload}.${signature}`, maxAgeSeconds: SESSION_MAX_AGE_SECONDS };
}

/** Cookieから受け取ったトークンが、指定slug向けの有効な署名かどうかを検証する */
export function verifySessionToken(slug: string, token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [tokenSlug, expiresAtStr, signature] = parts;
  if (tokenSlug !== slug) return false;

  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  const expectedSignature = sign(`${tokenSlug}.${expiresAtStr}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** 平文パスワードを、テナント設定に保存されたbcryptハッシュと照合する */
export function checkPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
