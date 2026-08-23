// 「しまのみんな会議」形式(カード選択)の意見投稿API。
// 自由記述の/api/tenant/[slug]/opinionとは別に、選ばれたカードを
// 生成AIで自然な一文にまとめたうえでPositionRecordに記録する。

import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getTenantConfig } from "@/lib/tenants";
import { submitOpinion } from "@/lib/notion";
import { tenantCacheTag } from "@/lib/tenantDashboard";
import { getOpinionCardById } from "@/lib/opinionCards";
import { summarizeOpinionCard } from "@/lib/llm/summarizeOpinion";

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

  const body = (await req.json().catch(() => ({}))) as { cardId?: string; comment?: string };
  if (!body.cardId) {
    return NextResponse.json({ error: "カードを選んでください" }, { status: 400 });
  }

  const card = getOpinionCardById(slug, body.cardId);
  if (!card) {
    return NextResponse.json({ error: "カードが見つかりません" }, { status: 400 });
  }

  const comment = (body.comment ?? "").slice(0, 300);

  let content: string;
  try {
    const summary = await summarizeOpinionCard({
      issueTitle: tenant.issueTitle ?? "この論点",
      cardTitle: card.title,
      cardDescription: card.description,
      comment,
    });
    content = summary.content;
  } catch (err) {
    console.error("意見カードの要約に失敗しました。カードの内容をそのまま記録します:", err);
    content = comment ? `${card.description}(補足: ${comment})` : card.description;
  }

  try {
    await submitOpinion(tenant.issuePageId, tenant.positionRecordDataSourceId, {
      stance: card.stance,
      content,
    });
  } catch (err) {
    console.error("意見カードの記録に失敗しました:", err);
    return NextResponse.json({ error: "送信に失敗しました。時間をおいて再度お試しください。" }, { status: 500 });
  }

  revalidateTag(tenantCacheTag(slug), "max");

  return NextResponse.json({ ok: true, content });
}
