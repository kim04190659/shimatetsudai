"use client";

import { useState, useRef, useEffect } from "react";

type ChatMessage = { role: "user" | "assistant"; content: string };

const INITIAL_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "こんにちは。しまてつだい分室のお問い合わせ窓口です。サービスのこと、拠点スタッフのこと、取材のことなど、気になることを何でもご記入ください。",
};

export default function ContactChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [needsEmail, setNeedsEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/contact-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          contactEmail: contactEmail || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("応答の取得に失敗しました");
      }

      const data = (await res.json()) as { reply: string; canAnswer: boolean };
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      if (!data.canAnswer) {
        setNeedsEmail(true);
      }
    } catch {
      setError("エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // 日本語入力の変換確定でもEnterを使うため、素のEnterは改行のままにする。
    // 送信はShift+Enterのみ(またはボタン)で行う。IME変換中のEnterも誤送信しないようisComposingを見る。
    if (e.key === "Enter" && e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-brand-soft bg-card">
      <div className="flex min-h-[16rem] max-h-[60dvh] flex-col gap-4 overflow-y-auto p-4 sm:min-h-[20rem] sm:max-h-[28rem] sm:p-5">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-base leading-relaxed sm:text-sm ${
                m.role === "user"
                  ? "bg-brand text-white"
                  : "bg-brand-soft/50 text-foreground"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-brand-soft/50 px-4 py-3 text-sm text-foreground/60">
              入力中…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {needsEmail && (
        <div className="border-t border-brand-soft px-5 py-3">
          <label htmlFor="contactEmail" className="block text-xs font-semibold text-foreground/70">
            折り返し用のメールアドレス(任意)
          </label>
          <input
            id="contactEmail"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1 w-full rounded-xl border border-brand-soft bg-white px-3 py-2 text-base outline-none focus:border-brand sm:text-sm"
          />
        </div>
      )}

      {error && <p className="px-5 pt-2 text-xs text-red-600">{error}</p>}

      <div className="flex flex-col gap-2 border-t border-brand-soft p-3 sm:flex-row sm:items-end">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder="メッセージを入力(Shift+Enterで送信、Enterで改行)"
          className="flex-1 resize-none rounded-xl border border-brand-soft bg-white px-3 py-2 text-base outline-none focus:border-brand sm:text-sm"
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="shrink-0 touch-manipulation rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-40"
        >
          送信
        </button>
      </div>
    </div>
  );
}
