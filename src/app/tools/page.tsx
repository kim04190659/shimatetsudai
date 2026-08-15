import type { Metadata } from "next";
import { tools } from "@/lib/tools";
import ToolCard from "@/components/ToolCard";

export const metadata: Metadata = {
  title: "事業紹介 | 離島経済新聞社 しまてつだい分室",
};

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <p className="text-sm font-semibold text-brand-dark">OUR TOOLS</p>
      <h1 className="mt-2 text-3xl font-bold text-foreground">事業紹介</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-foreground/80">
        しまてつだい分室では、それぞれ異なる立場の方に寄り添う3つのツールを開発しています。
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>
    </div>
  );
}
