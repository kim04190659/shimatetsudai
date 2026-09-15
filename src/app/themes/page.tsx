import type { Metadata } from "next";
import { themes } from "@/lib/themes";
import { PARTNER_NAME } from "@/lib/partner";

// 「テーマ」一覧ページ(2026-09-15新設)。
// 従来の「分室一覧」(/branches、自治体・団体ごとの窓口単位)の代わりに、
// 「未来のシマ共創会議2026」のテーマオーナー案件を中心に、
// テーマそのものをフラットに並べる。鯨本さん(離島経済新聞社)からの依頼:
// 「同じコミュニティから多様なテーマが出てくることも想定されるため、
// シンプルに『テーマ』とするのがいい」という考え方にもとづく。
//
// 掲載データは src/lib/themes.ts にまとめている(branches.tsの実データを
// このページ用の並び順で複製したもの。branches.ts自体は変更していない)。

export const metadata: Metadata = {
  title: `テーマ | ${PARTNER_NAME} シマの北極星`,
};

const statusStyle: Record<string, string> = {
  提起: "bg-brand-soft/40 text-brand-dark",
  議論中: "bg-orange-100 text-orange-700",
  合意形成中: "bg-blue-100 text-blue-700",
  合意済み: "bg-accent-green/15 text-accent-green",
  保留: "bg-gray-100 text-gray-600",
};

export default function ThemesPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <p className="text-sm font-semibold text-brand-dark">THEMES</p>
      <h1 className="mt-2 text-3xl font-bold text-foreground">テーマ</h1>
      <p className="mt-4 leading-relaxed text-foreground/80">
        今、全国の島々でどんな話し合いが進んでいるかを、テーマ単位で見られるページです。「未来のシマ共創会議2026」のテーマオーナー案件を中心に掲載しています。
      </p>
      <p className="mt-2 text-sm leading-relaxed text-foreground/70">
        気になるテーマがあれば、「しまのみんな会議」からあなたの意見を届けることもできます。
      </p>

      <div className="mt-10 space-y-4">
        {themes.map((theme) => (
          <div key={theme.title} className="rounded-2xl border border-brand-soft bg-card p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  statusStyle[theme.status] ?? "bg-brand-soft/40 text-brand-dark"
                }`}
              >
                {theme.status}
              </span>
              <span className="inline-flex items-center rounded-full bg-brand-soft/50 px-2.5 py-1 text-[11px] font-semibold text-brand-dark">
                {theme.sourceBranch}
              </span>
              <h2 className="text-base font-bold text-foreground">{theme.title}</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground/80">{theme.summary}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {theme.dashboardUrl && (
                <a
                  href={theme.dashboardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-brand bg-white px-5 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-brand-soft/40"
                >
                  {theme.dashboardLabel ?? "詳しい資料を見る"} ↗
                </a>
              )}
              {theme.cardGameUrl && (
                <a
                  href={theme.cardGameUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-accent-green px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  {theme.cardGameLabel ?? "しまのみんな会議で意見を出す"} ↗
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
