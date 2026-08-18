// 観光協会ごとの「分室」ページのデータ。
// 商工会向けの kankoukyoukai.ts (src/lib/shoukoukai.ts) と同じ考え方で、
// 観光協会という「地域の観光事業者が集まる協議会」単位のページを管理する。
//
// しまてつだい分室の8DB合意形成プラットフォーム(Stakeholder/Issue/PositionRecordなど)を
// 流用し、対象を「住民」から「観光協会の会員事業者・職員」に置き換えて運用する想定。
// 実データはNotion側で管理し、このファイルは公開用のまとめとして手動で反映する。
//
// ⚠️ 2026-08-18時点では、掲載している観光協会との連携はまだ合意していない検討段階。
//   実際に合意・活動が始まっていない論点(Issue)を、ここに憶測で書き足さないこと。

/** 観光協会分室と、まだ連携の合意が取れていない検討段階の観光協会を区別する状態 */
export type KankoukyoukaiStatus = "準備中" | "活動中";

export type KankoukyoukaiIssue = {
  title: string;
  status: "議論中" | "合意形成中" | "合意済み" | "提起" | "保留";
  summary: string;
  dashboardUrl?: string;
  dashboardLabel?: string;
  /** しまのみんな会議(カードゲーム)で、この論点について意見を出し合えるページ */
  cardGameUrl?: string;
  cardGameLabel?: string;
};

export type KankoukyoukaiStat = { label: string; value: string };

/** この観光協会の会員事業者・職員が日常的に使える入口ツール(てつだって拡張版など) */
export type KankoukyoukaiTool = {
  name: string;
  description: string;
  url: string;
};

export type KankoukyoukaiBranch = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  status: KankoukyoukaiStatus;
  stats: KankoukyoukaiStat[];
  tools: KankoukyoukaiTool[];
  issues: KankoukyoukaiIssue[];
};

export const kankoukyoukaiBranches: KankoukyoukaiBranch[] = [
  {
    slug: "yakushima",
    name: "屋久島観光協会",
    tagline: "鹿児島県熊毛郡屋久島町(一般社団法人屋久島観光協会)",
    description:
      "世界自然遺産・屋久島の観光事業者(宿泊・ガイド・飲食・物産など)が加盟する一般社団法人です。事務局は屋久島町安房。以前の任意団体「屋久島観光協会」を経て一般社団法人として再編されています(法人番号はgBizINFO上で別番号として確認)。しまてつだい分室が屋久島町ですでに進めている自治体向け・商工会向けの取り組みを土台に、観光事業者向け意思決定支援を検討しているパイロット候補です。",
    status: "準備中",
    stats: [
      { label: "法人形態", value: "一般社団法人(以前は任意団体。再編の経緯・時期は要確認)" },
      { label: "事務局所在地", value: "鹿児島県熊毛郡屋久島町安房187番地1" },
      { label: "主な事業", value: "観光事業の振興、自然環境・伝統文化の保全と両立した観光振興(要確認: 会員数・職員数)" },
      { label: "連携状況", value: "検討段階(2026年8月時点。観光協会側との正式な合意はまだ)" },
    ],
    tools: [],
    issues: [],
  },
];

export const getKankoukyoukaiBySlug = (slug: string) =>
  kankoukyoukaiBranches.find((b) => b.slug === slug);
