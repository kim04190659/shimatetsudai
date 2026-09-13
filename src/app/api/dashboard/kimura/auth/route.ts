// ============================================================
// 木村さん個人の「意思決定支援ダッシュボード」パスワード認証API
// ============================================================
// パスワードが正しければ、"kimura"専用の署名付きセッションCookieを発行する。
// 仕組みは src/app/api/dashboard/[slug]/auth/route.ts と同じ
// (src/lib/tenantAuth.ts を共通で使っている)。違いは、パスワードのハッシュを
// TENANTS_CONFIG(他団体の設定が入った環境変数)からではなく、
// このダッシュボード専用の環境変数 KIMURA_DASHBOARD_PASSWORD_HASH から読む点だけ。

import { NextRequest, NextResponse } from "next/server";
import { checkPassword, createSessionToken, tenantCookieName } from "@/lib/tenantAuth";

export const runtime = "nodejs";

const SLUG = "kimura";

export async function POST(req: NextRequest) {
  const passwordHash = process.env.KIMURA_DASHBOARD_PASSWORD_HASH;
  if (!passwordHash) {
    console.error("KIMURA_DASHBOARD_PASSWORD_HASH が設定されていません");
    return NextResponse.json({ error: "設定エラー" }, { status: 500 });
  }

  const body = (await req.json().catch(() => ({}))) as { password?: string };
  if (typeof body.password !== "string" || body.password.length === 0) {
    return NextResponse.json({ error: "パスワードを入力してください" }, { status: 400 });
  }

  const ok = await checkPassword(body.password, passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "パスワードが正しくありません" }, { status: 401 });
  }

  const { token, maxAgeSeconds } = createSessionToken(SLUG);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(tenantCookieName(SLUG), token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
  return res;
}
