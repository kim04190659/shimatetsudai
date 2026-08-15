import Link from "next/link";
import type { Tool } from "@/lib/tools";

export default function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group flex flex-col rounded-2xl border border-brand-soft bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <span className="text-4xl">{tool.emoji}</span>
      <h3 className="mt-4 text-xl font-bold text-brand-dark">{tool.name}</h3>
      <p className="mt-1 text-sm font-medium text-accent-green">{tool.target}</p>
      <p className="mt-3 text-sm leading-relaxed text-foreground/80">
        {tool.tagline}
      </p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-dark">
        詳しく見る
        <span className="transition group-hover:translate-x-1">→</span>
      </span>
    </Link>
  );
}
