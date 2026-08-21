// りとけい「420島への限られた取材・支援リソース配分」ライブダッシュボードの
// データ取得+LLM生成をまとめ、Next.jsのキャッシュタグで管理する。
//
// 仕組み:
//   - 通常時はキャッシュされた結果をそのまま返す(Notion/LLMへは毎回アクセスしない)
//   - ダッシュボードの「更新」ボタンが押されると、API側で
//     revalidateTag("ritokei-resource-dashboard") が呼ばれ、次の表示時に
//     このファイルの buildRitokeiDashboard() が再実行され、Notionの最新データと
//     LLMの新しい生成結果に置き換わる

import { unstable_cache } from "next/cache";
import { getRitokeiResourceDashboardData, type RitokeiPositionRecord } from "./notion";
import { summarizeIssueWithFallback } from "./llm";

export type RitokeiDashboardResult = {
  issueTitle: string;
  positionRecords: RitokeiPositionRecord[];
  generatedDraft: string;
  generatedProvider: string;
  generatedModel: string;
  generatedAt: string;
};

async function buildRitokeiDashboard(): Promise<RitokeiDashboardResult> {
  const data = await getRitokeiResourceDashboardData();

  const summary = await summarizeIssueWithFallback({
    issueTitle: data.issueTitle,
    sourceNotes: data.sourceNotesText,
  });

  return {
    issueTitle: data.issueTitle,
    positionRecords: data.positionRecords,
    generatedDraft: summary.draft,
    generatedProvider: summary.provider,
    generatedModel: summary.model,
    generatedAt: new Date().toISOString(),
  };
}

export const RITOKEI_DASHBOARD_CACHE_TAG = "ritokei-resource-dashboard";

export const getCachedRitokeiDashboard = unstable_cache(
  buildRitokeiDashboard,
  [RITOKEI_DASHBOARD_CACHE_TAG],
  { tags: [RITOKEI_DASHBOARD_CACHE_TAG] }
);
