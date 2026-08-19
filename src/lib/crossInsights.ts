// 分室(島)ごとの「機関をまたいだ論点のつながり」を管理するファイル。
//
// 自治体・商工会・観光協会は、それぞれ別の会議体で意思決定をしているが、
// 同じ島の中では、一つの機関の論点が、別の機関の論点に影響を与えていることが多い。
// 生成AIが「縦割り組織を横につなぐ」ことの価値を具体的に示すため、
// 各機関のダッシュボード(branches.ts / shoukoukai.ts / kankoukyoukai.ts)の内容を
// 突き合わせて見えてきたつながりを、ここに手動でまとめる。
//
// 実データ収集(Notion)から自動生成するものではなく、既存の登録済み論点を
// 横断的に読み解いた「気づき」を記録する場所。新しい論点が増えるたびに見直す。

export type CrossInsightNode = {
  icon: string;
  label: string;
};

export type CrossInsight = {
  from: CrossInsightNode;
  to: CrossInsightNode;
  note: string;
};

export type BranchCrossInsights = {
  slug: string;
  intro: string;
  insights: CrossInsight[];
};

export const crossInsightsList: BranchCrossInsights[] = [
  {
    slug: "yakushima",
    intro:
      "屋久島町では、自治体・商工会・観光協会がそれぞれ別の論点を検討していますが、内容を突き合わせると、お互いに影響し合っていることが見えてきます。",
    insights: [
      {
        from: { icon: "🏛️", label: "空港滑走路延伸(自治体)" },
        to: { icon: "🏝️", label: "外資・新規事業者の参入への対応(観光協会)" },
        note:
          "観光客の受け入れが増えれば、その受け皿を巡って外部資本の参入圧力も強まる可能性があります。空港延伸を進めるなら、観光協会が求めている受け入れルールづくりと合わせて検討する必要があります。",
      },
      {
        from: { icon: "🏛️", label: "航路の持続可能性(自治体)" },
        to: { icon: "🏢", label: "自然災害へのBCP強化(商工会)" },
        note:
          "航路が止まれば、会員事業者の仕入れ・出荷、観光客の移動もすべて止まります。航路そのものの脆弱性は、商工会が備えるべき災害リスクの一部として捉える必要があります。",
      },
      {
        from: { icon: "🏝️", label: "外資・新規事業者の参入への対応(観光協会)" },
        to: { icon: "🏢", label: "自然災害へのBCP強化(商工会)" },
        note:
          "新しい資本の参入は、既存の商工会員にとって競合にも機会にもなり得ます。参入ルールを議論する際には、既存事業者の経営継続力(BCP)への影響もあわせて考える価値があります。",
      },
      {
        from: { icon: "🏛️", label: "空港滑走路延伸(自治体)" },
        to: { icon: "🏢", label: "自然災害へのBCP強化(商工会)" },
        note:
          "受け入れる観光客が増えるほど、台風などの災害時に島内に取り残される人も増えます。空港の利用者数見込みは、商工会が備えるべき災害対応の規模にも関わってきます。",
      },
    ],
  },
];

export const getCrossInsightsBySlug = (slug: string) =>
  crossInsightsList.find((c) => c.slug === slug);
