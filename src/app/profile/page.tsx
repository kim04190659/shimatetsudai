// ============================================================
// 木村好孝さん 公開プロフィールページ（/profile）
// ============================================================
// このページは、しまてつだいリポジトリ内の既存ページ
// 「会社概要」（src/app/about/page.tsx）を土台としてコピーし、
// 内容だけを「6つの立場の自己紹介」に差し替えて作っています。
// レイアウトの型（見出し→リード文→表→箇条書き→リンク導線）は
// aboutページと同じにすることで、サイト全体のデザインの一貫性を保っています。
//
// 分からなくなったら // で始まる行（コメント）を読めば、
// その下が何をしているか説明が書いてあります。
// コメントは画面には表示されません。
//
// 直したいときは、下の ROLES 配列や TAGLINE の文字列を書き換えるだけで
// 画面に反映されます。レイアウトの仕組み（JSX・className）は
// 基本的に触らなくて大丈夫です。

import type { Metadata } from "next";

// このページのタイトル・説明文（ブラウザのタブや検索結果に使われる）
export const metadata: Metadata = {
  title: "木村好孝｜Yoshitaka Kimura",
  description:
    "NEC・鹿児島高専同窓会・サービス学会・高専教育DX・離島経済新聞社・しまてつだい。複数の立場で社会課題解決に取り組む木村好孝のプロフィールページ。",
};

// 一言キャッチ。実際の言葉に置き換えてください。
const TAGLINE =
  "縮む社会にWell-Beingを届ける。NECの本業とAIを軸に、6つの立場で社会課題に向き合っています。";

// 6つの立場のデータ。aboutページの facts（名称・運営・活動内容…の表）と
// 同じ「label・value」の形にして、同じ table コンポーネントで表示します。
// href が無い項目は「TODO」として空欄のままにしています。
type Role = {
  label: string; // 表の左列（立場の分類。例：「本業」）
  value: string; // 表の右列（役職名＋説明）
  href?: string; // 関連リンクがあれば設定（無ければ省略可）
  linkText?: string; // リンクの表示文字
};

const ROLES: Role[] = [
  {
    label: "本業",
    value:
      "NEC コーポレートIT・AIイノベーション部門 DWP統括部 統括部長。社員・パートナー全体のデジタルワークプレイス（PC・クラウド環境）とDX/AX推進を統括。",
  },
  {
    label: "同窓会",
    value:
      "鹿児島高専 関東支部同窓会 幹事長。関東在住OB・OGのネットワーク運営、年次総会・理事会の企画運営。",
    href: "https://ktc1.jimdosite.com/",
    linkText: "関東支部 公式サイト →",
  },
  {
    label: "学会",
    value: "サービス学会 理事。行政・地域サービスの学術的な発信・研究発表を担当。",
  },
  {
    label: "教育",
    value:
      "鹿児島高専 教育DX 企業講師（支援者）。PBLカードゲーム等を通じて、学生に企業活動・事業化の考え方を教える特別講義を担当。",
  },
  {
    label: "離島",
    value:
      "離島経済新聞社 支援者。420の有人離島を支援するメディアと共に、島の合意形成・情報基盤づくりを支援。",
  },
  {
    label: "自主開発",
    value:
      "しまてつだい 支援者・開発者。難聴の方の会話支援「てつだって」、自治体の意思決定支援など、社会課題解決の仕組みをClaudeと共に開発。",
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
    // mx-auto max-w-3xl px-5 py-16: aboutページと全く同じ外枠。
    // サイト内のどの「読み物ページ」でも同じ余白・幅になるようにしている。
    <div className="mx-auto max-w-3xl px-5 py-16">
      {/* aboutページの「ABOUT US」に相当する小さな見出し（eyebrow） */}
      <p className="text-sm font-semibold text-brand-dark">PROFILE</p>
      <h1 className="mt-2 text-3xl font-bold text-foreground">
        木村 好孝｜Yoshitaka Kimura
      </h1>
      <p className="mt-6 leading-relaxed text-foreground/80">{TAGLINE}</p>

      {/* ここが今回のギャップ：aboutページの facts表（名称・運営・活動内容…）を、
          そのまま「6つの立場」の一覧に転用している。表の形式・スタイルはコピーし、
          データの中身だけを差し替えた。 */}
      <div className="mt-10 overflow-hidden rounded-2xl border border-brand-soft">
        <table className="w-full text-left text-sm">
          <tbody>
            {ROLES.map((role) => (
              <tr key={role.label} className="border-b border-brand-soft last:border-0">
                <th className="w-32 bg-brand-soft/40 px-4 py-4 align-top font-semibold text-brand-dark sm:w-40">
                  {role.label}
                </th>
                <td className="px-4 py-4 text-foreground/80">
                  {role.value}
                  {role.href && (
                    <>
                      {" "}
                      <a
                        href={role.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-brand-dark hover:underline"
                      >
                        {role.linkText ?? "詳しく見る →"}
                      </a>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* aboutページの「大切にしていること」箇条書きに相当するセクション */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-foreground">発信・記事</h2>
        <ul className="mt-4 flex flex-wrap gap-2 text-sm">
          {LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-brand-soft px-4 py-2 text-foreground hover:border-brand-dark hover:text-brand-dark"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* aboutページの「目指す姿」枠（accent-green の背景ブロック）に相当。
          ここでは連絡先の案内として使う。 */}
      <div className="mt-12 rounded-2xl border border-accent-green/30 bg-accent-green/5 p-6">
        <h2 className="text-xl font-bold text-foreground">連絡・お問い合わせ</h2>
        <p className="mt-3 text-sm leading-relaxed text-foreground/80">
          お仕事のご相談・講演依頼・各立場に関するお問い合わせは、メールでご連絡ください。
        </p>
        <div className="mt-4">
          {/* TODO: 公開してよいメールアドレスに置き換えてください */}
          <a
            href="mailto:kim04190659@gmail.com"
            className="inline-flex items-center gap-1 text-sm font-semibold text-accent-green hover:underline"
          >
            メールで連絡する →
          </a>
        </div>
      </div>
    </div>
  );
}
