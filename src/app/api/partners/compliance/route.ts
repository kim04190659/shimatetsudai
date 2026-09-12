// 地域創生HDパートナーズ「コンプライアンス・ナレッジ」機能の一覧取得API。
// CR「コンプライアンス・ナレッジ機能の追加」(林さん提案、2026-09-10対応)。
// 本部から代理店へ、法令・営業ルール・苦情対応事例・FAQを正式に還元する読み取り専用の機能。
// Notionの「📚 コンプライアンス・ナレッジ（地域創生HDパートナーズ）」DBから
// Status=公開の行だけを返す(認証なし・公開情報のみ)。
import { NextResponse } from "next/server";
import { getPublishedComplianceKnowledge } from "@/lib/notion";

export const runtime = "nodejs";

export async function GET() {
  try {
    const items = await getPublishedComplianceKnowledge();
    return NextResponse.json({ items });
  } catch (err) {
    console.error("partners/compliance error:", err);
    return NextResponse.json(
      { error: "コンプライアンス・ナレッジの取得に失敗しました" },
      { status: 502 }
    );
  }
}
