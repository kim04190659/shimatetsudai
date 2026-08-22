// 複数団体対応ダッシュボードの更新API。
// 「初回アクセス時のみ認証」の方針に合わせ、パスワードではなく
// セッションCookieの有無・有効性だけを見て、そのテナント専用のキャッシュタグを
// revalidateする。他のテナントのキャッシュには一切影響しない。

import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getTenantConfig } from "@/lib/tenants";
import { tenantCookieName, verifySessionToken } from "@/lib/tenantAuth";
import { tenantCacheTag } from "@/lib/tenantDashboard";

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

  const sessionToken = req.cookies.get(tenantCookieName(slug))?.value;
  if (!verifySessionToken(slug, sessionToken)) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  revalidateTag(tenantCacheTag(slug), "max");

  return NextResponse.json({ ok: true });
}
