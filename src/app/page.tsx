import Link from "next/link";
import { tools } from "@/lib/tools";
import ToolCard from "@/components/ToolCard";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-soft/70 to-background">
        <div className="mx-auto max-w-5xl px-5 py-16 text-center sm:py-24">
          <p className="text-sm font-semibold tracking-wide text-brand-dark">
            離島経済新聞社 しまてつだい分室
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-snug text-foreground sm:text-4xl">
            島の暮らしと、人と人との
            <br className="hidden sm:block" />
            「あいだ」を、そっとてつだう。
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-foreground/80">
            しまてつだい分室は、離島経済新聞社の分室として、20〜40代の女性が中心となって活動しています。
            聞こえにくさを支えるツール、地域の意思決定を支えるツール、学びを支えるツールを通じて、
            離島や地方の暮らしにそっと寄り添っています。
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-medium text-accent-green">
            自治体ごとに、地元に住む女性が拠点スタッフとして活躍する仕組みを広げています。
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/tools"
              className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
            >
              事業紹介を見る
            </Link>
            <Link
              href="/about"
              className="rounded-full border border-brand-dark px-6 py-3 text-sm font-semibold text-brand-dark transition hover:bg-brand-soft/60"
            >
              会社概要を見る
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-accent-green px-6 py-3 text-sm font-semibold text-accent-green transition hover:bg-accent-green/10"
            >
              拠点スタッフに興味がある方はこちら
            </Link>
          </div>
        </div>
      </section>

      {/* Tools */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">私たちが届ける3つのツール</h2>
          <p className="mt-2 text-sm text-foreground/70">
            それぞれ異なる立場の方に寄り添うツールを開発しています
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      {/* Recruit */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <div className="overflow-hidden rounded-3xl bg-accent-green/10 px-6 py-12 sm:px-12">
          <div className="text-center">
            <p className="text-sm font-semibold tracking-wide text-accent-green">
              JOIN US
            </p>
            <h2 className="mt-2 text-2xl font-bold text-foreground">
              あなたのまちにも、てつだいの拠点を。
            </h2>
            <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-foreground/80">
              しまてつだい分室では、自治体ごとに拠点スタッフとして活動する女性を募集しています。
              自分の暮らすまちで、まちのために働く。そんな選択肢を、全国の地域に広げていきたいと考えています。
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {[
              {
                title: "自分のまちのための仕事",
                body: "住み慣れた地域で、地域の人の役に立つ実感を持てる仕事です。",
              },
              {
                title: "無理なく続けられる働き方",
                body: "リモートワーク中心で、子育てや介護と両立しながら関わることができます。",
              },
              {
                title: "全国の仲間とゆるやかにつながる",
                body: "各地の拠点スタッフ同士で情報交換をしながら、一人にならずに活動できます。",
              },
              {
                title: "未経験からでも安心",
                body: "生成AIを活用したツールで、専門知識がなくても始められるようサポートします。",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl bg-card p-6 shadow-sm"
              >
                <h3 className="font-bold text-brand-dark">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/contact"
              className="inline-flex items-center rounded-full bg-accent-green px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              拠点スタッフについて問い合わせる
            </Link>
          </div>
        </div>
      </section>

      {/* Message */}
      <section className="bg-brand-soft/40">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <h2 className="text-2xl font-bold text-foreground">わたしたちについて</h2>
          <p className="mt-4 leading-relaxed text-foreground/80">
            しまてつだい分室は、離島経済新聞社の分室として、20代から40代の女性が中心となって活動しています。
            島や地方に暮らす方々の声に耳を傾け、日々の生活や地域の意思決定、教育の現場に、
            小さくても確かな「てつだい」を届けることを大切にしています。
          </p>
          <Link
            href="/about"
            className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-dark hover:underline"
          >
            会社概要をもっと見る →
          </Link>
        </div>
      </section>
    </div>
  );
}
