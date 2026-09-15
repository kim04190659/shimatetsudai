// 「テーマ」一覧ページ(/themes)用のデータ。
//
// 従来の「分室一覧」(/branches)は自治体・団体という“地域の窓口”単位で
// 論点をまとめていたが、鯨本さん(離島経済新聞社)からの依頼で、
// 「未来のシマ共創会議2026」のテーマオーナー案件を中心に、
// “テーマ”単位でフラットに並べるページを新設した(2026-09-15)。
//
// 同じコミュニティから複数のテーマが出てくることも今後想定されるため、
// 分室(地域単位)ではなく「テーマ」という言葉に統一している。
//
// 掲載内容は src/lib/branches.ts に登録済みの実データ(りとけい分室・屋久島町分室)と
// 完全に同じもの(タイトル・要約・ダッシュボードURL等)を、このページ用に
// 掲載順を指定して並べ直したもの。branches.ts 側のデータは変更していない。

export type Theme = {
  title: string;
  status: "議論中" | "合意形成中" | "合意済み" | "提起" | "保留";
  summary: string;
  dashboardUrl?: string;
  dashboardLabel?: string;
  cardGameUrl?: string;
  cardGameLabel?: string;
  /** このテーマの出どころ(分室名)。カードの小さなラベルとして表示する */
  sourceBranch: string;
};

export const themes: Theme[] = [
  {
    title: "家島(兵庫)「空き家サブリース×離島留学モデル」をどう広げるか",
    status: "提起",
    summary:
      "りとけい主催「未来のシマ共創会議2026」のテーマオーナー案件です。家島(兵庫県姫路市)で、一般社団法人はりまのいばしょ／いえしまコンシェルジュ株式会社(中西和也さん)が、空き家のサブリース収益で自走できる「離島留学モデル」を提起。補助金に頼らず、島の空き家と都市部の少人数教育ニーズを掛け合わせる仕組みを検討しています。",
    dashboardUrl: "/case-studies/ieshima-ryugaku-model-dss.html",
    dashboardLabel: "意思決定支援ダッシュボードを見る",
    cardGameUrl: "https://shimatetsudai-issue-cardgame.vercel.app/games/issue-ritokei-ieshima-ryugaku/cards",
    cardGameLabel: "しまのみんな会議で意見を出す",
    sourceBranch: "りとけい分室",
  },
  {
    title: "高島(長崎)「生活航路を守りながら関係人口で来島を持続させる」には？",
    status: "提起",
    summary:
      "りとけい主催「未来のシマ共創会議2026」のテーマオーナー案件です。高島(長崎県長崎市・人口215人)で、長崎市地域おこし協力隊の池田美和子さんが提起。年間約2.4億円の赤字が生じている生活航路を、補助金だけに頼らず「関係人口1,000人」で支える仕組みを検討しています。",
    dashboardUrl: "/case-studies/takashima-kankeijinko-dss.html",
    dashboardLabel: "意思決定支援ダッシュボードを見る",
    cardGameUrl: "https://shimatetsudai-issue-cardgame.vercel.app/games/issue-ritokei-takashima-kankeijinko/cards",
    cardGameLabel: "しまのみんな会議で意見を出す",
    sourceBranch: "りとけい分室",
  },
  {
    title: "祝島(山口)「部活動の場を島で自給する」には？",
    status: "提起",
    summary:
      "りとけい主催「未来のシマ共創会議2026」のテーマオーナー案件です。祝島(山口県上関町・人口約250人)で、祝島有志の会の秋山鈴明さんが提起。中学進学時の「教育流出」を防ぐため、島の中で部活動を「自給」する仕組みを検討しています。",
    dashboardUrl: "/case-studies/iwaishima-bukatsu-jikyu-dss.html",
    dashboardLabel: "意思決定支援ダッシュボードを見る",
    cardGameUrl: "https://shimatetsudai-issue-cardgame.vercel.app/games/issue-ritokei-iwaishima-bukatsu/cards",
    cardGameLabel: "しまのみんな会議で意見を出す",
    sourceBranch: "りとけい分室",
  },
  {
    title: "小値賀島(長崎)「島をまるごと子どもの居場所にする受け入れチーム」とは？",
    status: "提起",
    summary:
      "りとけい主催「未来のシマ共創会議2026」のテーマオーナー案件です。小値賀島(長崎県小値賀町)で、小値賀町教育委員会「ちかまる寮」の牧尾儀信さんが提起。7年間続けてきた「ふるさと留学制度」を、寮・学校・地域が一体となった受け入れチームへと発展させる仕組みを検討しています。",
    dashboardUrl: "/case-studies/ojika-ukeire-team-dss.html",
    dashboardLabel: "意思決定支援ダッシュボードを見る",
    cardGameUrl: "https://shimatetsudai-issue-cardgame.vercel.app/games/issue-ritokei-ojika-ukeirechim/cards",
    cardGameLabel: "しまのみんな会議で意見を出す",
    sourceBranch: "りとけい分室",
  },
  {
    title: "佐合島(山口)「電気・水の維持コストを下げつつ災害に強いインフラを自給する」には？",
    status: "提起",
    summary:
      "りとけい主催「未来のシマ共創会議2026」のテーマオーナー案件です。佐合島(山口県平生町・人口5人)で、「人口5人の島から未来をつくる会」の梅本将輝さんが提起。人口減少で跳ね上がるインフラ維持コストを、井戸の自家浄水や太陽光・蓄電池の複線化で「フェーズフリー」に自給する仕組みを検討しています。",
    dashboardUrl: "/case-studies/sago-infra-jikyu-dss.html",
    dashboardLabel: "意思決定支援ダッシュボードを見る",
    cardGameUrl: "https://shimatetsudai-issue-cardgame.vercel.app/games/issue-ritokei-sago-infra/cards",
    cardGameLabel: "しまのみんな会議で意見を出す",
    sourceBranch: "りとけい分室",
  },
  {
    title: "特別テーマ「大規模災害時に必要な機能を官民連携で備える、生きた防災施設」とは？",
    status: "提起",
    summary:
      "りとけい主催「未来のシマ共創会議2026」の特別テーマです。大和リース株式会社(民間活力研究所)と、りとけいが共同で提起。老朽化する防災施設と国の交付金要件のミスマッチを、官民連携で解消する「生きた防災施設」のあり方を検討しています。",
    dashboardUrl: "/case-studies/bousai-kanminrenkei-dss.html",
    dashboardLabel: "意思決定支援ダッシュボードを見る",
    cardGameUrl: "https://shimatetsudai-issue-cardgame.vercel.app/games/issue-ritokei-bousai-kanminrenkei/cards",
    cardGameLabel: "しまのみんな会議で意見を出す",
    sourceBranch: "りとけい分室",
  },
  {
    title: "屋久島(鹿児島)「地域主体で航路を支える新モデル」(未来のシマ共創会議2026 テーマオーナー)",
    status: "提起",
    summary:
      "りとけい主催「未来のシマ共創会議2026」のテーマオーナー案件の一つ。電源喪失によるフェリー漂流事故をきっかけに、老朽船更新(約100億円規模)への対応が急務に。屋久島観光協会 荒木会長が「地域主体の運航モデル構築」を論点として提起しました。",
    dashboardUrl: "/case-studies/yakushima-route-model-dss.html",
    dashboardLabel: "意思決定支援ダッシュボードを見る",
    cardGameUrl: "https://shimatetsudai-issue-cardgame.vercel.app/games/issue-yakushima-route-model/cards",
    cardGameLabel: "しまのみんな会議で意見を出す",
    sourceBranch: "屋久島町分室",
  },
  {
    title: "入域料の「使途限定」問題を世界の事例からどう解くか(屋久島観光協会 提起)",
    status: "議論中",
    summary:
      "縄文杉に「特定自然観光資源」を指定すると、入域料の使途がその区域内に限定される懸念があります。屋久島は既に年間約6,000万円の任意協力金を条例で集めており、この既存モデルとの両立をどう設計するかが論点です。屋久島観光協会 荒木会長が提起し、米国NPS・ケニアKWS・コスタリカSINACなど世界7カ国8事例を整理しました。",
    dashboardUrl: "/case-studies/yakushima-nyuikiryo-earmarking-dss.html",
    dashboardLabel: "意思決定支援ダッシュボードを見る",
    cardGameUrl: "https://shimatetsudai-issue-cardgame.vercel.app/games/issue-yakushima-nyuikiryo-earmarking/cards",
    cardGameLabel: "しまのみんな会議で意見を出す",
    sourceBranch: "屋久島町分室",
  },
];
