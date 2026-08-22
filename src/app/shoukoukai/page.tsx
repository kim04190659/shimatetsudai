import type { Metadata } from "next";
import Link from "next/link";
import { getAllShoukoukaiBranches } from "@/lib/shoukoukai";
import { PARTNER_NAME } from "@/lib/partner";

export const metadata: Metadata = {
  title: `商工会支援 | ${PARTNER_NAME} しまてつだい分室`,
};

export default function ShoukoukaiPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-soft/70 to-background">
        <div className="mx-auto max-w-5xl px-5 py-16 text-center sm:py-24">
          <p className="text-sm font-semibold tracking-wide text-brand-dark">
            しまてつだい 商工会支援
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-snug text-foreground sm:text-4xl">
            島の合意形成の仕組みを、
            <br className="hidden sm:block" />
            商工会の意思決定支援にも。
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-foreground/80">
            しまてつだい分室が自治体向けに培ってきた「合意形成プラットフォーム」の仕組みを、
            地域の中小企業を支える商工会・商工会議所向けに提供する取り組みです。
            会員事業者の経営者の声を集めながら、生成AIと一緒に意思決定を後押しします。
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-medium text-accent-green">
            まずは「意思決定支援」機能だけを、小さく始めます。
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/shoukoukai/branches"
              className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
            >
              商工会分室一覧を見る
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
          <h2 className="text-2xl font-bold text-foreground">商工会に提供する仕組み</h2>
          <p className="mt-2 text-sm text-foreground/70">
            自治体の分室で使っている仕組みを、そのまま商工会向けに置き換えています
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-brand-soft bg-card p-6">
            <p className="text-2xl">🏛️</p>
            <h3 className="mt-3 text-base font-bold text-foreground">意思決定支援</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">
              会員事業者や商工会職員から集めた声と、公開データを組み合わせ、論点を整理した資料にまとめます。
              最初のスコープはこの機能だけに絞ってスモールスタートします。
            </p>
          </div>
          <div className="rounded-2xl border border-brand-soft bg-card p-6">
            <p className="text-2xl">🗂️</p>
            <h3 className="mt-3 text-base font-bold text-foreground">合意形成プラットフォーム</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">
              しまてつだい分室と同じ8DB構造(Stakeholder・Issue・PositionRecordなど)を使い、
              商工会員(経営者)・自治体・金融機関などの関係者を整理します。
            </p>
          </div>
          <div className="rounded-2xl border border-brand-soft bg-card p-6">
            <p className="text-2xl">🤝</p>
            <h3 className="mt-3 text-base font-bold text-foreground">自治体との連携</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">
              商工会は自治体と会員事業者の間に立つ組織です。しまてつだい分室の自治体向けの取り組みとも
              データや論点をつなげていける設計を目指しています。
            </p>
          </div>
        </div>
      </section>

      {/* Shoukoukai branches teaser */}
      <section className="bg-brand-soft/30">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <p className="text-sm font-semibold text-brand-dark">SHOUKOUKAI BRANCHES</p>
          <h2 className="mt-2 text-2xl font-bold text-foreground">商工会分室一覧</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-foreground/80">
            商工会ごとに分室ページを作り、会員事業者の経営者・商工会職員と話しながら論点を1つずつ登録していきます。
            現在は{getAllShoukoukaiBranches().length}件の商工会を掲載しています。
          </p>
          <Link
            href="/shoukoukai/branches"
            className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-dark hover:underline"
          >
            商工会分室一覧をもっと見る →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h2 className="text-2xl font-bold text-foreground">
          あなたの地域の商工会でも、話をしてみませんか。
        </h2>
        <p className="mt-4 leading-relaxed text-foreground/80">
          まずは無料のヒアリングから始めます。商工会の職員の方、会員事業者の経営者の方、
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
