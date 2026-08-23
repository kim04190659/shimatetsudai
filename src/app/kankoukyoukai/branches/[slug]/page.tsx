import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllKankoukyoukaiBranches, getKankoukyoukaiBySlug } from "@/lib/kankoukyoukai";
import { PARTNER_NAME } from "@/lib/partner";
import OpinionForm from "@/components/OpinionForm";
import BranchPasswordGate from "@/components/BranchPasswordGate";
import { cookies } from "next/headers";
import { getBranchPasswordHash } from "@/lib/tenants";
import { verifySessionToken, tenantCookieName } from "@/lib/tenantAuth";

export function generateStaticParams() {
  return getAllKankoukyoukaiBranches().map((b) => ({ slug: b.slug }));
}

// TENANTS_CONFIGにpublicKind:"kankoukyoukai"のテナントが追加されたときも、
// 再デプロイ・再ビルドを待たずにオンデマンドで生成できるようにする
export const dynamicParams = true;

export async function generateMetadata(
  props: PageProps<"/kankoukyoukai/branches/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const branch = getKankoukyoukaiBySlug(slug);
  return {
    title: branch ? `${branch.name} | ${PARTNER_NAME} しまてつだい 観光協会支援` : "観光協会分室",
  };
}

const statusStyle: Record<string, string> = {
  準備中: "bg-gray-100 text-gray-600",
  活動中: "bg-accent-green/15 text-accent-green",
};

const issueStatusStyle: Record<string, string> = {
  提起: "bg-brand-soft/40 text-brand-dark",
  議論中: "bg-orange-100 text-orange-700",
  合意形成中: "bg-blue-100 text-blue-700",
  合意済み: "bg-accent-green/15 text-accent-green",
  保留: "bg-gray-100 text-gray-600",
};

export default async function KankoukyoukaiBranchDetailPage(
  props: PageProps<"/kankoukyoukai/branches/[slug]">
) {
  const { slug } = await props.params;
  const branch = getKankoukyoukaiBySlug(slug);

  if (!branch) {
    notFound();
  }

  const branchPasswordHash = getBranchPasswordHash(slug);
  if (branchPasswordHash) {
    const cookieStore = await cookies();
    const sessionSlug = `branch:${slug}`;
    const token = cookieStore.get(tenantCookieName(sessionSlug))?.value;
    if (!verifySessionToken(sessionSlug, token)) {
      return <BranchPasswordGate slug={slug} />;
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <Link href="/kankoukyoukai/branches" className="text-sm font-semibold text-brand-dark hover:underline">
        ← 観光協会分室一覧に戻る
      </Link>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <p className="text-sm font-semibold text-brand-dark">{branch.tagline}</p>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            statusStyle[branch.status] ?? "bg-brand-soft/40 text-brand-dark"
          }`}
        >
          {branch.status}
        </span>
      </div>
      <h1 className="mt-2 text-3xl font-bold text-foreground">{branch.name}</h1>

      <div className="mt-4 rounded-xl border border-dashed border-foreground/20 bg-foreground/[0.03] p-4 text-xs leading-relaxed text-foreground/60">
        ⚠️ このページは、公開情報をもとに作成した実証用のデモです。{branch.name}から正式な許諾・監修を得て制作したものではありません。掲載する論点は生成AIによる仮の整理案であり、実際の見解を示すものではない点にご留意ください。
      </div>

      <p className="mt-4 leading-relaxed text-foreground/80">{branch.description}</p>
      <Link
        href={`/branches/${branch.slug}`}
        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-dark hover:underline"
      >
        この島の分室ページ(自治体・商工会もまとめて見る)→
      </Link>

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
          <h2 className="text-lg font-bold text-foreground">会員事業者のみなさんが使えるツール</h2>
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
          観光協会職員・会員事業者と話しながら、1つずつ論点を登録していきます。
        </p>

        {branch.issues.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-brand-soft bg-card p-6 text-sm leading-relaxed text-foreground/60">
            現在、登録されている論点はまだありません。連携の準備が整い次第、ここに追加していきます。
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {branch.issues.map((issue) => (
              <div key={issue.title} className="rounded-2xl border border-brand-soft bg-card p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      issueStatusStyle[issue.status] ?? "bg-brand-soft/40 text-brand-dark"
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
                {issue.opinionTenantSlug && (
                  <OpinionForm tenantSlug={issue.opinionTenantSlug} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-12 rounded-2xl border border-accent-green/30 bg-accent-green/5 p-6">
        <p className="text-sm leading-relaxed text-foreground/80">
          この観光協会との連携は、しまてつだい分室の「意思決定支援」の仕組みを土台に検討しています。
        </p>
        <Link
          href="/contact"
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent-green hover:underline"
        >
          この観光協会について問い合わせる →
        </Link>
      </div>
    </div>
  );
}
