"use client";

// 「しまのみんな会議」形式の意見投稿UI。自由記述ではなく、
// カードを1枚選ぶだけで意見を届けられるようにする。
// 選んだカードは、サーバー側でAIが自然な一文にまとめてから記録される。
import { useState } from "react";
import type { OpinionCard } from "@/lib/opinionCards";

const stanceStyle: Record<OpinionCard["stance"], string> = {
  賛成: "border-accent-green/50 bg-accent-green/5",
  反対: "border-red-300 bg-red-50",
  条件付き賛成: "border-orange-300 bg-orange-50",
  保留: "border-brand-soft bg-card",
};

export default function OpinionCardGame({
  tenantSlug,
  cards,
}: {
  tenantSlug: string;
  cards: OpinionCard[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [recordedText, setRecordedText] = useState("");

  const handleSubmit = async () => {
    if (!selectedId) return;
    setStatus("sending");
    setErrorMessage("");
    try {
      const res = await fetch(`/api/tenant/${tenantSlug}/opinion-card`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cardId: selectedId, comment }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "送信に失敗しました");
      }
      setRecordedText(body.content ?? "");
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "送信に失敗しました");
    }
  };

  if (status === "done") {
    return (
      <div className="mt-4 rounded-xl border border-accent-green/30 bg-accent-green/5 p-4">
        <p className="text-sm font-semibold text-accent-green">意見を届けました。ありがとうございます。</p>
        {recordedText && (
          <p className="mt-2 text-xs leading-relaxed text-foreground/70">
            記録された内容(AIが要約): 「{recordedText}」
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-brand-soft bg-white p-4">
      <p className="text-xs font-semibold text-foreground/70">
        しまのみんな会議 ｜ カードを1枚選んで、あなたの意見を届けてください
      </p>
      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => setSelectedId(card.id)}
            className={`rounded-xl border p-3 text-left transition ${stanceStyle[card.stance]} ${
              selectedId === card.id ? "ring-2 ring-brand" : "hover:opacity-80"
            }`}
          >
            <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[10.5px] font-bold text-foreground/70">
              {card.stance}
            </span>
            <p className="mt-1.5 text-sm font-bold text-foreground">{card.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-foreground/70">{card.description}</p>
          </button>
        ))}
      </div>

      {selectedId && (
        <div className="mt-3">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="一言コメント(任意)"
            rows={2}
            maxLength={300}
            className="w-full rounded-lg border border-brand-soft p-2 text-sm"
          />
        </div>
      )}

      {status === "error" && <p className="mt-1 text-xs text-red-600">{errorMessage}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selectedId || status === "sending"}
        className="mt-3 rounded-full bg-accent-green px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {status === "sending" ? "送信中…" : "このカードで意見を届ける"}
      </button>
    </div>
  );
}
