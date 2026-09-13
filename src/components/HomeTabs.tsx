"use client";

// ホームページのタブ切り替えUI。
// 2026-09-13 鯨本さん(離島経済新聞社)からの追加依頼を受け、
// 「①資料からたたき台を作る／②分室の実例を見る／③有料オプション」という機能タブから、
// 離島経済新聞社が示した問題意識ごとに「このツールは何を提供するか」を説明するタブへ作り替えた。
// (資料投入→ダッシュボード反映の実際の操作は /tools/dashboard-draft の3ペインUIに集約している)
import { useState } from "react";
import Link from "next/link";

type BranchSummary = { slug: string; name: string; tagline: string };

const TABS = [
  {
    key: "naming",
    label: "① 名前が伝わりにくい",
    problem: "「サービス名・打ち出し方が直感的に伝わらない」というご指摘をいただきました。",
    answer:
      "サービス名を「シマの北極星」、キャッチコピーを「対話と意志決定の補助ツール」に変更し、サイト全体に反映しました。",
  },
  {
    key: "multitheme",
    label: "② 1テーマでは伝えきれない",
    problem: "「1コミュニティ=1テーマでは、話し合いたいことを表現しきれない」というご指摘をいただきました。",
    answer:
      "1つの分室(拠点)の中に、複数のテーマ(論点)を並べて持てる構造になっています。実際に複数のテーマが動いている分室を、下の実例からご確認いただけます。",
  },
  {
    key: "focus",
    label: "③ 機能が多すぎる",
    problem: "「機能が多く、何をするサービスか一目で伝わらない」というご指摘をいただきました。",
    answer:
      "ホームページを、意思決定支援ダッシュボードを中心とした構成にしぼりこみました。「てつだって」など他の機能は削除せず、必要な方が迷わず辿り着けるよう分室ページ側に整理しています。",
  },
  {
    key: "auto",
    label: "④ 資料をまとめる余力がない",
    problem:
      "「Google NotebookLMのように、資料を投入するだけで使えるようにしてほしい」というご要望をいただきました。",
    answer:
      "ダッシュボードの「資料投入エリア」に議事録やメモを貼り付けると、AIがその場でたたき台を作成し反映します。反映された内容については、その場で質問することもできます。",
    ctaHref: "/tools/dashboard-draft",
    ctaLabel: "ダッシュボードを試す →",
  },
  {
    key: "options",
    label: "⑤ 対話支援・発信まで頼みたい",
    problem: "「ダッシュボードだけでなく、対話支援や情報発信まで任せられないか」というご相談をいただきました。",
    answer:
      "各分室ページから、リトケイへの対話支援(住民ヒアリング・座談会)の依頼と、決定事項をもとにしたAI記事下書き作成・「読者だより」掲載依頼の、2つの有料オプションを依頼できます。",
  },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function HomeTabs({ branches }: { branches: BranchSummary[] }) {
  const [tab, setTab] = useState<TabKey>(TABS[0].key);
  const active = TABS.find((t) => t.key === tab) ?? TABS[0];

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-2.5 text-xs font-semibold transition sm:text-sm ${
              tab === t.key
                ? "bg-brand text-white"
                : "border border-brand-soft bg-white text-brand-dark hover:bg-brand-soft/40"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mx-auto mt-8 max-w-2xl">
        <div className="rounded-2xl border border-brand-soft bg-card p-6">
          <p className="text-xs font-semibold text-foreground/50">離島経済新聞社の問題意識</p>
          <p className="mt-1 leading-relaxed text-foreground/80">{active.problem}</p>
          <p className="mt-4 text-xs font-semibold text-brand-dark">シマの北極星が提供するもの</p>
          <p className="mt-1 leading-relaxed text-foreground">{active.answer}</p>
          {"ctaHref" in active && (
            <div className="mt-4">
              <Link
                href={active.ctaHref}
                className="inline-flex items-center gap-1 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                {active.ctaLabel}
              </Link>
            </div>
          )}
        </div>

        {active.key === "multitheme" && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {branches.map((b) => (
              <Link
                key={b.slug}
                href={`/branches/${b.slug}`}
                className="flex flex-col rounded-2xl border border-brand-soft bg-card p-5 transition hover:border-brand"
              >
                <span className="font-bold text-foreground">{b.name}</span>
                <span className="mt-1 text-xs text-foreground/60">{b.tagline}</span>
              </Link>
            ))}
          </div>
        )}

        {active.key === "options" && (
          <div className="mt-6 text-center">
            <Link
              href="/branches"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-dark hover:underline"
            >
              分室ページから依頼する →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
