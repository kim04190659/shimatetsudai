import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { branches, getBranchBySlug } from "@/lib/branches";
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

export default async function BranchDetailPage(props: PageProps<"/branches/[slug]">) {
  const { slug } = await props.params;
  const branch = getBranchBySlug(slug);

  if (!branch) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <Link href="/about" className="text-sm font-semibold text-brand-dark hover:underline">
        ← 会社概要に戻る
      </Link>

      <p className="mt-6 text-sm font-semibold text-brand-dark">{branch.tagline}</p>
      <h1 className="mt-2 text-3xl font-bold text-foreground">{branch.name}</h1>
      <p className="mt-4 leading-relaxed text-foreground/80">{branch.description}</p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {branch.stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-brand-soft bg-card p-3">
            <p className="text-xs font-semibold text-foreground/60">{stat.label}</p>
            <p className="mt-1 text-sm leading-snug text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

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

      <div className="mt-12">
        <h2 className="text-lg font-bold text-foreground">論点(Issue)</h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/70">
          拠点スタッフが住民・役場・議会と話しながら、1つずつ論点を登録していきます。
        </p>

        <div className="mt-6 space-y-4">
          {branch.issues.map((issue) => (
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
                    {issue.dashboardLabel ?? "詳細を見る"} ↗
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
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 rounded-2xl border border-accent-green/30 bg-accent-green/5 p-6">
        <p className="text-sm leading-relaxed text-foreground/80">
          この分室の活動は、意思決定支援・しまのみんな会議・てつだって拡張版の3つのツールを組み合わせて進めています。
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
