import type { Metadata } from "next";
import Link from "next/link";
import { getAllShoukoukaiBranches } from "@/lib/shoukoukai";
import { PARTNER_NAME } from "@/lib/partner";

export const metadata: Metadata = {
  title: `商工会分室一覧 | ${PARTNER_NAME} しまてつだい 商工会支援`,
};

const statusStyle: Record<string, string> = {
  準備中: "bg-gray-100 text-gray-600",
  活動中: "bg-accent-green/15 text-accent-green",
};

export default function ShoukoukaiBranchesPage() {
  const allShoukoukaiBranches = getAllShoukoukaiBranches();
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <Link href="/dantai" className="text-sm font-semibold text-brand-dark hover:underline">
        ← 団体支援トップに戻る
      </Link>

      <p className="mt-6 text-sm font-semibold text-brand-dark">SHOUKOUKAI BRANCHES</p>
      <h1 className="mt-2 text-3xl font-bold text-foreground">商工会分室一覧</h1>
      <p className="mt-4 leading-relaxed text-foreground/80">
        商工会ごとに分室ページを作り、会員事業者の経営者・商工会職員と話しながら論点を1つずつ登録していきます。
        しまてつだい分室(自治体向け)と同じ仕組みで、商工会が増えるたびにこのページにも追加されていきます。
      </p>

      {allShoukoukaiBranches.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-brand-soft bg-card p-6 text-sm leading-relaxed text-foreground/60">
          現在、掲載している商工会分室はまだありません。
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {allShoukoukaiBranches.map((branch) => (
            <Link
              key={branch.slug}
              href={`/shoukoukai/branches/${branch.slug}`}
              className="rounded-2xl border border-brand-soft bg-card p-6 transition hover:bg-brand-soft/30"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-brand-dark">{branch.tagline}</p>
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    statusStyle[branch.status] ?? "bg-brand-soft/40 text-brand-dark"
                  }`}
                >
                  {branch.status}
                </span>
              </div>
              <h2 className="mt-2 text-lg font-bold text-foreground">{branch.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">{branch.description}</p>
              <p className="mt-3 text-xs font-semibold text-accent-green">論点{branch.issues.length}件 →</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
