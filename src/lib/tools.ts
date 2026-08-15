import { PARTNER_NAME } from "@/lib/partner";

export type ProcessStep = {
  icon: string;
  title: string;
  description: string;
};

export type CaseStudyStep = {
  title: string;
  description: string;
};

export type CaseStudy = {
  place: string;
  intro: string;
  steps: CaseStudyStep[];
  /** 実際の成果物(A3意思決定支援シートなど)。押すとpublicディレクトリ配下のページが別タブで開く */
  embedUrl?: string;
  embedLabel?: string;
};

export type Tool = {
  slug: string;
  name: string;
  tagline: string;
  emoji: string;
  target: string;
  description: string;
  points: string[];
  /** 現行版が別ドメインで先行稼働している場合の外部リンク(例: てつだって) */
  externalUrl?: string;
  externalLabel?: string;
  /** externalUrlとは別に紹介したい関連リンク(例: てつだって拡張版) */
  additionalLinks?: { url: string; label: string }[];
  /** AIと一緒に進める、循環型のサイクル(意思決定支援など) */
  process?: ProcessStep[];
  /** 具体的な自治体・地域での実例(複数可。2件以上あるときは横に並べて表示) */
  caseStudies?: CaseStudy[];
};

export const tools: Tool[] = [
  {
    slug: "tetsudatte",
    name: "てつだって",
    tagline: "聞こえにくさや、暮らしのちょっとした「困った」に寄り添う",
    emoji: "🤝",
    target: "難聴の方・高齢の方とそのご家族",
    description:
      "「てつだって」は、耳の聞こえに不安がある方や、高齢のご家族を持つ方のための支援ツールです。会話の文字化や、日々のちょっとした困りごとを周りに伝える機能を通じて、離島や地方でも安心して暮らせる社会を目指しています。現在は個人向け支援ツール(現行版)として稼働中で、これに加えて、島全体のことを考えた「てつだって拡張版」の開発も始まっています。拡張版では、声の聞き取りや写真での一言日記に加え、意思決定支援プラットフォームで住民の意見が必要になったときにお知らせが届き、「しまのみんな会議」への参加を後押しする機能も備えています。",
    points: [
      "会話を見える化して、聞き逃しの不安を減らす",
      "家族や支援者とゆるやかにつながる仕組み",
      "難しい操作なしで、誰でも使えるシンプルさ",
      "(拡張版)島の話し合いに、自分の声を届けられる",
    ],
    additionalLinks: [
      {
        url: "https://shimatetsudai-tetsudatte.vercel.app",
        label: "「てつだって拡張版」を使ってみる",
      },
    ],
  },
  {
    slug: "ishikettei",
    name: "意思決定支援",
    tagline: "現場の声とデータで、自治体の「正しい意思決定」を後押しする",
    emoji: "🏛️",
    target: "自治体の首長・議会・地域の意思決定に関わる方",
    description:
      `自治体の意思決定は、データだけでも、現場の声だけでも成り立ちません。本サービスは、${PARTNER_NAME}が地域に根ざした取材・ヒアリングで集める住民や事業者の生の声と、データ分析基盤を組み合わせ、論点や利害関係を整理したうえで、会議にそのまま持ち込める一枚のシート「A3意思決定支援シート」にまとめて提供します。屋久島町をはじめとする島しょ自治体で実証を進めています。`,
    points: [
      "現地取材・ヒアリングで、数字だけでは見えない住民の声を集める",
      "論点や賛成・反対の立場を整理し、対立点を見える化",
      "会議にそのまま持ち込める「A3意思決定支援シート」にまとめる",
    ],
    process: [
      {
        icon: "🎯",
        title: "ゴールを決める",
        description:
          "議論したいテーマについて、関係者と一緒に「何を目指すのか」というゴールを言葉にします。",
      },
      {
        icon: "🧭",
        title: "ステークホルダーを整理する",
        description:
          "テーマに関わる人たちを洗い出し、賛成・反対・保留といった立場や意見のズレをAIと一緒に整理します。",
      },
      {
        icon: "📊",
        title: "データを整える",
        description:
          "議論に必要な統計データや現地取材で集めた声を、AIと一緒に集めて整理します。",
      },
      {
        icon: "📄",
        title: "議論用ペーパーを作る",
        description:
          "ここまでの内容をもとに、会議にそのまま持ち込める意思決定議論用ペーパー(HTML)をAIが作成します。",
      },
      {
        icon: "🔁",
        title: "議論して、また整える",
        description:
          "実際の議論に参加し、出てきた意見や新しいデータをその場で追加。ペーパーもすぐに更新され、次の議論に活かされます。",
      },
    ],
    caseStudies: [
      {
        place: "屋久島町(空港滑走路延伸)",
        intro:
          `${PARTNER_NAME}の現地取材・ヒアリングと、データ分析基盤を組み合わせ、屋久島町で実証を進めています。`,
        steps: [
          {
            title: "ゴール",
            description: "「地域経済の発展」を、町の関係者と一緒に設定",
          },
          {
            title: "ステークホルダー",
            description:
              "町の担当者・議員・住民・事業者など、それぞれの立場や意見を整理",
          },
          {
            title: "データ",
            description: "人口推計や現地ヒアリングで集めた住民の声を収集・整理",
          },
          {
            title: "議論用ペーパー",
            description:
              "論点や推奨アクションをまとめた「A3意思決定支援シート」を作成",
          },
          {
            title: "議論",
            description:
              "会議で出た意見をその場でシートに反映し、次の議論につなげる",
          },
        ],
        embedUrl: "/case-studies/yakushima-a3.html",
        embedLabel: "屋久島町(空港滑走路延伸)の事例をみる",
      },
      {
        place: "屋久島町(航路の持続可能性)",
        intro:
          "屋久島航路の維持を巡る意思決定支援のダッシュボード事例です。経営指標・住民意見・AIによる施策提案までを1つの画面で確認できます。",
        steps: [
          {
            title: "経営指標・意見",
            description:
              "営業収支比率や資金不足比率などの経営指標と、住民・観光関係者・物流事業者など立場ごとの意見を集約",
          },
          {
            title: "AI分析",
            description:
              "収集したデータから課題を分解し、生活影響や合意形成のしやすさなどをスコア化",
          },
          {
            title: "施策候補",
            description:
              "分析結果をもとに、短期・中期・長期の見込みつきで複数の施策候補を提示",
          },
          {
            title: "意思決定シミュレーション",
            description:
              "論点ごとに、施策への賛成・反対・少数意見を比較しながら合意形成を検討",
          },
        ],
        embedUrl: "/case-studies/yakushima-route-dss.html",
        embedLabel: "屋久島町(航路の持続可能性)の事例をみる",
      },
    ],
  },
  {
    slug: "cardgame",
    name: "しまのみんな会議",
    tagline: "カードを選ぶだけで、島のことをいっしょに考えられる",
    emoji: "🃏",
    target: "島の住民の方・学校の先生と学生",
    description:
      "「しまのみんな会議」は、島で今話し合われているテーマについて、カードを選びながら自分の考えを整理できるツールです。「あなたの視点」「大事にしたい価値観」「気になる懸念」「あなたの結論」の4枚のカードを選び、なぜそう思うかを書くだけで、AIが意見を読みやすくまとめてくれます。まとめた意見は、匿名のまま「意思決定支援」の材料として活用されます。学校の授業教材としても使えます。",
    points: [
      "4枚のカードを選ぶだけで、自分の意見が整理できる",
      "AIが意見を読みやすくまとめてくれる",
      "まとめた意見は、匿名で地域の意思決定に活かされる",
    ],
    process: [
      {
        icon: "🎴",
        title: "4枚のカードを選ぶ",
        description:
          "「あなたの視点」「大事にしたい価値観」「気になる懸念」「あなたの結論」を、それぞれ1枚ずつ選びます。",
      },
      {
        icon: "✍️",
        title: "なぜそう思うかを書く",
        description: "選んだカードの組み合わせについて、自分の言葉で自由に理由を書きます。",
      },
      {
        icon: "🤖",
        title: "AIがまとめる",
        description: "書いた内容をAIが読みやすい文章にまとめてくれます。採点や優劣はつけません。",
      },
      {
        icon: "📮",
        title: "意見として登録する",
        description:
          "まとめた意見は、匿名のまま「意思決定支援」プラットフォームに送られ、地域の話し合いの材料になります。",
      },
    ],
    caseStudies: [
      {
        place: "屋久島町",
        intro:
          "屋久島空港の滑走路延伸事業をテーマに、住民の方がいろいろな立場からカードを選んで意見を書けるようにしています。",
        steps: [
          {
            title: "あなたの視点",
            description: "観光事業者・子育て世代・高齢の住民など、13種類の立場から選択",
          },
          {
            title: "大事にしたい価値観",
            description: "地域経済の発展、自然環境の保全、暮らしの静けさなど",
          },
          {
            title: "気になる懸念",
            description: "騒音、財政負担、生態系への影響、進め方の拙速さなど",
          },
          {
            title: "あなたの結論",
            description: "賛成・条件付き賛成・反対・保留など、今の時点での考え",
          },
        ],
      },
    ],
    externalUrl: "https://shimatetsudai-issue-cardgame.vercel.app/games/issue-yakushima-airport/cards",
    externalLabel: "体験してみる(屋久島町の事例)",
  },
];

export const getToolBySlug = (slug: string) =>
  tools.find((tool) => tool.slug === slug);
