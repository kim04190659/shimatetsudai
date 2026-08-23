// 分室ページ自体(/branches/[slug]など)のパスワード認証API。
// ダッシュボード用のtenantAuth.tsをそのまま流用するが、Cookie名の名前空間を
// "branch:" で分けることで、ダッシュボード側のセッションと混ざらないようにしている。

import { NextRequest, NextResponse } from "next/server";
import { getBranchPasswordHash } from "@/lib/tenants";
import { checkPassword, createSessionToken, tenantCookieName } from "@/lib/tenantAuth";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const { slug } = await props.params;
  const passwordHash = getBranchPasswordHash(slug);

  if (!passwordHash) {
    return NextResponse.json({ error: "この分室はパスワード保護されていません" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as { password?: string };
  if (typeof body.password !== "string" || body.password.length === 0) {
    return NextResponse.json({ error: "パスワードを入力してください" }, { status: 400 });
  }

  const ok = await checkPassword(body.password, passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "パスワードが正しくありません" }, { status: 401 });
  }

  const cookieSlug = `branch:${slug}`;
  const { token, maxAgeSeconds } = createSessionToken(cookieSlug);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(tenantCookieName(cookieSlug), token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
  return res;
}
