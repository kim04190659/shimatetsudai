// 商工会ごとの「分室」ページのデータ。
// 自治体向けの branches.ts (src/lib/branches.ts) と同じ考え方で、
// 商工会という「地域の中小企業が集まる協議会」単位のページを管理する。
//
// しまてつだい分室の8DB合意形成プラットフォーム(Stakeholder/Issue/PositionRecordなど)を
// 流用し、対象を「住民」から「会員事業者の経営者」に置き換えて運用する想定。
// 実データはNotion側で管理し、このファイルは公開用のまとめとして手動で反映する。
//
// ⚠️ 2026-08-18時点では、掲載している商工会との連携はまだ合意していない検討段階。
//   実際に合意・活動が始まっていない論点(Issue)を、ここに憶測で書き足さないこと。

/** 商工会分室と、まだ連携の合意が取れていない検討段階の商工会を区別する状態 */
export type ShoukoukaiStatus = "準備中" | "活動中";

export type ShoukoukaiIssue = {
  title: string;
  status: "議論中" | "合意形成中" | "合意済み" | "提起" | "保留";
  summary: string;
  dashboardUrl?: string;
  dashboardLabel?: string;
  /** しまのみんな会議(カードゲーム)で、この論点について意見を出し合えるページ */
  cardGameUrl?: string;
  cardGameLabel?: string;
  /** カードゲームの代わりに、分室ページ内蔵の簡易フォームで意見を集める場合のテナントslug */
  opinionTenantSlug?: string;
};

export type ShoukoukaiStat = { label: string; value: string };

/** この商工会の会員事業者が日常的に使える入口ツール(てつだって拡張版など) */
export type ShoukoukaiTool = {
  name: string;
  description: string;
  url: string;
};

export type ShoukoukaiBranch = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  status: ShoukoukaiStatus;
  stats: ShoukoukaiStat[];
  tools: ShoukoukaiTool[];
  issues: ShoukoukaiIssue[];
};

export const shoukoukaiBranches: ShoukoukaiBranch[] = [
  {
    slug: "yakushima",
    name: "屋久島町商工会",
    tagline: "鹿児島県熊毛郡屋久島町",
    description:
      "宮之浦本所(旧上屋久町エリア)と安房支所(旧屋久島町エリア)の2拠点で、地域事業者の経営改善普及事業(記帳指導・経営相談など)を行う商工会です。しまてつだい分室が屋久島町ですでに進めている自治体向けの取り組みを土台に、会員事業者の経営者向け意思決定支援を検討しているパイロット候補です。",
    status: "準備中",
    stats: [
      { label: "会員事業者数", value: "約490社(地域事業者782社中、2021年度時点)" },
      { label: "拠点", value: "宮之浦本所・安房支所の2拠点" },
      { label: "主な事業", value: "経営改善普及事業(記帳指導・経営相談など)" },
      { label: "連携状況", value: "検討段階(2026年8月時点。商工会側との正式な合意はまだ)" },
    ],
    tools: [],
    issues: [
      {
        title: "自然災害（台風等）への事業継続力（BCP）強化",
        status: "提起",
        summary:
          "屋久島町商工会と屋久島町が共同で策定した「事業継続力強化支援計画」(令和6〜9年度)と、令和8年(2026年)台風6号の実際の対応事例にもとづく論点です。しまてつだいとして直接ヒアリングして確認した内容ではなく、Notion上のステータスは「提起」のままです。",
        dashboardUrl: "/case-studies/yakushima-shokokai-bcp-dss.html",
        dashboardLabel: "意思決定支援ダッシュボードを見る",
        cardGameUrl: "https://shimatetsudai-issue-cardgame.vercel.app/games/issue-yakushima-shokokai-bcp/cards",
        cardGameLabel: "しまのみんな会議で意見を出す",
      },
      {
        title: "商工会加盟の商業施設の収益不足・閉鎖リスクに、どう対応するか",
        status: "議論中",
        summary:
          "サイトのダッシュボード試用申請フォームから、商工会加盟の商業施設の経営者より「利益が足りず、閉鎖に追い込まれている」という問題提起が届いたことをきっかけに立ち上がった論点です。既存の公的支援制度(経営発達支援計画・小規模事業者持続化補助金等)の活用促進を軸に検討しています。",
        dashboardUrl: "/dashboard/yakushima-shoukoukai",
        dashboardLabel: "意思決定支援ダッシュボードを見る(要パスワード)",
        opinionTenantSlug: "yakushima-shoukoukai",
      },
    ],
  },
];

import { getActiveTenants, type TenantConfig } from "./tenants";

/** branches.tsのsynthesizeBranchFromTenant()と同じ考え方。publicKind==="shoukoukai"のテナントのみ対象 */
function synthesizeShoukoukaiFromTenant(tenant: TenantConfig): ShoukoukaiBranch | null {
  if (!tenant.publicName) return null;

  return {
    slug: tenant.slug,
    name: tenant.publicName,
    tagline: tenant.publicTagline ?? "",
    description: tenant.publicDescription ?? "",
    status: "活動中",
    stats: [],
    tools: [],
    issues: [
      {
        title: tenant.issueTitle ?? "意思決定支援",
        status: tenant.issueStatus ?? "議論中",
        summary: tenant.issueSummary ?? "",
        dashboardUrl: `/dashboard/${tenant.slug}`,
        dashboardLabel: "意思決定支援ダッシュボードを見る(要パスワード)",
        opinionTenantSlug: tenant.positionRecordDataSourceId ? tenant.slug : undefined,
      },
    ],
  };
}

/** ハードコードされたshoukoukaiBranches配列 + TENANTS_CONFIG由来の簡易分室、を合わせた一覧を返す */
export function getAllShoukoukaiBranches(): ShoukoukaiBranch[] {
  const tenantBranches = getActiveTenants()
    .filter((t) => t.publicKind === "shoukoukai")
    .filter((t) => !shoukoukaiBranches.some((b) => b.slug === t.slug))
    .map(synthesizeShoukoukaiFromTenant)
    .filter((b): b is ShoukoukaiBranch => b !== null);

  return [...shoukoukaiBranches, ...tenantBranches];
}

export const getShoukoukaiBySlug = (slug: string): ShoukoukaiBranch | undefined => {
  const hardcoded = shoukoukaiBranches.find((b) => b.slug === slug);
  if (hardcoded) return hardcoded;

  const tenant = getActiveTenants().find((t) => t.slug === slug && t.publicKind === "shoukoukai");
  if (!tenant) return undefined;
  return synthesizeShoukoukaiFromTenant(tenant) ?? undefined;
};
