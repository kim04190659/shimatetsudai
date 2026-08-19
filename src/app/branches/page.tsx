import type { Metadata } from "next";
import Link from "next/link";
import { branches } from "@/lib/branches";
import { getShoukoukaiBySlug } from "@/lib/shoukoukai";
import { getKankoukyoukaiBySlug } from "@/lib/kankoukyoukai";
import { PARTNER_NAME } from "@/lib/partner";

export const metadata: Metadata = {
  title: `分室一覧 | ${PARTNER_NAME} しまてつだい分室`,
};

export default function BranchesPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <p className="text-sm font-semibold text-brand-dark">BRANCHES</p>
      <h1 className="mt-2 text-3xl font-bold text-foreground">分室一覧</h1>
      <p className="mt-4 leading-relaxed text-foreground/80">
        今、それぞれの島でどんな話し合いが進んでいるかを見られるページです。あなたの島を選んで、状況を見てみてください。
      </p>
      <p className="mt-2 text-sm leading-relaxed text-foreground/70">
        分室は自治体だけでなく、商工会・観光協会もまとめて、島単位で活動しています。
        気になる話し合いがあれば、「しまのみんな会議」からあなたの意見を届けることもできます。
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {branches.map((branch) => {
          const shoukoukai = getShoukoukaiBySlug(branch.slug);
          const kankoukyoukai = getKankoukyoukaiBySlug(branch.slug);
          const totalIssues =
            branch.issues.length +
            (shoukoukai?.issues.length ?? 0) +
            (kankoukyoukai?.issues.length ?? 0);
          return (
            <Link
              key={branch.slug}
              href={`/branches/${branch.slug}`}
              className="rounded-2xl border border-brand-soft bg-card p-6 transition hover:bg-brand-soft/30"
            >
              <p className="text-xs font-semibold text-brand-dark">{branch.tagline}</p>
              <h2 className="mt-2 text-lg font-bold text-foreground">{branch.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">{branch.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center rounded-full bg-brand-soft/50 px-2.5 py-1 text-[11px] font-semibold text-brand-dark">
                  🏛️ 自治体
                </span>
                {shoukoukai && (
                  <span className="inline-flex items-center rounded-full bg-brand-soft/50 px-2.5 py-1 text-[11px] font-semibold text-brand-dark">
                    🏢 商工会
                  </span>
                )}
                {kankoukyoukai && (
                  <span className="inline-flex items-center rounded-full bg-brand-soft/50 px-2.5 py-1 text-[11px] font-semibold text-brand-dark">
                    🏝️ 観光協会
                  </span>
                )}
              </div>
              <p className="mt-3 text-xs font-semibold text-accent-green">
                今、話し合っていること{totalIssues}件 →
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
