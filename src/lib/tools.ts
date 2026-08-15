export type Tool = {
  slug: string;
  name: string;
  tagline: string;
  emoji: string;
  target: string;
  description: string;
  points: string[];
};

export const tools: Tool[] = [
  {
    slug: "tetsudatte",
    name: "てつだって",
    tagline: "聞こえにくさや、暮らしのちょっとした「困った」に寄り添う",
    emoji: "🤝",
    target: "難聴の方・高齢の方とそのご家族",
    description:
      "「てつだって」は、耳の聞こえに不安がある方や、高齢のご家族を持つ方のための支援ツールです。会話の文字化や、日々のちょっとした困りごとを周りに伝える機能を通じて、離島や地方でも安心して暮らせる社会を目指しています。",
    points: [
      "会話を見える化して、聞き逃しの不安を減らす",
      "家族や支援者とゆるやかにつながる仕組み",
      "難しい操作なしで、誰でも使えるシンプルさ",
    ],
  },
  {
    slug: "ishikettei",
    name: "意思決定支援",
    tagline: "自治体の首長や議会の対話を、もっと開かれたものに",
    emoji: "🏛️",
    target: "自治体の首長・議会・地域の意思決定に関わる方",
    description:
      "地域の未来を左右する意思決定は、丁寧な対話と情報の共有から生まれます。本ツールは、自治体の首長や議会が住民の声を集め、論点を整理し、納得感のある合意形成を進めるための支援を行います。",
    points: [
      "住民の意見や地域データを整理して見える化",
      "論点の可視化で、建設的な議論をサポート",
      "離島特有の課題にも対応できる柔軟な設計",
    ],
  },
  {
    slug: "cardgame",
    name: "カードゲーム",
    tagline: "遊びながら学べる、先生と学生のための教材",
    emoji: "🎴",
    target: "学校の先生・学生",
    description:
      "楽しく学べるカードゲーム教材です。教育現場の先生方が授業で使いやすいよう設計されており、学生同士の対話や協働を通じて、自然と学びが深まる体験を提供します。",
    points: [
      "授業にそのまま組み込める手軽さ",
      "対話や協働を促すゲームデザイン",
      "先生向けの進行ガイド付き",
    ],
  },
];

export const getToolBySlug = (slug: string) =>
  tools.find((tool) => tool.slug === slug);
