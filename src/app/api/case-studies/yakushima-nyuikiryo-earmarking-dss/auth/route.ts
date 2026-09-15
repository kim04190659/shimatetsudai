// 屋久島「入域料の使途限定問題」ダッシュボードのパスワード認証API。
// /api/branch/[slug]/auth/route.ts と同じtenantAuth.tsの仕組みを流用しているが、
// この1ダッシュボード専用に固定のパスワードハッシュを持つ(複数団体対応の
// tenants.tsとは別枠。観光協会限定の1件だけのため、設定ファイルを増やさずここに直書きしている)。
import { NextRequest, NextResponse } from "next/server";
import { checkPassword, createSessionToken, tenantCookieName } from "@/lib/tenantAuth";

const SLUG = "yakushima-nyuikiryo-earmarking-dss";
const SESSION_SLUG = `case-study:${SLUG}`;

// bcryptjsでハッシュ化したパスワード(平文パスワードはコードに残さない)。
// 変更する場合は、ローカルのNode.jsで `bcrypt.hash("新パスワード", 10)` を実行して置き換える。
const PASSWORD_HASH = "$2b$10$ry90OdYUCj7wX9hJgWXGh.4gUr1TjwCkqr5LwUmKM2ulYCjZcYaHS";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { password?: string };
  if (typeof body.password !== "string" || body.password.length === 0) {
    return NextResponse.json({ error: "パスワードを入力してください" }, { status: 400 });
  }

  const ok = await checkPassword(body.password, PASSWORD_HASH);
  if (!ok) {
    return NextResponse.json({ error: "パスワードが正しくありません" }, { status: 401 });
  }

  const { token, maxAgeSeconds } = createSessionToken(SESSION_SLUG);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(tenantCookieName(SESSION_SLUG), token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
  return res;
}
