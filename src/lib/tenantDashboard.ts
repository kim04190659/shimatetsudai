// 複数団体対応(マルチテナント化)版のダッシュボードデータ取得+LLM生成。
// ritokeiDashboard.ts と処理内容は同じだが、キャッシュタグをテナント(slug)ごとに
// 分けることで、団体Aの更新ボタンが団体Bのキャッシュを巻き込んで再生成させることがない。

import { unstable_cache } from "next/cache";
import { getIssueDashboardData, type RitokeiPositionRecord } from "./notion";
import { summarizeIssueWithFallback } from "./llm";
import type { TenantConfig } from "./tenants";

export type TenantDashboardResult = {
  issueTitle: string;
  positionRecords: RitokeiPositionRecord[];
  generatedDraft: string;
  generatedProvider: string;
  generatedModel: string;
  generatedAt: string;
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

  return {
    issueTitle: data.issueTitle,
    positionRecords: data.positionRecords,
    generatedDraft: summary.draft,
    generatedProvider: summary.provider,
    generatedModel: summary.model,
    generatedAt: new Date().toISOString(),
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
