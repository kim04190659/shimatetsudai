import type { Metadata } from "next";
import Link from "next/link";
import { branches } from "@/lib/branches";
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
        自治体ごとに置かれた拠点スタッフが、それぞれの地域の論点を登録し、住民・役場・議会との話し合いを支えています。
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {branches.map((branch) => (
          <Link
            key={branch.slug}
            href={`/branches/${branch.slug}`}
            className="rounded-2xl border border-brand-soft bg-card p-6 transition hover:bg-brand-soft/30"
          >
            <p className="text-xs font-semibold text-brand-dark">{branch.tagline}</p>
            <h2 className="mt-2 text-lg font-bold text-foreground">{branch.name}</h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">{branch.description}</p>
            <p className="mt-3 text-xs font-semibold text-accent-green">論点{branch.issues.length}件 →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
