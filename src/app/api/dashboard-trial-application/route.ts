// 意思決定支援ダッシュボードの試用申請フォームAPI
// お問い合わせページの申請フォームから送られた内容を、そのままNotionのContactInquiry
// データソースに1件記録する。AIによる自動応答は行わず、必ず担当者確認(canAnswer:false)
// 扱いとして記録する。
import { NextRequest, NextResponse } from "next/server";
import { logContactInquiry } from "@/lib/notion";

export const runtime = "nodejs";

type DashboardTrialApplicationBody = {
  areaName: string; // 島・地域の名前
  organization: string; // 運営している団体
  contactName: string; // 担当者の名前
  contactEmail: string; // 担当者の連絡先(メールアドレス)
  topic: string; // 今悩んでいる意思決定の論点
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<DashboardTrialApplicationBody>;
    const { areaName, organization, contactName, contactEmail, topic } = body;

    if (
      !isNonEmptyString(areaName) ||
      !isNonEmptyString(organization) ||
      !isNonEmptyString(contactName) ||
      !isNonEmptyString(contactEmail) ||
      !isNonEmptyString(topic)
    ) {
      return NextResponse.json(
        { error: "すべての項目の入力が必要です" },
        { status: 400 }
      );
    }

    const summary = [
      `【島・地域の名前】${areaName}`,
      `【運営している団体】${organization}`,
      `【担当者名】${contactName}`,
      `【連絡先】${contactEmail}`,
      "",
      "【今悩んでいる意思決定の論点】",
      topic,
    ].join("\n");

    await logContactInquiry({
      title: `意思決定支援ダッシュボード試用申請｜${areaName}`,
      inquiryType: "ダッシュボード試用申請",
      summary,
      canAnswer: false,
      escalationReason: "試用希望の申請。専用ページ・パスワードの準備要否を確認する",
      assigneeHint: "ダッシュボード担当",
      contactEmail,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("dashboard-trial-application error:", err);
    return NextResponse.json(
      { error: "送信中にエラーが発生しました。時間をおいて再度お試しください。" },
      { status: 500 }
    );
  }
}
