import type { Metadata } from "next";
import Link from "next/link";
import { getAllKankoukyoukaiBranches } from "@/lib/kankoukyoukai";
import { PARTNER_NAME } from "@/lib/partner";

export const metadata: Metadata = {
  title: `観光協会支援 | ${PARTNER_NAME} しまてつだい分室`,
};

export default function KankoukyoukaiPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-soft/70 to-background">
        <div className="mx-auto max-w-5xl px-5 py-16 text-center sm:py-24">
          <p className="text-sm font-semibold tracking-wide text-brand-dark">
            しまてつだい 観光協会支援
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-snug text-foreground sm:text-4xl">
            島の合意形成の仕組みを、
            <br className="hidden sm:block" />
            観光協会の意思決定支援にも。
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-foreground/80">
            しまてつだい分室が自治体・商工会向けに培ってきた「合意形成プラットフォーム」の仕組みを、
            島の観光事業者を支える観光協会向けにも提供する取り組みです。
            会員事業者(宿泊・ガイド・飲食・物産など)の声を集めながら、生成AIと一緒に意思決定を後押しします。
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-medium text-accent-green">
            まずは「意思決定支援」機能だけを、小さく始めます。
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/kankoukyoukai/branches"
              className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
            >
              観光協会分室一覧を見る
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-brand-dark px-6 py-3 text-sm font-semibold text-brand-dark transition hover:bg-brand-soft/60"
            >
              連携について問い合わせる
            </Link>
            <Link
              href="/jichitai"
              className="rounded-full border border-accent-green px-6 py-3 text-sm font-semibold text-accent-green transition hover:bg-accent-green/10"
            >
              自治体支援を見る
            </Link>
          </div>
        </div>
      </section>

      {/* What we offer */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">観光協会に提供する仕組み</h2>
          <p className="mt-2 text-sm text-foreground/70">
            自治体・商工会の分室で使っている仕組みを、そのまま観光協会向けに置き換えています
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-brand-soft bg-card p-6">
            <p className="text-2xl">🏝️</p>
            <h3 className="mt-3 text-base font-bold text-foreground">意思決定支援</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">
              会員事業者や観光協会職員から集めた声と、公開データを組み合わせ、論点を整理した資料にまとめます。
              最初のスコープはこの機能だけに絞ってスモールスタートします。
            </p>
          </div>
          <div className="rounded-2xl border border-brand-soft bg-card p-6">
            <p className="text-2xl">🗂️</p>
            <h3 className="mt-3 text-base font-bold text-foreground">合意形成プラットフォーム</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">
              しまてつだい分室と同じ8DB構造(Stakeholder・Issue・PositionRecordなど)を使い、
              観光事業者(会員)・自治体・商工会などの関係者を整理します。
            </p>
          </div>
          <div className="rounded-2xl border border-brand-soft bg-card p-6">
            <p className="text-2xl">🤝</p>
            <h3 className="mt-3 text-base font-bold text-foreground">自治体・商工会との連携</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">
              観光協会は自治体・商工会と並ぶ島の意思決定機関の一つです。しまてつだい分室の自治体向け・
              商工会向けの取り組みとも、データや論点をつなげていける設計を目指しています。
            </p>
          </div>
        </div>
      </section>

      {/* Kankoukyoukai branches teaser */}
      <section className="bg-brand-soft/30">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <p className="text-sm font-semibold text-brand-dark">KANKOUKYOUKAI BRANCHES</p>
          <h2 className="mt-2 text-2xl font-bold text-foreground">観光協会分室一覧</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-foreground/80">
            観光協会ごとに分室ページを作り、会員事業者・観光協会職員と話しながら論点を1つずつ登録していきます。
            現在は{getAllKankoukyoukaiBranches().length}件の観光協会を掲載しています。
          </p>
          <Link
            href="/kankoukyoukai/branches"
            className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-dark hover:underline"
          >
            観光協会分室一覧をもっと見る →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h2 className="text-2xl font-bold text-foreground">
          あなたの地域の観光協会でも、話をしてみませんか。
        </h2>
        <p className="mt-4 leading-relaxed text-foreground/80">
          まずは無料のヒアリングから始めます。観光協会の職員の方、会員事業者の方、
          どちらからのご連絡もお待ちしています。
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-flex items-center gap-1 rounded-full bg-accent-green px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          お問い合わせはこちら →
        </Link>
      </section>
    </div>
  );
}
