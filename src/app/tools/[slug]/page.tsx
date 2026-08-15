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

      {tool.process && (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-foreground">どうやって進めるか</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/70">
            すべてのステップに、AIが伴走します。1〜4で土台を整え、5で実際に議論しながら、また3・4に戻って情報を更新する — このサイクルをくり返しながら、合意形成に近づいていきます。
          </p>

          <div className="relative mt-8 pl-14">
            <div className="absolute top-2 bottom-2 left-5 w-px bg-brand-soft" />
            {tool.process.map((step, index) => (
              <div key={step.title} className="relative mb-8 last:mb-0">
                <div className="absolute -left-14 flex h-10 w-10 items-center justify-center rounded-full bg-brand text-lg text-white">
                  {step.icon}
                </div>
                <p className="text-xs font-semibold text-accent-green">STEP {index + 1}</p>
                <h3 className="mt-1 font-bold text-foreground">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-foreground/70">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-2 flex items-center gap-2 rounded-2xl bg-brand-soft/40 p-4 text-sm text-foreground/70">
            <span className="text-lg">🔁</span>
            <span>5まで進んだら、また3・4に戻ってくり返します。話し合うほど、ペーパーの中身が育っていきます。</span>
          </div>
        </div>
      )}

      {tool.caseStudy && (
        <div className="mt-10 rounded-2xl border border-brand-soft bg-card p-6">
          <h2 className="text-lg font-bold text-foreground">
            実例:{tool.caseStudy.place}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/70">{tool.caseStudy.intro}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {tool.caseStudy.steps.map((step, index) => (
              <div key={step.title} className="rounded-xl bg-brand-soft/30 p-4">
                <p className="text-xs font-semibold text-accent-green">STEP {index + 1}・{step.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/80">{step.description}</p>
              </div>
            ))}
          </div>

          {tool.caseStudy.embedUrl && (
            <div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">{tool.caseStudy.embedLabel ?? "実際の成果物"}</p>
                <a
                  href={tool.caseStudy.embedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-xs font-semibold text-brand-dark hover:underline"
                >
                  新しいタブで全画面表示 ↗
                </a>
              </div>
              <div className="mt-3 overflow-hidden rounded-xl border border-brand-soft bg-white shadow-sm">
                <iframe
                  src={tool.caseStudy.embedUrl}
                  title={tool.caseStudy.embedLabel ?? "実際の成果物"}
                  loading="lazy"
                  className="h-[640px] w-full"
                />
              </div>
              <p className="mt-2 text-xs text-foreground/50">
                実際に会議で使われている意思決定支援シートです。タブを切り替えて中身を確認できます。
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-10 flex flex-wrap gap-4">
        {tool.externalUrl && (
          // 別ドメインで稼働中のアプリへのリンクのため、next/linkではなく通常のaタグを使用
          <a
            href={tool.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full border border-brand bg-white px-6 py-3 text-sm font-semibold text-brand-dark transition hover:bg-brand-soft/40"
          >
            {tool.externalLabel ?? "アプリを使ってみる"}
          </a>
        )}
        {tool.additionalLinks?.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full border border-brand bg-white px-6 py-3 text-sm font-semibold text-brand-dark transition hover:bg-brand-soft/40"
          >
            {link.label}
          </a>
        ))}
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
