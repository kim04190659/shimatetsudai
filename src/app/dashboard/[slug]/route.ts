// 複数団体対応ダッシュボードの表示エンドポイント。
// /dashboard/<slug> にアクセスすると、セッションCookieがなければパスワード入力画面を、
// あればNotion+生成AIから作られたダッシュボードを、単体HTMLとして返す。

import { NextRequest, NextResponse } from "next/server";
import { getTenantConfig } from "@/lib/tenants";
import { tenantCookieName, verifySessionToken } from "@/lib/tenantAuth";
import { getCachedTenantDashboard } from "@/lib/tenantDashboard";
import { renderTenantDashboardHtml, renderTenantPasswordGateHtml } from "@/lib/tenantDashboardHtml";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const { slug } = await props.params;
  const tenant = getTenantConfig(slug);

  if (!tenant) {
    return new NextResponse("ページが見つかりません", { status: 404 });
  }

  const sessionToken = req.cookies.get(tenantCookieName(slug))?.value;
  const authenticated = verifySessionToken(slug, sessionToken);

  if (!authenticated) {
    return new NextResponse(renderTenantPasswordGateHtml(slug), {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  // tenant.label は社内管理用のメモであり、画面には出さない(displayLabelを渡さない)
  const data = await getCachedTenantDashboard(tenant);
  const html = renderTenantDashboardHtml(data, { slug });

  return new NextResponse(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
