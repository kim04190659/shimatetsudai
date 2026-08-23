"use client";

// 分室ページ自体(/branches/[slug]など)を守る、簡単なパスワード入力フォーム。
// サイト全体のトーン(Tailwind)に合わせたUIで、ダッシュボード側の
// renderTenantPasswordGateHtml(生のHTML)とは別に、React側で用意している。
import { useState } from "react";

export default function BranchPasswordGate({ slug }: { slug: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/branch/${slug}/auth`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "パスワードが正しくありません。");
        setLoading(false);
      }
    } catch {
      setError("エラーが発生しました。時間をおいて再度お試しください。");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm px-5 py-24">
      <h1 className="text-lg font-bold text-foreground">このページは非公開です</h1>
      <p className="mt-2 text-sm text-foreground/70">
        ご案内時にお伝えしたパスワードを入力してください。
      </p>
      <form onSubmit={handleSubmit} className="mt-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="パスワード"
          className="w-full rounded-lg border border-brand-soft px-3 py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={loading || password.length === 0}
          className="mt-3 w-full rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? "確認中…" : "入る"}
        </button>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </form>
    </div>
  );
}
