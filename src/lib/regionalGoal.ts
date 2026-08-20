// 分室(島)ごとの「地域ウェルビーイング目標」を管理するファイル。
//
// 各機関(自治体・商工会・観光協会)がバラバラに抱えている論点が、
// 島全体として何を目指すために存在するのか、という縦の軸(共通ゴール)を
// 1つ置くためのもの。
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
  /** この論点が動かす指標(GoalIndicator.name と一致させる) */
  relatedIndicators?: string[];
};

/**
 * 「代理指標」ではなく「目標達成のための指標」。
 * 抽象的なゴールを、実際に数字で追いかけられる形に落とし込んだもの。
 * 現状値が未計測・未確認のものは、その旨を正直に書く(数字を捏造しない)。
 */
export type GoalIndicator = {
  name: string;
  /** 現状値。データが無ければ「未計測」等、正直に書く */
  current: string;
  /** 目指す値。AIによる仮の目標値であることが前提 */
  target: string;
  /** 数字の出どころ */
  dataSource: string;
  /** この指標に関係する論点タイトル(branches.ts等のissue.titleと一致) */
  relatedIssueTitles: string[];
};

export type RegionalGoal = {
  slug: string;
  /** AIによる仮案の一文ゴール */
  statement: string;
  /** このゴールをどう作ったかの説明 */
  note: string;
  sourceLabel?: string;
  sourceUrl?: string;
  /** 直接測れないゴールを、実際に数字で追いかけるための指標 */
  goalIndicators: GoalIndicator[];
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
    goalIndicators: [
      {
        name: "人口の社会増減(転入-転出)",
        current: "2020年比 約1,151人減(自然減・社会減の合計。年間200〜250人規模で減少中。社会増減単体の数字は未分離)",
        target: "まず自然減と社会減を分けて把握できる状態にし、2030年までに社会減の鈍化を目指す",
        dataSource: "2025年国勢調査速報値(branches.tsの人口統計)",
        relatedIssueTitles: ["空港滑走路延伸", "航路の持続可能性"],
      },
      {
        name: "屋久島町内での外資・大口による森林・土地取得件数",
        current: "未確認(全国では2006〜2020年で278件・2,376ha。屋久島町単体の件数は町として未把握)",
        target: "まず町内の取得件数・面積を毎年定点観測できる状態にする(件数の増減目標はデータが揃ってから設定)",
        dataSource: "yakushima-kankoukyoukai-gaishi-dss.htmlのStakeholder/PositionRecordより",
        relatedIssueTitles: ["外資・新規事業者の無秩序な参入への対応力強化", "空港滑走路延伸"],
      },
      {
        name: "商工会員のBCP(事業継続計画)策定率",
        current: "未確認(会員490社のうち策定済み事業者数は未集計。管内小規模事業者704社)",
        target: "策定率50%以上",
        dataSource: "yakushima-shokokai-bcp-dss.htmlの会員数データより",
        relatedIssueTitles: ["自然災害（台風等）への事業継続力（BCP）強化", "航路の持続可能性"],
      },
      {
        name: "屋久島航路の資金不足比率",
        current: "137.4%(令和6年度実績)",
        target: "100%未満(黒字化ではなく、まず資金不足の解消)",
        dataSource: "yakushima-route-dss.htmlの経営指標より",
        relatedIssueTitles: ["航路の持続可能性", "自然災害（台風等）への事業継続力（BCP）強化"],
      },
      {
        name: "空港滑走路延伸による年間乗降見込み数と費用便益比(B/C)",
        current: "B/C比 1.8、貨幣換算便益 約250億円、延伸後の年間乗降見込み 約29万人(現行計画時点の試算)",
        target: "実際の乗降実績を毎年計測し、試算との差を検証できる状態にする",
        dataSource: "yakushima-a3.htmlの費用便益分析より",
        relatedIssueTitles: ["空港滑走路延伸"],
      },
    ],
    issueAlignments: [
      {
        issueTitle: "空港滑走路延伸",
        org: "自治体",
        orgIcon: "🏛️",
        contribution: "観光需要を受け止め、地域の稼ぐ力や雇用機会を広げる可能性がある",
        risk: "受け入れが急激に進むと、自然環境の保全や地域経済の担い手構造が崩れるリスクがある",
        relatedIndicators: [
          "人口の社会増減(転入-転出)",
          "屋久島町内での外資・大口による森林・土地取得件数",
          "空港滑走路延伸による年間乗降見込み数と費用便益比(B/C)",
        ],
      },
      {
        issueTitle: "航路の持続可能性",
        org: "自治体",
        orgIcon: "🏛️",
        contribution: "物流・医療アクセスなど、暮らしそのものが次の世代まで続く土台を支える",
        risk: "収支改善を急ぐと、住民の生活コストに跳ね返るリスクがある",
        relatedIndicators: [
          "人口の社会増減(転入-転出)",
          "商工会員のBCP(事業継続計画)策定率",
          "屋久島航路の資金不足比率",
        ],
      },
      {
        issueTitle: "自然災害（台風等）への事業継続力（BCP）強化",
        org: "商工会",
        orgIcon: "🏢",
        contribution: "経済活動の継続力を高め、次の世代が『働き続けられる』基盤を守る",
        relatedIndicators: [
          "商工会員のBCP(事業継続計画)策定率",
          "屋久島航路の資金不足比率",
        ],
      },
      {
        issueTitle: "外資・新規事業者の無秩序な参入への対応力強化",
        org: "観光協会",
        orgIcon: "🏝️",
        contribution: "水源・森林など、次の世代に引き継ぐべき資源を守るルールづくりにつながる",
        risk: "過度に規制すると、屋久島に惹かれてやって来る新しい担い手を遠ざけるリスクもある",
        relatedIndicators: [
          "屋久島町内での外資・大口による森林・土地取得件数",
        ],
      },
    ],
  },
];

export const getRegionalGoalBySlug = (slug: string) =>
  regionalGoals.find((g) => g.slug === slug);
