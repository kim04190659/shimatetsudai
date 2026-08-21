// りとけいライブダッシュボード。v6/v7と同じ「単体のHTMLファイル」として動作するよう、
// Next.jsのレイアウト(ヘッダー・フッター)を経由せず、Route Handlerで生のHTMLを返す。
// 内容はキャッシュされ、/api/case-studies/ritokei-resource-dss/refresh から
// 更新がかかるまで再生成されない。

import { getCachedRitokeiDashboard } from "@/lib/ritokeiDashboard";
import { renderRitokeiDashboardHtml } from "@/lib/ritokeiDashboardHtml";

export const runtime = "nodejs";

export async function GET() {
  const data = await getCachedRitokeiDashboard();
  const html = renderRitokeiDashboardHtml(data);

  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
