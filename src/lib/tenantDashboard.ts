// 複数団体対応(マルチテナント化)版のダッシュボードデータ取得+LLM生成。
// ritokeiDashboard.ts と処理内容は同じだが、キャッシュタグをテナント(slug)ごとに
// 分けることで、団体Aの更新ボタンが団体Bのキャッシュを巻き込んで再生成させることがない。

import { unstable_cache } from "next/cache";
import {
  getIssueDashboardData,
  getIssueEvidenceRecords,
  getFundingMatches,
  type RitokeiPositionRecord,
  type EvidenceRecord,
  type FundingMatch,
} from "./notion";
import { summarizeIssueWithFallback } from "./llm";
import type { TenantConfig } from "./tenants";

// 全団体共通の「補助金・交付金マッチングDB」のデータソースID(作成手順書に記載のもの)
const COMMON_FUNDING_DATA_SOURCE_ID = "8fd1dbec-9e6a-47a6-a76d-5b4df286d8dd";

export type TenantDashboardResult = {
  issueTitle: string;
  positionRecords: RitokeiPositionRecord[];
  generatedDraft: string;
  generatedProvider: string;
  generatedModel: string;
  generatedAt: string;
  evidenceRecords: EvidenceRecord[];
  fundingMatches: FundingMatch[];
};

export function tenantCacheTag(slug: string): string {
  return `dashboard-${slug}`;
}

async function buildTenantDashboard(tenant: TenantConfig): Promise<TenantDashboardResult> {
  const data = await getIssueDashboardData(tenant.issuePageId, tenant.positionRecordDataSourceId);

  const summary = await summarizeIssueWithFallback({
    issueTitle: data.issueTitle,
    sourceNotes: data.sourceNotesText,
  });

  // 根拠データ・補助金候補は、対応するIDが設定されているテナントだけ取得する
  // (試用段階でまだ8DBを個別に持たないテナントでもエラーにしないための割り切り)
  const [evidenceRecords, fundingMatches] = await Promise.all([
    tenant.evidenceDataSourceId
      ? getIssueEvidenceRecords(tenant.issuePageId, tenant.evidenceDataSourceId).catch((err) => {
          console.error("EvidenceRecord取得に失敗しました:", err);
          return [];
        })
      : Promise.resolve([]),
    tenant.fundingAreaTag
      ? getFundingMatches(COMMON_FUNDING_DATA_SOURCE_ID, tenant.fundingAreaTag).catch((err) => {
          console.error("補助金マッチング取得に失敗しました:", err);
          return [];
        })
      : Promise.resolve([]),
  ]);

  return {
    issueTitle: data.issueTitle,
    positionRecords: data.positionRecords,
    generatedDraft: summary.draft,
    generatedProvider: summary.provider,
    generatedModel: summary.model,
    generatedAt: new Date().toISOString(),
    evidenceRecords,
    fundingMatches,
  };
}

/**
 * テナント(団体)ごとにキャッシュされたダッシュボードデータを取得する。
 * unstable_cacheのキー・タグにslugを含めているため、団体ごとに独立してキャッシュされる。
 */
export function getCachedTenantDashboard(tenant: TenantConfig): Promise<TenantDashboardResult> {
  const cached = unstable_cache(
    () => buildTenantDashboard(tenant),
    [tenantCacheTag(tenant.slug)],
    { tags: [tenantCacheTag(tenant.slug)] }
  );
  return cached();
}
