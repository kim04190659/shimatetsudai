import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "会社概要 | 離島経済新聞社 しまてつだい分室",
};

const facts: { label: string; value: string }[] = [
  { label: "名称", value: "離島経済新聞社 しまてつだい分室(仮)" },
  { label: "運営", value: "離島経済新聞社" },
  { label: "位置づけ", value: "離島経済新聞社の分室" },
  { label: "活動内容", value: "支援ツール・意思決定支援ツール・教育向けカードゲームの企画開発" },
  { label: "メンバー", value: "20代〜40代の女性を中心となって活動" },
  { label: "働き方", value: "自治体ごとの拠点スタッフを中心に、リモートワークで活動" },
  { label: "所在地", value: "準備中" },
  { label: "設立", value: "準備中" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <p className="text-sm font-semibold text-brand-dark">ABOUT US</p>
      <h1 className="mt-2 text-3xl font-bold text-foreground">会社概要</h1>
      <p className="mt-6 leading-relaxed text-foreground/80">
        「しまてつだい分室」は、離島経済新聞社の分室として、地域に寄り添うツールを開発しています。
        20代から40代の女性が中心となって活動し、それぞれの視点を活かしながら、
        「聞こえにくさ」「意思決定」「学び」という3つのテーマでツールを届けています。
      </p>

      <div className="mt-10 overflow-hidden rounded-2xl border border-brand-soft">
        <table className="w-full text-left text-sm">
          <tbody>
            {facts.map((fact) => (
              <tr key={fact.label} className="border-b border-brand-soft last:border-0">
                <th className="w-32 bg-brand-soft/40 px-4 py-4 align-top font-semibold text-brand-dark sm:w-40">
                  {fact.label}
                </th>
                <td className="px-4 py-4 text-foreground/80">{fact.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold text-foreground">大切にしていること</h2>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/80">
          <li>・島や地方で暮らす方々の「声」に丁寧に耳を傾けること</li>
          <li>・立場の異なる人たちの「あいだ」を、テクノロジーでそっとつなぐこと</li>
          <li>・活動するメンバー一人ひとりが、無理なく長く関われる環境をつくること</li>
          <li>・自治体ごとに拠点スタッフを増やし、地元に住む女性が活躍できる場をつくること</li>
        </ul>
      </div>

      <div className="mt-12 rounded-2xl border border-accent-green/30 bg-accent-green/5 p-6">
        <h2 className="text-xl font-bold text-foreground">目指す姿</h2>
        <p className="mt-3 text-sm leading-relaxed text-foreground/80">
          しまてつだい分室は、全国の自治体それぞれに拠点スタッフを置くことを目指しています。
          地元をよく知る女性たちが、自分の暮らすまちで、まちの人のために働く。
          そんな小さな拠点が全国に広がることで、離島や地方の暮らしをより丁寧に支えられると考えています。
        </p>
        <Link
          href="/contact"
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent-green hover:underline"
        >
          拠点スタッフについて問い合わせる →
        </Link>
      </div>
    </div>
  );
}
