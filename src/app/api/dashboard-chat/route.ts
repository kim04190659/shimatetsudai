// 「意思決定支援ダッシュボード」の内容について、利用者が質問すると
// AIがダッシュボードの内容にもとづいて回答するAPI。
// 使うLLMは既定では /api/issue-summary と共通(src/lib/llm/index.ts の SUMMARY_LLM_PROVIDER で切り替え)。
// 2026-09-13 鯨本さん(離島経済新聞社)からの依頼で、ダッシュボード左側の質問チャットエリア用に追加。
// 2026-09-23 木村さんの依頼で、右側の質問チャット欄からリクエストごとにLLMを選べるように拡張
// (「意思決定支援ダッシュボード作成エージェント3」の標準機能。さくらのAI Engine経由の国産LLMを含む)。
// 選べる値の一覧は src/lib/llm/index.ts の SELECTABLE_CHAT_PROVIDERS を参照。

import { NextRequest, NextResponse } from "next/server";
import { summarizeIssueWithFallback, SELECTABLE_CHAT_PROVIDERS } from "@/lib/llm";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { issueTitle, dashboardContent, question, provider } = body ?? {};

    if (typeof question !== "string" || question.trim() === "") {
      return NextResponse.json({ error: "question は必須です(文字列)" }, { status: 400 });
    }
    if (typeof dashboardContent !== "string" || dashboardContent.trim() === "") {
      return NextResponse.json(
        { error: "dashboardContent が空です。先にダッシュボードを作成してください" },
        { status: 400 }
      );
    }

    // provider は利用者がダッシュボードのプルダウンで選んだ値。
    // 未知の値(改ざん・古いキャッシュ等)は無視し、既定のプロバイダーにフォールバックさせる
    // (summarizeIssueWithFallback側でも PROVIDERS にない名前は無視される二重の安全策)。
    const isKnownProvider =
      typeof provider === "string" && SELECTABLE_CHAT_PROVIDERS.some((p) => p.id === provider);

    const result = await summarizeIssueWithFallback({
      issueTitle: typeof issueTitle === "string" ? issueTitle : "",
      sourceNotes: dashboardContent,
      question,
      mode: "dashboardChat",
    }, isKnownProvider ? provider : undefined);

    return NextResponse.json(result);
  } catch (err) {
    console.error("dashboard-chat error:", err);
    return NextResponse.json({ error: "回答の生成に失敗しました" }, { status: 502 });
  }
}
