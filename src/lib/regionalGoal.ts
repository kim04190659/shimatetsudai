// 分室(島)ごとの「地域ウェルビーイング目標」を管理するファイル。
//
// crossInsights.ts が「論点同士のつながり」を横に見せるものだとすると、
// こちらは「その論点が、島全体として何を目指すために存在するのか」という
// 縦の軸(共通ゴール)を1つ置くためのもの。
//
// ⚠️ ここに書かれるゴールは、あくまで生成AIが既存の論点・データ・
//   自治体トップの公開発言などから逆算して作った「仮案」であり、
//   自治体・商工会・観光協会・住民が実際に合意したものではない。
//   ページ上には必ず「AIによる仮案・要検証」であることを明記すること。
//   実際に島の関係者との対話を経て言葉が磨かれたら、このファイルを更新する。

export type IssueAlignment = {
  /** branches.ts / shoukoukai.ts / kankoukyoukai.ts に登録されている論点タイトルと一致させる */
  issueTitle: string;
  org: "自治体" | "商工会" | "観光協会";
  orgIcon: string;
  /** この論点が、地域ウェルビーイング目標にどう追い風になるか */
  contribution: string;
  /** この論点が、進め方次第で目標を損なうリスク(あれば) */
  risk?: string;
};

export type RegionalGoal = {
  slug: string;
  /** AIによる仮案の一文ゴール */
  statement: string;
  /** このゴールをどう作ったかの説明 */
  note: string;
  sourceLabel?: string;
  sourceUrl?: string;
  /** 直接測れないゴールを、既存データで追いかけるための代理指標 */
  proxyIndicators: string[];
  issueAlignments: IssueAlignment[];
};

export const regionalGoals: RegionalGoal[] = [
  {
    slug: "yakushima",
    statement:
      "屋久島の魅力は、つくるものではなく築くもの。1000年先も、この島の営みを次の世代へ手渡していく。",
    note:
      "屋久島町長・荒木耕治氏の2026年度施政方針での「魅力とはつくるものではなく築くものである」「すでに存在する営みの価値を…次世代へ確実に継承していく」という発言をもとに、自治体・商工会・観光協会それぞれの論点を横断して整理するために作成した、生成AIによる仮案です。実際に自治体・商工会・観光協会・住民の合意を得たものではありません。",
    sourceLabel: "屋久島町長 2026年度施政方針(屋久島ポスト)",
    sourceUrl: "https://yakushima-post.com/archives/35385",
    proxyIndicators: [
      "島内で経済的に自立できる若年層の割合",
      "Uターン・Iターン後の定住継続率",
      "森林・水源・世界自然遺産の保全状態",
      "災害時の生活・物流の復旧力",
      "高齢者や支援が必要な人が置き去りにされない仕組みの有無",
    ],
    issueAlignments: [
      {
        issueTitle: "空港滑走路延伸",
        org: "自治体",
        orgIcon: "🏛️",
        contribution: "観光需要を受け止め、地域の稼ぐ力や雇用機会を広げる可能性がある",
        risk: "受け入れが急激に進むと、自然環境の保全や地域経済の担い手構造が崩れるリスクがある",
      },
      {
        issueTitle: "航路の持続可能性",
        org: "自治体",
        orgIcon: "🏛️",
        contribution: "物流・医療アクセスなど、暮らしそのものが次の世代まで続く土台を支える",
        risk: "収支改善を急ぐと、住民の生活コストに跳ね返るリスクがある",
      },
      {
        issueTitle: "自然災害（台風等）への事業継続力（BCP）強化",
        org: "商工会",
        orgIcon: "🏢",
        contribution: "経済活動の継続力を高め、次の世代が『働き続けられる』基盤を守る",
      },
      {
        issueTitle: "外資・新規事業者の無秩序な参入への対応力強化",
        org: "観光協会",
        orgIcon: "🏝️",
        contribution: "水源・森林など、次の世代に引き継ぐべき資源を守るルールづくりにつながる",
        risk: "過度に規制すると、屋久島に惹かれてやって来る新しい担い手を遠ざけるリスクもある",
      },
    ],
  },
];

export const getRegionalGoalBySlug = (slug: string) =>
  regionalGoals.find((g) => g.slug === slug);
