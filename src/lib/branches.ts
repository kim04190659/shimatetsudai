// 自治体ごとの「分室」ページのデータ。
// 拠点スタッフ(20〜40代女性)が、その自治体の住民・首長・議会と話しながら
// 論点(Issue)を1つずつ登録していく想定。実データはNotionの合意形成プラットフォーム
// (自治体ごとに複製したStakeholder/Issue/PositionRecordなど8DB)で管理し、
// このページは公開用のまとめとして手動で反映する。

export type BranchIssue = {
  title: string;
  status: "議論中" | "合意形成中" | "合意済み" | "提起" | "保留";
  summary: string;
  dashboardUrl?: string;
  dashboardLabel?: string;
  /** しまのみんな会議(カードゲーム)で、この論点について意見を出し合えるページ */
  cardGameUrl?: string;
  cardGameLabel?: string;
  /** 過去バージョンの意思決定支援ダッシュボードなど、参考として残しておきたいリンク */
  pastDashboards?: { url: string; label: string }[];
  /**
   * カードゲームの代わりに、このページ内蔵の簡易フォームで意見を集める場合のテナントslug。
   * /api/tenant/[slug]/opinion にPOSTする。cardGameUrlと共存可(両方出す)。
   */
  opinionTenantSlug?: string;
};

export type BranchStat = { label: string; value: string };

/** この分室の住民が日常的に使える入口ツール(てつだって拡張版など) */
export type BranchTool = {
  name: string;
  description: string;
  url: string;
};

export type Branch = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  stats: BranchStat[];
  tools: BranchTool[];
  issues: BranchIssue[];
};

export const branches: Branch[] = [
  {
    slug: "ritokei",
    name: "りとけい分室",
    tagline: "認定NPO法人 離島経済新聞社(リトケイ)",
    description:
      "国内約420の有人離島(人口約100万人)を対象に、ウェブマガジン『離島経済新聞』とタブロイド紙『季刊リトケイ』を運営する認定NPO法人の分室です。この分室は、屋久島町や渡名喜村など個別の島ではなく、それらの島々を取材・発信で支える「もう一つの島」として見立てています。限られた人員・予算の中で、どの取材・支援を優先するかを一緒に考えています。",
    stats: [
      { label: "対象範囲", value: "国内約420の有人離島、人口約100万人" },
      { label: "団体形態", value: "認定NPO法人(2025年2月認定)" },
      { label: "活動エリア", value: "東西南北約3,000kmの海洋エリア" },
      { label: "主な事業", value: "メディア運営・連携交流・魅力化促進・災害復興の4事業" },
    ],
    tools: [
      {
        name: "てつだって拡張版",
        description:
          "NPOスタッフ・会員のみなさんも、しまのみんな会議で意見が欲しい論点があるときはホーム画面にお知らせが届きます。",
        url: "https://shimatetsudai-tetsudatte.vercel.app",
      },
    ],
    issues: [
      {
        title: "420島への限られた取材・支援リソース配分",
        status: "議論中",
        summary:
          "寄せられる取材・支援の依頼すべてには対応しきれない中で、どの業務を効率化・共同化し、どの業務を人にしかできない業務として残すべきかを検討しています。",
        dashboardUrl: "/case-studies/ritokei-resource-dss",
        dashboardLabel: "意思決定支援ダッシュボードを見る(ライブ版・国産LLM)",
        pastDashboards: [
          { url: "/case-studies/ritokei-resource-dss-v7.html", label: "v7(静的版・国産LLM実証)を見る" },
          { url: "/case-studies/ritokei-resource-dss-v6.html", label: "v6(静的版)を見る" },
          { url: "/case-studies/ritokei-resource-dss.html", label: "初期版を見る" },
        ],
        cardGameUrl: "https://shimatetsudai-issue-cardgame.vercel.app/games/issue-ritokei-resource/cards",
        cardGameLabel: "しまのみんな会議で意見を出す",
      },
    ],
  },
  {
    slug: "yakushima",
    name: "屋久島町分室",
    tagline: "鹿児島県熊毛郡屋久島町",
    description:
      "人口約1万700人(2025年国勢調査速報値)、高齢化率38.4%(2025年)と、人口減少・少子高齢化が続く屋久島町の分室です。空港滑走路延伸や航路の持続可能性など、観光と暮らしの両立に関わる論点について、住民・事業者・議会など、いろいろな立場の声を集めながら意思決定を後押ししています。",
    stats: [
      { label: "人口", value: "約10,707人(2025年国勢調査速報値)" },
      { label: "高齢化率", value: "38.4%(2025年)。2024年時点は37.8%" },
      { label: "人口推移", value: "2020年比 約1,151人減。年間200〜250人規模で減少中" },
      { label: "産業", value: "世界自然遺産・屋久杉を軸にした観光業が基幹産業" },
    ],
    tools: [
      {
        name: "てつだって拡張版",
        description:
          "声の聞き取りや写真での一言日記に加え、町で意見が欲しい論点があるときはホーム画面にお知らせが届きます。",
        url: "https://shimatetsudai-tetsudatte.vercel.app",
      },
    ],
    issues: [
      {
        title: "空港滑走路延伸",
        status: "議論中",
        summary:
          "地域経済の発展という目標に向けて、観光事業者・子育て世代・高齢の住民など、さまざまな立場の意見を整理しながら議論を進めています。",
        dashboardUrl: "/case-studies/yakushima-a3.html",
        dashboardLabel: "意思決定支援ダッシュボードを見る",
        cardGameUrl: "https://shimatetsudai-issue-cardgame.vercel.app/games/issue-yakushima-airport/cards",
        cardGameLabel: "しまのみんな会議で意見を出す",
      },
      {
        title: "航路の持続可能性",
        status: "議論中",
        summary:
          "屋久島航路の営業収支比率や資金不足比率などの経営指標と、住民・観光関係者・物流事業者の意見を組み合わせ、短期・中期・長期の施策候補を検討しています。",
        dashboardUrl: "/case-studies/yakushima-route-dss.html",
        dashboardLabel: "意思決定支援ダッシュボードを見る",
      },
      {
        title: "地域主体で航路を支える新モデル(屋久島観光協会 提起)",
        status: "提起",
        summary:
          "電源喪失によるフェリー漂流事故をきっかけに、老朽船更新(約100億円規模)への対応が急務に。屋久島観光協会 荒木会長が、りとけい「島会議2026」で「地域主体の運航モデル構築」を論点として提起しました。共創ワークショップ(9〜10月)を控えた論点整理の段階です。",
        dashboardUrl: "/case-studies/yakushima-route-model-dss.html",
        dashboardLabel: "意思決定支援ダッシュボードを見る",
      },
    ],
  },
  {
    slug: "tonaki",
    name: "渡名喜村分室",
    tagline: "沖縄県島尻郡渡名喜村",
    description:
      "人口約300人台、高齢化率44.1%(2019年)と、限界集落の目安とされる水準に近づきつつある渡名喜村の分室です。役場・住民・移住検討者など、いろいろな立場の声を集めながら、村の行政サービスをどう維持していくかを一緒に考えています。",
    stats: [
      { label: "人口", value: "約317人(2023年1月時点)" },
      { label: "高齢化率", value: "44.1%(2019年)。2035年頃に50%超え見込み" },
      { label: "役場職員", value: "定数27人 → 現員21人 → 退職後14人程度まで減少見込み" },
      { label: "交通", value: "本島とを結ぶのは定期船のみ" },
    ],
    tools: [
      {
        name: "てつだって拡張版",
        description:
          "声の聞き取りや写真での一言日記に加え、村で意見が欲しい論点があるときはホーム画面にお知らせが届きます。",
        url: "https://shimatetsudai-tetsudatte.vercel.app",
      },
    ],
    issues: [
      {
        title: "役場職員不足による行政サービス維持",
        status: "議論中",
        summary:
          "限られた人員で、住民サービスの質を落とさずに行政運営を続けるには、どの業務を効率化・共同化し、どの業務を人にしかできない業務として残すべきかを検討しています。",
        dashboardUrl: "/case-studies/tonaki-staffing-dss.html",
        dashboardLabel: "意思決定支援ダッシュボードを見る",
        cardGameUrl: "https://shimatetsudai-issue-cardgame.vercel.app/games/issue-tonaki-staffing/cards",
        cardGameLabel: "しまのみんな会議で意見を出す",
      },
      {
        title: "保育・幼児教育インフラの空洞化",
        status: "提起",
        summary:
          "2019年度に約8.5億円(ハード交付金)で整備した保育スペース付き施設が6年以上利用ゼロ、村立幼稚園も在籍園児ゼロで実質休園状態にある中、施設整備だけでは解決しない運営モデル・人材確保をどう検討するかを整理しています。",
        dashboardUrl: "/case-studies/tonaki-childcare-dss.html",
        dashboardLabel: "意思決定支援ダッシュボードを見る",
      },
    ],
  },
  {
    slug: "minamo",
    name: "みなも島分室(テスト用の架空の島)",
    tagline: "実証用に作成した架空の島 ｜ 実在する自治体・団体ではありません",
    description:
      "自治体・商工会・観光協会という3つの意思決定機関が、それぞれ別の論点を検討しながらも、共通の目標にどう影響するかを意識して意思決定を進めている様子を、実際に操作して確かめてもらうために作成したテストサイトです。ダッシュボードはパスワード保護、観光協会の論点は実際に意見を送信できます。",
    stats: [
      { label: "位置づけ", value: "実証用の架空の島(実在の自治体・団体ではありません)" },
      { label: "人口(設定)", value: "約4,200人(テスト用の仮設定)" },
      { label: "産業(設定)", value: "観光業・農漁業(テスト用の仮設定)" },
      { label: "共通パスワード", value: "minamo2026(各ダッシュボードで入力して体験できます)" },
    ],
    tools: [
      {
        name: "てつだって拡張版",
        description:
          "声の聞き取りや写真での一言日記に加え、島で意見が欲しい論点があるときはホーム画面にお知らせが届きます。テスト用の架空の島でも、実際にアプリを開いて動きを確認できます。",
        url: "https://shimatetsudai-tetsudatte.vercel.app",
      },
    ],
    issues: [
      {
        title: "空き家を活用した移住・定住の受け入れ体制づくり",
        status: "議論中",
        summary:
          "空き家は複数あるが、所有者の意向確認や仲介の窓口が一本化されておらず、移住希望者に情報が届きにくい状態です。自治体として、相談窓口の一本化や仲介の仕組みづくりを検討しています。",
        dashboardUrl: "/dashboard/minamo-jichitai",
        dashboardLabel: "意思決定支援ダッシュボードを見る(パスワード: minamo2026)",
      },
    ],
  },
];

import { getActiveTenants, type TenantConfig } from "./tenants";

/**
 * TENANTS_CONFIGのテナントを、分室ページ用の簡易Branchに変換する。
 * publicNameが設定されているテナントだけを対象にする(未設定=まだ公開の許諾が取れていない試用段階、という運用)。
 * コード変更・再デプロイなしで、env変数(TENANTS_CONFIG)にpublicNameを足すだけで
 * /branches/[slug] が自動的に表示されるようにするための仕組み。
 */
function synthesizeBranchFromTenant(tenant: TenantConfig): Branch | null {
  if (!tenant.publicName) return null;

  return {
    slug: tenant.slug,
    name: tenant.publicName,
    tagline: tenant.publicTagline ?? "",
    description: tenant.publicDescription ?? "",
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

/** ハードコードされたbranches配列 + TENANTS_CONFIG由来の簡易分室、を合わせた一覧を返す */
export function getAllBranches(): Branch[] {
  const tenantBranches = getActiveTenants()
    .filter((t) => !t.publicKind || t.publicKind === "jichitai")
    .filter((t) => !branches.some((b) => b.slug === t.slug)) // 既存の手作り分室があれば、そちらを優先
    .map(synthesizeBranchFromTenant)
    .filter((b): b is Branch => b !== null);

  return [...branches, ...tenantBranches];
}

export const getBranchBySlug = (slug: string): Branch | undefined => {
  const hardcoded = branches.find((b) => b.slug === slug);
  if (hardcoded) return hardcoded;

  const tenant = getActiveTenants().find((t) => t.slug === slug);
  if (!tenant) return undefined;
  return synthesizeBranchFromTenant(tenant) ?? undefined;
};
