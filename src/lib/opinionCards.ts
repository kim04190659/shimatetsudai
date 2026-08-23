// 「しまのみんな会議」形式の意見カード。
//
// 別リポジトリ(shimatetsudai-issue-cardgame)のカードゲームアプリと同じ考え方で、
// 住民が自由記述するのではなく、あらかじめ用意したカードから選ぶことで
// 意見を出しやすくする。選んだカード(+任意の一言コメント)は、そのままではなく
// 生成AIが自然な一文にまとめたうえでPositionRecordに記録する。
//
// テナントslugごとにカードの束を用意する。カードが無いテナントは、
// 従来通りの自由記述フォーム(OpinionForm)にフォールバックする。

export type OpinionCard = {
  id: string;
  stance: "賛成" | "反対" | "条件付き賛成" | "保留";
  title: string;
  description: string;
};

const minamoKankoukyoukaiCards: OpinionCard[] = [
  {
    id: "route-time",
    stance: "賛成",
    title: "バスのルート・時間帯の見直しに賛成",
    description: "通学時間帯の安全を優先して、観光バスのルートや時間帯を工夫してほしい。",
  },
  {
    id: "limit-conditional",
    stance: "条件付き賛成",
    title: "人数制限には条件付きで賛成",
    description: "必要なら人数制限も検討してよいが、観光業への影響は最小限にしてほしい。",
  },
  {
    id: "limit-against",
    stance: "反対",
    title: "人数制限には反対",
    description: "観光は島の大事な収入源。人数を制限すると生活が苦しくなる事業者もいる。",
  },
  {
    id: "need-data",
    stance: "保留",
    title: "もっとデータを見てから判断したい",
    description: "実際どのくらい混雑しているのか、数字で見てから意見を決めたい。",
  },
  {
    id: "protect-nature",
    stance: "賛成",
    title: "自然環境を守るルールづくりに賛成",
    description: "次の世代に自然を引き継ぐためにも、何らかのルールは必要だと思う。",
  },
];

const cardsBySlug: Record<string, OpinionCard[]> = {
  "minamo-kankoukyoukai": minamoKankoukyoukaiCards,
};

export function getOpinionCards(tenantSlug: string): OpinionCard[] {
  return cardsBySlug[tenantSlug] ?? [];
}

export function getOpinionCardById(tenantSlug: string, cardId: string): OpinionCard | undefined {
  return getOpinionCards(tenantSlug).find((c) => c.id === cardId);
}
