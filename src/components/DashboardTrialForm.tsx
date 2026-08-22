"use client";

import { useState } from "react";

type FormState = {
  areaName: string;
  organization: string;
  contactName: string;
  contactEmail: string;
  topic: string;
};

const INITIAL_STATE: FormState = {
  areaName: "",
  organization: "",
  contactName: "",
  contactEmail: "",
  topic: "",
};

export default function DashboardTrialForm() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");

    try {
      const res = await fetch("/api/dashboard-trial-application", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("送信に失敗しました");

      setStatus("done");
      setForm(INITIAL_STATE);
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-brand-soft bg-card p-5 text-sm leading-relaxed text-foreground/80">
        申請ありがとうございます。内容を確認のうえ、専用ページの準備ができ次第、
        ご記入いただいた連絡先にご連絡します。
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-brand-soft bg-card p-5"
    >
      <div>
        <label htmlFor="areaName" className="block text-xs font-semibold text-foreground/70">
          島・地域の名前
        </label>
        <input
          id="areaName"
          required
          value={form.areaName}
          onChange={(e) => update("areaName", e.target.value)}
          className="mt-1 w-full rounded-xl border border-brand-soft bg-white px-3 py-2 text-base outline-none focus:border-brand sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="organization" className="block text-xs font-semibold text-foreground/70">
          運営している団体
        </label>
        <input
          id="organization"
          required
          value={form.organization}
          onChange={(e) => update("organization", e.target.value)}
          className="mt-1 w-full rounded-xl border border-brand-soft bg-white px-3 py-2 text-base outline-none focus:border-brand sm:text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contactName" className="block text-xs font-semibold text-foreground/70">
            担当者のお名前
          </label>
          <input
            id="contactName"
            required
            value={form.contactName}
            onChange={(e) => update("contactName", e.target.value)}
            className="mt-1 w-full rounded-xl border border-brand-soft bg-white px-3 py-2 text-base outline-none focus:border-brand sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="contactEmail" className="block text-xs font-semibold text-foreground/70">
            連絡先(メールアドレス)
          </label>
          <input
            id="contactEmail"
            type="email"
            required
            value={form.contactEmail}
            onChange={(e) => update("contactEmail", e.target.value)}
            className="mt-1 w-full rounded-xl border border-brand-soft bg-white px-3 py-2 text-base outline-none focus:border-brand sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="topic" className="block text-xs font-semibold text-foreground/70">
          今、悩んでいる意思決定の論点
        </label>
        <textarea
          id="topic"
          required
          rows={4}
          placeholder="例: 限られた予算・人手を、どの地域の取り組みに優先的に配分するか、など"
          value={form.topic}
          onChange={(e) => update("topic", e.target.value)}
          className="mt-1 w-full resize-none rounded-xl border border-brand-soft bg-white px-3 py-2 text-base outline-none focus:border-brand sm:text-sm"
        />
      </div>

      {status === "error" && (
        <p className="text-xs text-red-600">
          送信中にエラーが発生しました。時間をおいて再度お試しください。
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="self-start touch-manipulation rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-40"
      >
        {status === "loading" ? "送信中…" : "この内容で申請する"}
      </button>
    </form>
  );
}
