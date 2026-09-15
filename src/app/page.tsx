import Image from "next/image";
import { PARTNER_NAME, SITE_NAME, SITE_TAGLINE } from "@/lib/partner";

// 2026-09-13 鯨本さん(離島経済新聞社)からの依頼で、ホームページ全体を
// 「意思決定支援」に絞ったシンプルな1画面に作り直した。
// 2026-09-13(追加依頼) タブによる機能紹介はやめ、
// 「離島経済新聞社がなぜこのサービスを作ろうと思ったか」をシンプルに伝えるページに変更。
// 旧ホームにあった「てつだって」「しまのみんな会議」の紹介、拠点スタッフ募集、
// 私たちの考え方などの節は、/tools・/contact・/about に譲り、ここでは扱わない。
export default function Home() {
  return (
    <div>
      <section className="bg-gradient-to-b from-brand-soft/70 to-background">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:py-20">
          <Image
            src="/partners/ritokei-shimbunsha-logo.png"
            alt={PARTNER_NAME}
            width={220}
            height={56}
            className="mx-auto h-10 w-auto"
          />
          <h1 className="mt-6 text-3xl font-bold leading-snug text-foreground sm:text-4xl">
            {SITE_NAME}
          </h1>
          <p className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full bg-brand-soft/60 px-4 py-1.5 text-sm font-semibold text-brand-dark">
            {SITE_TAGLINE}
          </p>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-foreground/80">
            話し合いの資料を持ち寄れば、AIが論点を整理し、意思決定を後押しします。
            {PARTNER_NAME}が、地域の対話と意思決定を支えます。
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-5 py-14">
        <p className="text-xs font-semibold text-brand-dark">なぜ、このサービスを作ったのか</p>
        <div className="mt-4 space-y-4 leading-relaxed text-foreground/80">
          <p>
            {PARTNER_NAME}は、全国420の有人離島を取材・発信でつないできました。取材を続ける中で見えてきたのは、
            多くの島が「話し合いたいことはあるのに、資料をまとめたり論点を整理したりする余力がない」という
            共通の課題です。
          </p>
          <p>
            会議のたびに一から資料を作り、意見を整理する作業は、ただでさえ人手の限られる島にとって
            大きな負担になっています。その負担を減らし、対話と意思決定そのものに時間を使えるように
            するためのツールとして、{SITE_NAME}は作られました。
          </p>
          <p>
            議事録やメモを貼り付けるだけでAIが論点整理の下書きを作り、その内容について気になることは
            その場で質問できます。難しい操作を覚えなくても、資料を投入して質問するだけで使える形を
            目指しています。
          </p>
        </div>
      </section>
    </div>
  );
}
