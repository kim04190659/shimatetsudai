import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { tools, getToolBySlug } from "@/lib/tools";

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata(
  props: PageProps<"/tools/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const tool = getToolBySlug(slug);
  return { title: tool ? `${tool.name} | 離島経済新聞社 しまてつだい分室` : "ツール" };
}

export default async function ToolDetailPage(props: PageProps<"/tools/[slug]">) {
  const { slug } = await props.params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <Link href="/tools" className="text-sm font-semibold text-brand-dark hover:underline">
        ← 事業紹介一覧に戻る
      </Link>

      <div className="mt-6 flex items-center gap-4">
        <span className="text-5xl">{tool.emoji}</span>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{tool.name}</h1>
          <p className="mt-1 text-sm font-semibold text-accent-green">{tool.target}</p>
        </div>
      </div>

      <p className="mt-6 text-lg font-medium text-brand-dark">{tool.tagline}</p>
      <p className="mt-4 leading-relaxed text-foreground/80">{tool.description}</p>

      <div className="mt-10 rounded-2xl border border-brand-soft bg-card p-6">
        <h2 className="text-lg font-bold text-foreground">特徴</h2>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-foreground/80">
          {tool.points.map((point) => (
            <li key={point} className="flex gap-2">
              <span className="text-brand-dark">・</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 rounded-2xl bg-brand-soft/40 p-6 text-sm text-foreground/70">
        現在このページは準備中です。今後、実際に操作できるツールをこちらに追加していく予定です。
      </div>

      <div className="mt-10">
        <Link
          href="/contact"
          className="inline-flex items-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          このツールについて問い合わせる
        </Link>
      </div>
    </div>
  );
}
