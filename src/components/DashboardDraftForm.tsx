"use client";

// 「資料からたたき台を作る」フォーム(有料オプション③・簡易版)。
// 2026-09-13 鯨本さん(離島経済新聞社)からの依頼で、
// Google NotebookLMのように資料を投入するとダッシュボードが自動生成される体験を目指しているが、
// 今日中に安全に作れる範囲として、既存の /api/issue-summary (A3意思決定支援シート下書き生成)を
// そのまま呼び出す「テキスト貼り付け→AI下書き生成」までを実装している。
// 音声・PDFの自動読み取りや、4タブ構成のダッシュボード自体の自動生成は今後の課題。
import { useState } from "react";

export default function DashboardDraftForm() {
  const [issueTitle, setIssueTitle] = useState("");
  const [sourceNotes, setSourceNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<{ draft: string; provider: string; model: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    try {
      const res = await fetch("/api/issue-summary", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ issueTitle, sourceNotes }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResult(data);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-brand-soft bg-card p-5">
        <div>
          <label htmlFor="issueTitle" className="block text-xs font-semibold text-foreground/70">
            論点のタイトル
          </label>
          <input
            id="issueTitle"
            required
            placeholder="例: 生活航路の維持をどう支えるか"
            value={issueTitle}
            onChange={(e) => setIssueTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-brand-soft bg-white px-3 py-2 text-base outline-none focus:border-brand sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="sourceNotes" className="block text-xs font-semibold text-foreground/70">
            資料・議事録・ヒアリングメモなど(テキストを貼り付け)
          </label>
          <textarea
            id="sourceNotes"
            required
            rows={10}
            placeholder="ここに議事録やメモの文章を貼り付けてください"
            value={sourceNotes}
            onChange={(e) => setSourceNotes(e.target.value)}
            className="mt-1 w-full resize-none rounded-xl border border-brand-soft bg-white px-3 py-2 text-base outline-none focus:border-brand sm:text-sm"
          />
        </div>
        {status === "error" && (
          <p className="text-xs text-red-600">生成中にエラーが発生しました。時間をおいて再度お試しください。</p>
        )}
        <button
          type="submit"
          disabled={status === "loading"}
          className="self-start rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-40"
        >
          {status === "loading" ? "生成中…(30秒ほどかかります)" : "AIにたたき台を作ってもらう"}
        </button>
      </form>

      {result && (
        <div className="mt-6 rounded-2xl border border-brand-soft bg-white p-5">
          <p className="text-xs font-semibold text-foreground/60">
            AIによる下書き({result.provider} / {result.model})
          </p>
          <pre className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{result.draft}</pre>
        </div>
      )}
    </div>
  );
}
