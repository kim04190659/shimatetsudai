// ============================================================
// 木村さん個人の「意思決定支援ダッシュボード」表示エンドポイント
// ============================================================
// /dashboard/kimura にアクセスすると、
//   ・ログイン用Cookieが無ければ → パスワード入力画面
//   ・あれば → Notionから最新の依頼・時間配分バランスを取得してHTML表示
// という挙動にする。
//
// 認証(パスワード確認・Cookie発行/検証)の仕組みは、他団体向けダッシュボード
// (src/app/dashboard/[slug]/route.ts)が使っている src/lib/tenantAuth.ts を
// そのまま流用している(tenantAuth.tsはslug名を渡すだけの汎用的な作りなので、
// 「kimura」という固定のslugとして使えばそのまま動く)。
// 表示するデータの内容だけは、木村さん個人用に新しく作った
// src/lib/kimuraDashboard.ts / kimuraDashboardHtml.ts を使う。
//
// 検索エンジンに載らないようにするため、middleware等での追加対応は不要
// (HTML側にnoindexメタタグを入れている。/dashboard配下はサイト内のどこからも
// リンクしていないURLのため、通常の検索エンジンには辿られない想定)。

import { NextRequest, NextResponse } from "next/server";
import { tenantCookieName, verifySessionToken } from "@/lib/tenantAuth";
import { getKimuraDashboardData } from "@/lib/kimuraDashboard";
import { renderKimuraDashboardHtml, renderKimuraPasswordGateHtml } from "@/lib/kimuraDashboardHtml";

export const runtime = "nodejs";

// このダッシュボード専用の固定slug(他団体のCookieと混ざらないようにするための名前)
const SLUG = "kimura";

export async function GET(req: NextRequest) {
  const sessionToken = req.cookies.get(tenantCookieName(SLUG))?.value;
  const authenticated = verifySessionToken(SLUG, sessionToken);

  if (!authenticated) {
    return new NextResponse(renderKimuraPasswordGateHtml(), {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const data = await getKimuraDashboardData();
  const html = renderKimuraDashboardHtml(data);

  return new NextResponse(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
