// 有料オプション②「決定した意志から記事作成」用API。
// 決定事項・議論のまとめから、ritokei.com「読者だより」向けの記事下書きを生成する。
// 実際の投稿・掲載は離島経済新聞社側の「読者だより」機能(別途連携予定)で行うため、
// ここでは下書きテキストを返すところまでを担当する。
import { NextRequest, NextResponse } from "next/server";
import { summarizeIssueWithFallback } from "@/lib/llm";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { issueTitle, decisionSummary } = body ?? {};

    if (typeof issueTitle !== "string" || typeof decisionSummary !== "string") {
      return NextResponse.json(
        { error: "issueTitle と decisionSummary は必須です(いずれも文字列)" },
        { status: 400 }
      );
    }

    const result = await summarizeIssueWithFallback({
      issueTitle,
      sourceNotes: decisionSummary,
      mode: "letterDraft",
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("article-draft error:", err);
    return NextResponse.json({ error: "記事下書きの生成に失敗しました" }, { status: 502 });
  }
}
