// ============================================================
// 木村吉孝さん 公開プロフィールページ（/profile）
// ============================================================
// これは「6つの立場を1つの入口にまとめる」公開ページです。
// しまてつだいのリポジトリ内の他ページ（例：src/app/about/page.tsx）と
// 同じ書き方（Next.js + Tailwind CSS）で作っています。
//
// 分からなくなったら // で始まる行（コメント）を読めば、
// その下が何をしているか説明が書いてあります。
// コメントは画面には表示されません。
//
// 直したいとき/、下の ROLES 配列や TAGLINE の文字列を書き換えるだけで
// 画面に反映されます。 レアアウトの仕組み（JSX・className）は
// 基本的に触らなくて大丈夫です。

import type { Metadata } from "next";

// このブージのタイトルル説明（ブラウザのタブや検索結果に使わる）
export const metadata: Metadata = {
  title: "木村吉孝｜Yoshitaka Kimura",
  description:
    "NEC・鹿児島高専同窓会・サービス学会・高専教育DX・離島経済新聞社・しまていだい。玪数の立場で社会譪題解汌に取り組む木村吉孝のプロフィールページ。",
};

// 一言キャッチ。実際の言莱に��き換うください。
const TAGLINE =
  "縮む社会にWell-Beingを届ける。NECの本業とAIを軸に、6つの立場で社会課題に向き合ってぁてます。";

// 6つの立場カードのデータ。1件が1h儶のカードに対応します。
// href が無い項目は「TODO」として空欄のままにしていぽす。
type Role = {
  label: string; // カード左上の小さなラベル（例：「本業」）
  title: string; // カードの見出し（役職名など）
  description: string; // 1〜2文の説明
  href?: string; // 関連リンクがあれば設定（無ければ省略可）
  linkText?: string; // リンクの表示文字
};

const ROLES: Role[] = [
  {
    label: "本業",
    title: "NEC コーポレートIT・AIイノベーション部門\nDWP統括部 統括部長",
    description:
      "社員・パートナー全体のデジタルワークプレイス（PC・クラウド環境）とDX/AX推進を統括。",
  },
  {
    label: "同窓会",
    title: "鹿児島高専 関東支部同窓会\n幹事長",
    description: "関東在住OB・OGのネットワーク運営、年次総会・理事会の企画運営。",
    href: "https://ktc1.jimdosite.com/",
    linkText: "関東支部 公式サイト →",
  },
  {
    label: "学会",
    title: "サービス学会\n理事",
    description: "行政・地域サービスの学術的な発信・研究発表を担当。",
  },
  {
    label: "教育",
    title: "鹿児島高専 教育DX\n企業講師（支援者）",
    description:
      "PBLカードゲーム等を通じて、学生に企業活動・事業化の考え方を教える特別講義を担当。",
  },
  {
    label: "離島",
    title: "離島経済新聞社\n支援者",
    description:
      "420の有人離島を支援するメディアと共に、島の合意形成・情報基盤づくりを支援。",
  },
  {
    label: "自主開発",
    title: "しまてつだい\n支援者・開発者",
    description:
      "難聴の方の会話支援「てつだって」、自治体の意思決定支援など、社会課題解決の仕組みをClaudeと共に開発。",
  },
];

// 発信（note / X / LinkedInなど）へのリンク一覧。
// TODO: 実際のURLに置き換えてください。
const LINKS = [
  { label: "note", href: "https://note.com/" },
  { label: "X（旧Twitter）", href: "https://x.com/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/" },
];

export default function ProfilePage() {
  return (
    // mx-auto max-w-3xl: 画面中央に、幅を制限して配置する共通パターン
    // （about ページと同じ考え方）
    <div className="mx-auto max-w-3xl px-5 py-16">
      {/* ① ヘッダー：名前と一言キャッチ */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">
          木村 吉孝｜Yoshitaka Kimura
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground/70">
          {TAGLINE}
        </p>
      </div>

      {/* ② 6つの立場カード：ここが一番の目的（自己紹介の一覧） */}
      {/* grid-cols-1 md:grid-cols-2: スマホでは1列、少し広い画面では2列 */}
      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
        {ROLES.map((role) => (
          <div
            key={role.label}
            className="rounded-2xl border border-brand-soft bg-white/50 p-5"
          >
            <div className="text-xs font-semibold tracking-wide text-brand-dark">
              {role.label}
            </div>
            {/* whitespace-pre-line: title内の \n を改行として表示する */}
            <h2 className="mt-1 whitespace-pre-line text-base font-bold text-foreground">
              {role.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">
              {role.description}
            </p>
            {role.href && (
              <a
                href={role.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-semibold text-brand-dark hover:underline"
              >
                {role.linkText ?? "詳しく見る →"}
              </a>
            )}
          </div>
        ))}
      </div>

      {/* ③ 発信（note / X / LinkedInなど） */}
      <div className="mt-14">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/60">
          発信・記事
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-brand-soft px-4 py-2 text-sm text-foreground hover:border-brand-dark hover:text-brand-dark"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>

      {/* ④ 連絡先 */}
      <div className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/60">
          連絡・お問い合わせ
        </h2>
        <div className="mt-4">
          {/* TODO: 公開してよいメールアドレスに置き換えてください */}
          <a
            href="mailto:kim04190659@gmail.com"
            className="rounded-full border border-brand-soft px-4 py-2 text-sm text-foreground hover:border-brand-dark hover:text-brand-dark"
          >
            メールで連絡する
        </a>
        </div>
      </div>
    </div>
  );
}
