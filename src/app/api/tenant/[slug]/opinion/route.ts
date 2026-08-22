// 分室ページの「意見を届ける」フォーム用API。パスワードなしで誰でも投稿できる
// (ダッシュボード閲覧は非公開でも、意見収集は住民に開かれているべきという方針のため)。
// テナントにpositionRecordDataSourceId・issuePageIdが設定されていない場合は404にする。

import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getTenantConfig } from "@/lib/tenants";
import { submitOpinion, type OpinionInput } from "@/lib/notion";
import { tenantCacheTag } from "@/lib/tenantDashboard";

export const runtime = "nodejs";

const VALID_STANCES: OpinionInput["stance"][] = ["賛成", "反対", "条件付き賛成", "保留"];

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const { slug } = await props.params;
  const tenant = getTenantConfig(slug);

  if (!tenant) {
    return NextResponse.json({ error: "見つかりません" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as { stance?: string; content?: string };

  if (!body.content || body.content.trim().length === 0) {
    return NextResponse.json({ error: "意見の内容を入力してください" }, { status: 400 });
  }
  if (body.content.length > 2000) {
    return NextResponse.json({ error: "内容が長すぎます(2000文字以内)" }, { status: 400 });
  }
  const stance = VALID_STANCES.includes(body.stance as OpinionInput["stance"])
    ? (body.stance as OpinionInput["stance"])
    : "保留";

  try {
    await submitOpinion(tenant.issuePageId, tenant.positionRecordDataSourceId, {
      stance,
      content: body.content.trim(),
    });
  } catch (err) {
    console.error("意見投稿の記録に失敗しました:", err);
    return NextResponse.json({ error: "送信に失敗しました。時間をおいて再度お試しください。" }, { status: 500 });
  }

  // ダッシュボードを見ている人がいれば、次の更新ボタンで新しい意見も反映されるようにする
  revalidateTag(tenantCacheTag(slug), "max");

  return NextResponse.json({ ok: true });
}
