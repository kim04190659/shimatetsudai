// 「意思決定支援ダッシュボード」の内容について、利用者が質問すると
// AIがダッシュボードの内容にもとづいて回答するAPI。
// 使うLLMは /api/issue-summary と共通(src/lib/llm/index.ts の SUMMARY_LLM_PROVIDER で切り替え)。
// 2026-09-13 鯨本さん(離島経済新聞社)からの依頼で、ダッシュボード左側の質問チャットエリア用に追加。

import { NextRequest, NextResponse } from "next/server";
import { summarizeIssueWithFallback } from "@/lib/llm";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { issueTitle, dashboardContent, question } = body ?? {};

    if (typeof question !== "string" || question.trim() === "") {
      return NextResponse.json({ error: "question は必須です(文字列)" }, { status: 400 });
    }
    if (typeof dashboardContent !== "string" || dashboardContent.trim() === "") {
      return NextResponse.json(
        { error: "dashboardContent が空です。先にダッシュボードを作成してください" },
        { status: 400 }
      );
    }

    const result = await summarizeIssueWithFallback({
      issueTitle: typeof issueTitle === "string" ? issueTitle : "",
      sourceNotes: dashboardContent,
      question,
      mode: "dashboardChat",
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("dashboard-chat error:", err);
    return NextResponse.json({ error: "回答の生成に失敗しました" }, { status: 502 });
  }
}
