"use client";

// ホームページのタブ切り替えUI。
// 2026-09-13 鯨本さん(離島経済新聞社)からの依頼を受け、ホームページ全体を
// 「意思決定支援」中心の1画面に作り直した。てつだって・しまのみんな会議は
// 削除せず/tools配下には残すが、ホームからは意図的に外している。
import { useState } from "react";
import Link from "next/link";
import DashboardDraftForm from "@/components/DashboardDraftForm";

type BranchSummary = { slug: string; name: string; tagline: string };

const TABS = [
  { key: "draft", label: "① 資料からたたき台を作る" },
  { key: "examples", label: "② 分室の実例を見る" },
  { key: "options", label: "③ 有料オプション" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function HomeTabs({ branches }: { branches: BranchSummary[] }) {
  const [tab, setTab] = useState<TabKey>("draft");

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
              tab === t.key
                ? "bg-brand text-white"
                : "border border-brand-soft bg-white text-brand-dark hover:bg-brand-soft/40"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "draft" && (
          <div>
            <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-foreground/70">
              議事録やヒアリングメモ、資料の文章を貼り付けると、AIがその場で論点整理の下書きを作成します。
            </p>
            <div className="mt-6">
              <DashboardDraftForm />
            </div>
          </div>
        )}

        {tab === "examples" && (
          <div>
            <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-foreground/70">
              実際に意思決定支援が動いている分室(コミュニティの拠点ページ)です。分室の中には、複数のテーマ(論点)が並んでいます。
            </p>
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
            <div className="mt-6 text-center">
              <Link
                href="/branches"
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-dark hover:underline"
              >
                分室一覧をすべて見る →
              </Link>
            </div>
          </div>
        )}

        {tab === "options" && (
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="rounded-2xl border border-brand-soft bg-card p-6">
              <p className="text-sm font-semibold text-brand-dark">🗣️ 対話支援依頼</p>
              <h3 className="mt-1 font-bold text-foreground">
                {"リトケイに住民ヒアリング・座談会の開催を依頼できます"}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">
                ダッシュボードだけでは踏み込めない、地域でのリアルな対話支援をリトケイが担います。
                各分室ページから依頼できます。
              </p>
            </div>
            <div className="rounded-2xl border border-brand-soft bg-card p-6">
              <p className="text-sm font-semibold text-brand-dark">📰 記事作成・読者だより連携</p>
              <h3 className="mt-1 font-bold text-foreground">
                決定した意志を、AIが記事の下書きにして「読者だより」への掲載を依頼できます
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">
                「表明したからには実現しなければ」という覚悟づけにもなります。各分室ページから依頼できます。
              </p>
            </div>
            <div className="text-center">
              <Link
                href="/branches"
                className="inline-flex items-center gap-1 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                分室ページから依頼する →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
