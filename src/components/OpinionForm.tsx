"use client";

// 分室ページに埋め込む、パスワード不要の簡易意見投稿フォーム。
// 「しまのみんな会議」カードゲームをまだ持たない新規テナントでも、
// 最低限「意見を届ける」ことができるようにするための代替導線。
import { useState } from "react";

const STANCES = ["賛成", "反対", "条件付き賛成", "保留"] as const;
type Stance = (typeof STANCES)[number];

export default function OpinionForm({ tenantSlug }: { tenantSlug: string }) {
  const [stance, setStance] = useState<Stance>("保留");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim().length === 0) return;

    setStatus("sending");
    setErrorMessage("");
    try {
      const res = await fetch(`/api/tenant/${tenantSlug}/opinion`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stance, content }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "送信に失敗しました");
      }
      setStatus("done");
      setContent("");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "送信に失敗しました");
    }
  };

  if (status === "done") {
    return (
      <div className="mt-4 rounded-xl border border-accent-green/30 bg-accent-green/5 p-4 text-sm text-accent-green">
        意見を届けました。ありがとうございます。
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-xl border border-brand-soft bg-white p-4">
      <p className="text-xs font-semibold text-foreground/70">この論点について、あなたの意見を届けてください</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {STANCES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStance(s)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              stance === s
                ? "border-accent-green bg-accent-green text-white"
                : "border-brand-soft bg-white text-foreground/70 hover:bg-brand-soft/30"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="思っていることを自由に書いてください"
        rows={3}
        maxLength={2000}
        className="mt-3 w-full rounded-lg border border-brand-soft p-2 text-sm"
      />
      {status === "error" && <p className="mt-1 text-xs text-red-600">{errorMessage}</p>}
      <button
        type="submit"
        disabled={status === "sending" || content.trim().length === 0}
        className="mt-3 rounded-full bg-accent-green px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {status === "sending" ? "送信中…" : "意見を届ける"}
      </button>
    </form>
  );
}
