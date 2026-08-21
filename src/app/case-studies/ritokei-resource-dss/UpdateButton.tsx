"use client";
// りとけいライブダッシュボードの更新ボタン。
// パスワードを入力して送信すると、サーバー側でNotionの最新データ+LLMの
// 再生成をトリガーし、ページを再読み込みして最新内容を表示する。

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function UpdateButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/case-studies/ritokei-resource-dss/refresh", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error ?? "更新に失敗しました");
        setStatus("error");
        return;
      }
      setStatus("done");
      setPassword("");
      // サーバー側の再生成(Notion取得+LLM呼び出し)には数秒かかることがあるため、
      // 少し待ってからページを再取得する
      setTimeout(() => {
        router.refresh();
        setOpen(false);
        setStatus("idle");
      }, 1500);
    } catch {
      setErrorMsg("通信エラーが発生しました");
      setStatus("error");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          border: "1px solid #2783DE",
          background: "#E5F2FC",
          color: "#165c9d",
          borderRadius: 999,
          padding: "8px 16px",
          fontWeight: 800,
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        🔄 最新のNotion情報で更新
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 8,
        border: "1px solid #E6E5E3",
        borderRadius: 12,
        padding: 12,
        background: "#F9F8F7",
      }}
    >
      <input
        type="password"
        placeholder="更新用パスワード"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
        style={{ border: "1px solid #E6E5E3", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}
      />
      <button
        type="submit"
        disabled={status === "loading" || password.length === 0}
        style={{
          border: "1px solid #2783DE",
          background: status === "loading" ? "#F9F8F7" : "#2783DE",
          color: status === "loading" ? "#7D7A75" : "#fff",
          borderRadius: 999,
          padding: "6px 14px",
          fontWeight: 800,
          fontSize: 13,
          cursor: status === "loading" ? "default" : "pointer",
        }}
      >
        {status === "loading" ? "更新中…(数秒かかります)" : status === "done" ? "反映中…" : "更新する"}
      </button>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setErrorMsg("");
          setStatus("idle");
        }}
        style={{ border: "none", background: "none", color: "#7D7A75", fontSize: 12, cursor: "pointer" }}
      >
        キャンセル
      </button>
      {status === "error" && <p style={{ color: "#E56458", fontSize: 12, margin: 0, width: "100%" }}>{errorMsg}</p>}
    </form>
  );
}
