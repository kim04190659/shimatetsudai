// ダッシュボードの「セル編集モード」用の簡易認証。
//
// 本格的なロール別ログイン基盤(Supabase Auth)は別のChangeRequest
// 「Supabase Authログイン基盤＋ロール別/adminメニュー・API」で対応予定(現在Status=保留)。
// それまでの仮運用として、分室共通の合い言葉(DASHBOARD_EDIT_PASSPHRASE)1つだけで
// 「編集モードに入れるかどうか」を判定する。誰が直したかは、ログイン時に入力してもらう
// 名前(自由記述・本人確認はしない)をセッションに載せて記録用に使う。
//
// tenantAuth.ts と同じ「HMAC署名付きCookie」の考え方を流用している。

import { createHmac, timingSafeEqual } from "crypto";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8時間(編集セッションは短めにしておく)
export const EDIT_SESSION_COOKIE_NAME = "td_edit_session";

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

/** 入力された合い言葉が、環境変数 DASHBOARD_EDIT_PASSPHRASE と一致するか確認する */
export function checkEditPassphrase(passphrase: string): boolean {
  const expected = process.env.DASHBOARD_EDIT_PASSPHRASE;
  if (!expected) {
    // 未設定の場合は、誤って誰でも編集できる状態にしないよう「常に拒否」する
    console.warn("DASHBOARD_EDIT_PASSPHRASE が未設定のため、セル編集モードは常に拒否されます");
    return false;
  }
  const a = Buffer.from(passphrase);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** ログイン成功時に発行する、編集者名入りの署名付きセッショントークンを作る */
export function createEditSessionToken(editorName: string): { token: string; maxAgeSeconds: number } {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  // 名前に "." や改行が入るとパース事故のもとになるので、Base64化してから載せる
  const encodedName = Buffer.from(editorName, "utf-8").toString("base64url");
  const payload = `${encodedName}.${expiresAt}`;
  const signature = sign(payload);
  return { token: `${payload}.${signature}`, maxAgeSeconds: SESSION_MAX_AGE_SECONDS };
}

/** Cookieのトークンを検証し、有効なら編集者名を返す。無効ならnull */
export function verifyEditSessionToken(token: string | undefined): { editorName: string } | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedName, expiresAtStr, signature] = parts;
  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;

  const expectedSignature = sign(`${encodedName}.${expiresAtStr}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const editorName = Buffer.from(encodedName, "base64url").toString("utf-8");
    return { editorName };
  } catch {
    return null;
  }
}
