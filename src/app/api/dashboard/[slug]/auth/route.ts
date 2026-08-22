// 複数団体対応ダッシュボードのパスワード認証API。
// パスワードが正しければ、そのslug専用の署名付きセッションCookieを発行する。
// 以後は初回アクセス時のみの認証で済み、更新ボタンもパスワード入力不要になる。

import { NextRequest, NextResponse } from "next/server";
import { getTenantConfig } from "@/lib/tenants";
import { checkPassword, createSessionToken, tenantCookieName } from "@/lib/tenantAuth";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const { slug } = await props.params;
  const tenant = getTenantConfig(slug);

  if (!tenant) {
    return NextResponse.json({ error: "見つかりません" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as { password?: string };
  if (typeof body.password !== "string" || body.password.length === 0) {
    return NextResponse.json({ error: "パスワードを入力してください" }, { status: 400 });
  }

  const ok = await checkPassword(body.password, tenant.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "パスワードが正しくありません" }, { status: 401 });
  }

  const { token, maxAgeSeconds } = createSessionToken(slug);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(tenantCookieName(slug), token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
  return res;
}
