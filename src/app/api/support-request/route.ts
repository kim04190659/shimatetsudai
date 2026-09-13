// 有料オプション用の依頼受付API。
// ①対話支援依頼(住民ヒアリング・座談会の開催をリトケイに依頼)
// ②記事作成依頼(決定事項からの記事下書きを、実際にritokei.com「読者だより」へ
//   掲載してもらうための依頼)
// の両方をここでまとめて受け付け、既存のContactInquiry(お問い合わせ)DBに
// 「その他」区分として記録する。正式なNotionプロパティ(有料オプション種別など)を
// 追加するかどうかは、実際に依頼が来るようになってから検討する想定。
import { NextRequest, NextResponse } from "next/server";
import { logContactInquiry } from "@/lib/notion";

export const runtime = "nodejs";

type SupportRequestBody = {
  kind: "dialogue" | "article";
  branchName: string; // どの分室・テーマからの依頼か
  issueTitle?: string; // 記事作成依頼の場合、元になった論点タイトル
  detail: string; // 依頼内容の詳細(対話支援なら要望、記事作成なら下書き本文)
  contactName: string;
  contactEmail: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

const KIND_LABEL: Record<SupportRequestBody["kind"], string> = {
  dialogue: "対話支援依頼(有料オプション)",
  article: "記事作成依頼(有料オプション・読者だより連携)",
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<SupportRequestBody>;
    const { kind, branchName, issueTitle, detail, contactName, contactEmail } = body;

    if (
      (kind !== "dialogue" && kind !== "article") ||
      !isNonEmptyString(branchName) ||
      !isNonEmptyString(detail) ||
      !isNonEmptyString(contactName) ||
      !isNonEmptyString(contactEmail)
    ) {
      return NextResponse.json({ error: "入力内容を確認してください" }, { status: 400 });
    }

    const label = KIND_LABEL[kind];
    const summary = [
      `【区分】${label}`,
      `【分室・テーマ】${branchName}`,
      issueTitle ? `【論点タイトル】${issueTitle}` : null,
      `【担当者名】${contactName}`,
      `【連絡先】${contactEmail}`,
      "",
      "【依頼内容】",
      detail,
    ]
      .filter(Boolean)
      .join("\n");

    await logContactInquiry({
      title: `${label}｜${branchName}`,
      inquiryType: "その他",
      summary,
      canAnswer: false,
      escalationReason: `${label}の申し込み。担当者からの折り返し連絡が必要`,
      assigneeHint: "有料オプション担当",
      contactEmail,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("support-request error:", err);
    return NextResponse.json(
      { error: "送信中にエラーが発生しました。時間をおいて再度お試しください。" },
      { status: 500 }
    );
  }
}
