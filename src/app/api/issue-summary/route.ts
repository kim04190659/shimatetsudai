// 論点(Issue)の要約下書き(A3意思決定支援シートの元になるテキスト)を生成するAPI。
// 使うLLMは src/lib/llm/index.ts の SUMMARY_LLM_PROVIDER 環境変数で切り替わる。
// レスポンスに provider/model を含めているので、Tanuki等を試したときに
// 「今回はどのモデルの出力か」を画面や記録で確認できる。

import { NextRequest, NextResponse } from "next/server";
import { summarizeIssueWithFallback } from "@/lib/llm";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { issueTitle, sourceNotes, relatedIndicators, provider } = body ?? {};

    if (typeof issueTitle !== "string" || typeof sourceNotes !== "string") {
      return NextResponse.json(
        { error: "issueTitle と sourceNotes は必須です(いずれも文字列)" },
        { status: 400 }
      );
    }

    const result = await summarizeIssueWithFallback(
      {
        issueTitle,
        sourceNotes,
        relatedIndicators: Array.isArray(relatedIndicators) ? relatedIndicators : undefined,
      },
      typeof provider === "string" ? provider : undefined
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("issue-summary error:", err);
    return NextResponse.json({ error: "要約の生成に失敗しました" }, { status: 502 });
  }
}
