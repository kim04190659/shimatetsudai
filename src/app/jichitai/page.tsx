import type { Metadata } from "next";
import Link from "next/link";
import { getAllBranches } from "@/lib/branches";
import { PARTNER_NAME } from "@/lib/partner";

export const metadata: Metadata = {
  title: `自治体支援 | ${PARTNER_NAME} しまてつだい分室`,
};

export default function JichitaiPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-soft/70 to-background">
        <div className="mx-auto max-w-5xl px-5 py-16 text-center sm:py-24">
          <p className="text-sm font-semibold tracking-wide text-brand-dark">
            しまてつだい 自治体支援
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-snug text-foreground sm:text-4xl">
            住民の声とデータで、
            <br className="hidden sm:block" />
            自治体の「正しい意思決定」を後押しする。
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-foreground/80">
            {PARTNER_NAME}が地域に根ざした取材・ヒアリングで集める住民や事業者の生の声と、
            データ分析基盤を組み合わせ、論点や利害関係を整理したうえで、
            会議にそのまま持ち込める資料にまとめて提供します。
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-medium text-accent-green">
            自治体ごとに、地元に住む女性が拠点スタッフとして関わっています。
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/branches"
              className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
            >
              自治体ごとの分室を見る
            </Link>
            <Link
              href="/tools/ishikettei"
              className="rounded-full border border-brand-dark px-6 py-3 text-sm font-semibold text-brand-dark transition hover:bg-brand-soft/60"
            >
              「意思決定支援」の詳しい機能を見る
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-accent-green px-6 py-3 text-sm font-semibold text-accent-green transition hover:bg-accent-green/10"
            >
              連携について問い合わせる
            </Link>
          </div>
        </div>
      </section>

      {/* What we offer */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">自治体に提供する仕組み</h2>
          <p className="mt-2 text-sm text-foreground/70">
            声を聞き、意見にまとめ、みんなで決める。この輪を島ごとに回しています
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-brand-soft bg-card p-6">
            <p className="text-2xl">🏛️</p>
            <h3 className="mt-3 text-base font-bold text-foreground">意思決定支援</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">
              住民・議会・役場職員から集めた声と、公開データを組み合わせ、論点を整理した資料にまとめます。
              類似事例や活用できる補助金・交付金もあわせて確認できます。
            </p>
          </div>
          <div className="rounded-2xl border border-brand-soft bg-card p-6">
            <p className="text-2xl">🃏</p>
            <h3 className="mt-3 text-base font-bold text-foreground">しまのみんな会議</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">
              住民の方が、カードを選ぶだけで意見を出せる仕組みです。集まった声は、匿名のまま意思決定の材料になります。
            </p>
          </div>
          <div className="rounded-2xl border border-brand-soft bg-card p-6">
            <p className="text-2xl">🤝</p>
            <h3 className="mt-3 text-base font-bold text-foreground">商工会・観光協会との連携</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">
              自治体だけでなく、商工会・観光協会とも同じ仕組みでつながり、島全体としての意思決定を後押しします。
            </p>
          </div>
        </div>
      </section>

      {/* Branches teaser */}
      <section className="bg-brand-soft/30">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <p className="text-sm font-semibold text-brand-dark">BRANCHES</p>
          <h2 className="mt-2 text-2xl font-bold text-foreground">分室一覧</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-foreground/80">
            島ごとに分室ページを作り、住民・役場・議会と話しながら論点を1つずつ登録していきます。
            現在は{getAllBranches().length}島を掲載しています。
          </p>
          <Link
            href="/branches"
            className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-dark hover:underline"
          >
            分室一覧をもっと見る →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h2 className="text-2xl font-bold text-foreground">
          あなたの自治体でも、話をしてみませんか。
        </h2>
        <p className="mt-4 leading-relaxed text-foreground/80">
          まずは無料のヒアリングから始めます。役場の担当者の方、議会関係者の方、
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
