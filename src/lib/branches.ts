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
    ],
  },
];

export const getBranchBySlug = (slug: string) => branches.find((b) => b.slug === slug);
