import Link from "next/link";
import { tools } from "@/lib/tools";
import ToolCard from "@/components/ToolCard";
import { PARTNER_NAME } from "@/lib/partner";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-soft/70 to-background">
        <div className="mx-auto max-w-5xl px-5 py-16 text-center sm:py-24">
          <p className="text-sm font-semibold tracking-wide text-brand-dark">
            {PARTNER_NAME} しまてつだい分室
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-snug text-foreground sm:text-4xl">
            島の暮らしと、人と人との
            <br className="hidden sm:block" />
            「あいだ」を、そっとてつだう。
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-foreground/80">
            聞こえにくさに寄り添うツール、みんなの意見を聞くツール、島の未来をみんなで決めるツール。
            あなたの島の暮らしに、そっと寄り添う3つの道具を、{PARTNER_NAME}の分室として届けています。
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-medium text-accent-green">
            各地の島や自治体に、地元に住む女性が拠点スタッフとして関わっています。
          </p>
        </div>
      </section>

      {/* はじめての方へ(読者別の入口) */}
      <section className="mx-auto max-w-5xl px-5 py-14">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">はじめての方へ</h2>
          <p className="mt-2 text-sm text-foreground/70">
            あなたの立場に合わせて、見ていただきたいページをご案内します
          </p>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          <div className="flex flex-col rounded-2xl border border-brand-soft bg-card p-6 text-center">
            <span className="text-3xl">🏝️</span>
            <h3 className="mt-3 font-bold text-foreground">島にお住まいの方へ</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">
              今、あなたの島でどんな話し合いが進んでいるかを見て、あなたの声を届けられます。
            </p>
            <Link
              href="/branches"
              className="mt-4 inline-flex items-center justify-center gap-1 rounded-full bg-accent-green px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              あなたの島の話し合いを見る
            </Link>
          </div>
          <div className="flex flex-col rounded-2xl border border-brand-soft bg-card p-6 text-center">
            <span className="text-3xl">🏛️</span>
            <h3 className="mt-3 font-bold text-foreground">自治体・議会の方へ</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">
              住民の声とデータをあわせて、意思決定を後押しする仕組みをご紹介します。
              初めて開く画面でも迷わないよう、まず「今日、何を確認したいですか?」の1問から案内する作りにしています。
            </p>
            <Link
              href="/tools/ishikettei"
              className="mt-4 inline-flex items-center justify-center gap-1 rounded-full border border-brand bg-white px-5 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-brand-soft/40"
            >
              意思決定支援を見る
            </Link>
          </div>
          <div className="flex flex-col rounded-2xl border border-brand-soft bg-card p-6 text-center">
            <span className="text-3xl">🙋</span>
            <h3 className="mt-3 font-bold text-foreground">一緒に働きたい方へ</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">
              自分の暮らす地域のために働く、拠点スタッフという選択肢があります。
            </p>
            <Link
              href="/contact"
              className="mt-4 inline-flex items-center justify-center gap-1 rounded-full border border-accent-green px-5 py-2.5 text-sm font-semibold text-accent-green transition hover:bg-accent-green/10"
            >
              拠点スタッフに興味がある方はこちら
            </Link>
          </div>
        </div>
      </section>

      {/* 循環の説明(声を聞く→意見にする→決める→暮らしに還る) */}
      <section className="bg-brand-soft/30 py-14">
        <div className="mx-auto max-w-5xl px-5">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">3つのツールが、ひとつの輪になっています</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-foreground/70">
              声を聞き、意見としてまとめ、みんなで決め、また暮らしに還っていく。この輪を、島ごとに小さく回しています。
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-4">
            {[
              { icon: "👂", title: "聞く", body: "「てつだって」で、日々の声を集めます" },
              { icon: "✍️", title: "意見にする", body: "「しまのみんな会議」で、考えを言葉にします" },
              { icon: "🗳️", title: "決める", body: "「意思決定支援」で、みんなで話し合います" },
              { icon: "🏠", title: "暮らしに還る", body: "決まったことが、また日々の暮らしに活かされます" },
            ].map((step, index, arr) => (
              <div key={step.title} className="relative flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
                  {step.icon}
                </div>
                <h3 className="mt-3 font-bold text-foreground">{step.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-foreground/70">{step.body}</p>
                {index < arr.length - 1 && (
                  <span className="mt-2 hidden text-xl text-brand-dark/40 sm:block sm:absolute sm:top-6 sm:-right-4">
                    →
                  </span>
                )}
              </div>
            ))}
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

      {/* 私たちの考え方(生成AIが複数機関を横断的に支える仕組み) */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <div className="overflow-hidden rounded-3xl border-2 border-accent-green/30 bg-accent-green/5 px-6 py-12 sm:px-12">
          <div className="text-center">
            <p className="text-sm font-semibold tracking-wide text-accent-green">OUR APPROACH</p>
            <h2 className="mt-2 text-2xl font-bold text-foreground">
              それぞれの機関が、それぞれの利害で決める。それでも、地域全体が良くなる。
            </h2>
            <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-foreground/80">
              自治体・商工会・観光協会など、地域には複数の意思決定機関があります。それぞれが独立した目的で判断するのは自然なことですが、縦割りのままだと、地域全体の最適にはつながらないことがあります。私たちは、地域全体で共有する指標と、それぞれの論点との関わりを生成AIで横断的に見える化することで、各機関の意思決定を支える仕組みに取り組んでいます。
            </p>
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/approach"
              className="inline-flex items-center rounded-full bg-accent-green px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              私たちの考え方を詳しく見る
            </Link>
          </div>
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
            しまてつだい分室は、{PARTNER_NAME}の分室として、20代から40代の女性が中心となって活動しています。
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
