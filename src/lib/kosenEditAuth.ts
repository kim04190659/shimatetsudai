// 高専サイト「先生ページ編集モード」用の簡易認証。
//
// dashboardEditAuth.ts(意思決定支援ダッシュボードのセル編集)と同じ「合い言葉1つ＋
// お名前(自由記述・本人確認はしない)」の考え方を流用している。パスワードや対象のDB・
// Cookie名を分けているのは、高専の先生用パスワードと、しまてつだいの分室スタッフ用
// パスワードを混同しないようにするため。
//
// 本格的なロール別ログイン基盤(Supabase Auth)は別途検討予定。それまでの仮運用。

import { createHmac, timingSafeEqual } from "crypto";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8時間(編集セッションは短めにしておく)
export const KOSEN_EDIT_SESSION_COOKIE_NAME = "kosen_edit_session";

function getSessionSecret(): string {
  const secret = process.env.DASHBOARD_SESSION_SECRET;
  if (!secret) {
    throw new Error("DASHBOARD_SESSION_SECRET が設定されていません");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSessionSecret()).update(`kosen:${payload}`).digest("hex");
}

/** 入力された合い言葉が、環境変数 KOSEN_EDIT_PASSPHRASE と一致するか確認する */
export function checkKosenEditPassphrase(passphrase: string): boolean {
  const expected = process.env.KOSEN_EDIT_PASSPHRASE;
  if (!expected) {
    // 未設定の場合は、誤って誰でも編集できる状態にしないよう「常に拒否」する
    console.warn("KOSEN_EDIT_PASSPHRASE が未設定のため、先生ページ編集モードは常に拒否されます");
    return false;
  }
  const a = Buffer.from(passphrase);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** ログイン成功時に発行する、編集者名入りの署名付きセッショントークンを作る */
export function createKosenEditSessionToken(editorName: string): { token: string; maxAgeSeconds: number } {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const encodedName = Buffer.from(editorName, "utf-8").toString("base64url");
  const payload = `${encodedName}.${expiresAt}`;
  const signature = sign(payload);
  return { token: `${payload}.${signature}`, maxAgeSeconds: SESSION_MAX_AGE_SECONDS };
}

/** Cookieのトークンを検証し、有効なら編集者名を返す。無効ならnull */
export function verifyKosenEditSessionToken(token: string | undefined): { editorName: string } | null {
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
