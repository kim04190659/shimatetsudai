import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { branches, getBranchBySlug, type BranchIssue } from "@/lib/branches";
import { getShoukoukaiBySlug } from "@/lib/shoukoukai";
import { getKankoukyoukaiBySlug } from "@/lib/kankoukyoukai";
import { getCrossInsightsBySlug } from "@/lib/crossInsights";
import { getRegionalGoalBySlug } from "@/lib/regionalGoal";
import { PARTNER_NAME } from "@/lib/partner";

export function generateStaticParams() {
  return branches.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata(
  props: PageProps<"/branches/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const branch = getBranchBySlug(slug);
  return { title: branch ? `${branch.name} | ${PARTNER_NAME} しまてつだい分室` : "分室" };
}

const statusStyle: Record<string, string> = {
  提起: "bg-brand-soft/40 text-brand-dark",
  議論中: "bg-orange-100 text-orange-700",
  合意形成中: "bg-blue-100 text-blue-700",
  合意済み: "bg-accent-green/15 text-accent-green",
  保留: "bg-gray-100 text-gray-600",
};

function IssueList({ issues }: { issues: BranchIssue[] }) {
  return (
    <div className="mt-6 space-y-4">
      {issues.map((issue) => (
        <div key={issue.title} className="rounded-2xl border border-brand-soft bg-card p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                statusStyle[issue.status] ?? "bg-brand-soft/40 text-brand-dark"
              }`}
            >
              {issue.status}
            </span>
            <h3 className="text-base font-bold text-foreground">{issue.title}</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-foreground/80">{issue.summary}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {issue.dashboardUrl && (
              <a
                href={issue.dashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-brand bg-white px-5 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-brand-soft/40"
              >
                {issue.dashboardLabel ?? "詳しい資料を見る"} ↗
              </a>
            )}
            {issue.cardGameUrl && (
              <a
                href={issue.cardGameUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-accent-green px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                {issue.cardGameLabel ?? "しまのみんな会議で意見を出す"} ↗
              </a>
            )}
          </div>
          {issue.pastDashboards && issue.pastDashboards.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-xs text-foreground/50">過去のバージョン:</span>
              {issue.pastDashboards.map((past) => (
                <a
                  key={past.url}
                  href={past.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-brand-dark underline underline-offset-2 hover:opacity-80"
                >
                  {past.label} ↗
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default async function BranchDetailPage(props: PageProps<"/branches/[slug]">) {
  const { slug } = await props.params;
  const branch = getBranchBySlug(slug);
  const shoukoukai = getShoukoukaiBySlug(slug);
  const kankoukyoukai = getKankoukyoukaiBySlug(slug);
  const crossInsights = getCrossInsightsBySlug(slug);
  const regionalGoal = getRegionalGoalBySlug(slug);

  if (!branch) {
    notFound();
  }

  const hasCardGame =
    branch.issues.some((issue) => issue.cardGameUrl) ||
    (shoukoukai?.issues.some((issue) => issue.cardGameUrl) ?? false) ||
    (kankoukyoukai?.issues.some((issue) => issue.cardGameUrl) ?? false);

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <Link href="/branches" className="text-sm font-semibold text-brand-dark hover:underline">
        ← 分室一覧に戻る
      </Link>

      <p className="mt-6 text-sm font-semibold text-brand-dark">{branch.tagline}</p>
      <h1 className="mt-2 text-3xl font-bold text-foreground">{branch.name}</h1>
      <p className="mt-4 leading-relaxed text-foreground/80">{branch.description}</p>
      <p className="mt-2 text-sm leading-relaxed text-foreground/70">
        この島では、自治体
        {shoukoukai && "・商工会"}
        {kankoukyoukai && "・観光協会"}
        が、それぞれの立場から話し合いを進めています。
      </p>

      {hasCardGame && (
        <div className="mt-6 rounded-2xl border border-accent-green/40 bg-accent-green/5 p-5">
          <p className="text-sm font-bold text-foreground">💬 あなたも意見を聞かせてください</p>
          <p className="mt-1 text-sm leading-relaxed text-foreground/70">
            下の話し合いの一覧から、カードを選ぶだけで意見を届けられます。
          </p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {branch.stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-brand-soft bg-card p-3">
            <p className="text-xs font-semibold text-foreground/60">{stat.label}</p>
            <p className="mt-1 text-sm leading-snug text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {regionalGoal && (
        <div className="mt-12 rounded-2xl border-2 border-accent-green/40 bg-accent-green/5 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">🧭 この島が目指す姿</h2>
            <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-accent-green">
              AIによる仮案・要検証
            </span>
          </div>
          <p className="mt-4 text-lg font-bold leading-relaxed text-foreground">
            {regionalGoal.statement}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-foreground/70">{regionalGoal.note}</p>
          {regionalGoal.sourceUrl && (
            <a
              href={regionalGoal.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-dark underline underline-offset-2 hover:opacity-80"
            >
              出典: {regionalGoal.sourceLabel ?? regionalGoal.sourceUrl} ↗
            </a>
          )}

          <h3 className="mt-6 text-sm font-bold text-foreground">この目標を追いかけるための代理指標(案)</h3>
          <ul className="mt-2 space-y-1">
            {regionalGoal.proxyIndicators.map((indicator) => (
              <li key={indicator} className="flex gap-2 text-sm leading-relaxed text-foreground/80">
                <span className="text-accent-green">・</span>
                <span>{indicator}</span>
              </li>
            ))}
          </ul>

          <h3 className="mt-6 text-sm font-bold text-foreground">
            今の論点は、この目標にどう関係しているか
          </h3>
          <div className="mt-3 space-y-3">
            {regionalGoal.issueAlignments.map((alignment) => (
              <div
                key={alignment.issueTitle}
                className="rounded-2xl border border-brand-soft bg-white p-4"
              >
                <p className="text-sm font-semibold text-foreground">
                  {alignment.orgIcon} {alignment.issueTitle}
                  <span className="ml-2 text-xs font-normal text-foreground/50">({alignment.org})</span>
                </p>
                <p className="mt-2 flex gap-2 text-sm leading-relaxed text-foreground/80">
                  <span className="shrink-0 rounded-full bg-accent-green/15 px-2 py-0.5 text-xs font-semibold text-accent-green">
                    追い風
                  </span>
                  <span>{alignment.contribution}</span>
                </p>
                {alignment.risk && (
                  <p className="mt-2 flex gap-2 text-sm leading-relaxed text-foreground/80">
                    <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                      リスク
                    </span>
                    <span>{alignment.risk}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {crossInsights && (
        <div className="mt-12 rounded-2xl border-2 border-brand-soft bg-brand-soft/20 p-6">
          <h2 className="text-lg font-bold text-foreground">🔗 3つの機関の論点は、こうつながっています</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/70">{crossInsights.intro}</p>
          <div className="mt-6 space-y-4">
            {crossInsights.insights.map((insight) => (
              <div
                key={`${insight.from.label}-${insight.to.label}`}
                className="rounded-2xl border border-brand-soft bg-white p-5"
              >
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                  <span>
                    {insight.from.icon} {insight.from.label}
                  </span>
                  <span className="text-brand-dark/50">→</span>
                  <span>
                    {insight.to.icon} {insight.to.label}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-foreground/80">{insight.note}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-foreground/50">
            ※ それぞれのダッシュボードの内容をもとに、機関をまたいで整理した気づきです。論点が増えるたびに見直します。
          </p>
        </div>
      )}

      {branch.tools.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-bold text-foreground">住民のみなさんが使えるツール</h2>
          <div className="mt-4 space-y-3">
            {branch.tools.map((tool) => (
              <a
                key={tool.name}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-1 rounded-2xl border border-brand-soft bg-card p-5 transition hover:bg-brand-soft/30 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="text-base font-bold text-foreground">{tool.name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/70">{tool.description}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-brand-dark">開く ↗</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 自治体の取り組み */}
      <div className="mt-12">
        <h2 className="text-lg font-bold text-foreground">🏛️ 自治体で、いま話し合っていること</h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/70">
          拠点スタッフが住民・役場・議会と話しながら、困りごとを1つずつ、話し合いのテーブルに乗せていきます。
        </p>
        <IssueList issues={branch.issues} />
      </div>

      {/* 商工会の取り組み */}
      {shoukoukai && (
        <div className="mt-12">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">🏢 {shoukoukai.name}の取り組み</h2>
            {shoukoukai.status === "準備中" && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                検討段階
              </span>
            )}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground/70">
            会員事業者の経営者・商工会職員と話しながら、経営に関わる困りごとを話し合っています。
          </p>
          {shoukoukai.issues.length > 0 ? (
            <IssueList issues={shoukoukai.issues} />
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-brand-soft bg-card p-6 text-sm leading-relaxed text-foreground/60">
              現在、登録されている話し合いはまだありません。
            </div>
          )}
          <Link
            href={`/shoukoukai/branches/${shoukoukai.slug}`}
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-dark hover:underline"
          >
            {shoukoukai.name}の詳細ページを見る →
          </Link>
        </div>
      )}

      {/* 観光協会の取り組み */}
      {kankoukyoukai && (
        <div className="mt-12">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">🏝️ {kankoukyoukai.name}の取り組み</h2>
            {kankoukyoukai.status === "準備中" && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                検討段階
              </span>
            )}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground/70">
            観光事業者・観光協会職員と話しながら、観光に関わる困りごとを話し合っています。
          </p>
          {kankoukyoukai.issues.length > 0 ? (
            <IssueList issues={kankoukyoukai.issues} />
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-brand-soft bg-card p-6 text-sm leading-relaxed text-foreground/60">
              現在、登録されている話し合いはまだありません。
            </div>
          )}
          <Link
            href={`/kankoukyoukai/branches/${kankoukyoukai.slug}`}
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-dark hover:underline"
          >
            {kankoukyoukai.name}の詳細ページを見る →
          </Link>
        </div>
      )}

      <div className="mt-12 rounded-2xl border border-accent-green/30 bg-accent-green/5 p-6">
        <p className="text-sm leading-relaxed text-foreground/80">
          声を聞き、意見にまとめ、みんなで決める。自治体
          {shoukoukai && "・商工会"}
          {kankoukyoukai && "・観光協会"}
          をまたいで、{branch.name}の暮らしに還るところまで伴走しています。
        </p>
        <Link
          href="/contact"
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent-green hover:underline"
        >
          この分室について問い合わせる →
        </Link>
      </div>
    </div>
  );
}
