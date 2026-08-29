// 管理者画面「議事録取り込みフロー」ステップ4〜6のAPI。
// 画面で人が確認・修正した構造化データを受け取り、Notionの各DBに書き込む。
// 対象IssueがTENANTS_CONFIGに登録済みのテナントダッシュボードであれば、
// 書き込み完了をトリガーにキャッシュを再生成する(=次回アクセス時に最新データが反映される)。
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import {
  writeStructuredMeetingResult,
  extractNotionPageId,
  type StructuredMeetingResult,
  type IssueRelationTargets,
} from "@/lib/adminMeetingImport";
import { assertAdminAccess } from "@/lib/adminAccess";
import { getActiveTenants } from "@/lib/tenants";
import { tenantCacheTag } from "@/lib/tenantDashboard";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const denied = assertAdminAccess(req);
  if (denied) return denied;

  try {
    const body = (await req.json()) as {
      issuePageId?: string;
      targets?: IssueRelationTargets;
      confirmed?: StructuredMeetingResult;
    };

    if (!body.issuePageId || !body.targets || !body.confirmed) {
      return NextResponse.json(
        { error: "issuePageId / targets / confirmed は必須です" },
        { status: 400 }
      );
    }

    // analyze時と同様、URLがそのまま渡されてきてもページIDだけを抽出する。
    let issuePageId: string;
    try {
      issuePageId = extractNotionPageId(body.issuePageId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "ページIDの解析に失敗しました";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { writtenCount } = await writeStructuredMeetingResult({
      issuePageId,
      targets: body.targets,
      confirmed: body.confirmed,
    });

    // Issueの`Status`は自動更新しない(設計書の方針: 議論開始の確認は人が行う)

    // TENANTS_CONFIG側のissuePageIdはハイフンあり/なしどちらの表記もありうるため、
    // 同じ関数で正規化してから比較する(表記ゆれで一致しない事故を防ぐ)。
    const matchedTenant = getActiveTenants().find((t) => {
      try {
        return extractNotionPageId(t.issuePageId) === issuePageId;
      } catch {
        return false;
      }
    });
    let dashboardRevalidated = false;
    if (matchedTenant) {
      revalidateTag(tenantCacheTag(matchedTenant.slug), "max");
      dashboardRevalidated = true;
    }

    return NextResponse.json({
      writtenCount,
      dashboardRevalidated,
      tenantSlug: matchedTenant?.slug ?? null,
    });
  } catch (err) {
    console.error("meeting-import/confirm error:", err);
    const message = err instanceof Error ? err.message : "予期しないエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
