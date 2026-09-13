"use client";

// 有料オプション①②(2026-09-13 鯨本さん(離島経済新聞社)からの依頼)を
// 分室ページに埋め込むための簡易UI。
// ①対話支援依頼: リトケイに住民ヒアリング・座談会の開催を依頼できる
// ②記事作成: 決定事項からAIが記事下書きを作り、そのままritokei.com「読者だより」への
//   掲載を依頼できる(実際の掲載可否・編集は離島経済新聞社の編集部が行う)
import { useState } from "react";

type Props = {
  branchName: string;
  issueTitle: string;
  issueSummary: string;
};

type RequestFormState = {
  contactName: string;
  contactEmail: string;
  detail: string;
};

const EMPTY_FORM: RequestFormState = { contactName: "", contactEmail: "", detail: "" };

function RequestForm({
  kind,
  branchName,
  issueTitle,
  detail,
  placeholder,
}: {
  kind: "dialogue" | "article";
  branchName: string;
  issueTitle?: string;
  detail?: string; // articleの場合、記事下書きをそのまま渡す
  placeholder: string;
}) {
  const [form, setForm] = useState<RequestFormState>({ ...EMPTY_FORM, detail: detail ?? "" });
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/support-request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind,
          branchName,
          issueTitle,
          detail: form.detail,
          contactName: form.contactName,
          contactEmail: form.contactEmail,
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="mt-3 rounded-xl border border-accent-green/30 bg-accent-green/5 p-3 text-sm text-accent-green">
        依頼を受け付けました。担当者からご連絡します。
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2 rounded-xl border border-brand-soft bg-white p-3">
      <textarea
        required
        rows={kind === "article" ? 8 : 3}
        placeholder={placeholder}
        value={form.detail}
        onChange={(e) => setForm((prev) => ({ ...prev, detail: e.target.value }))}
        className="w-full resize-none rounded-lg border border-brand-soft px-3 py-2 text-sm outline-none focus:border-brand"
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          required
          placeholder="お名前"
          value={form.contactName}
          onChange={(e) => setForm((prev) => ({ ...prev, contactName: e.target.value }))}
          className="rounded-lg border border-brand-soft px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <input
          required
          type="email"
          placeholder="連絡先メールアドレス"
          value={form.contactEmail}
          onChange={(e) => setForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
          className="rounded-lg border border-brand-soft px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </div>
      {status === "error" && (
        <p className="text-xs text-red-600">送信に失敗しました。時間をおいて再度お試しください。</p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="self-start rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-40"
      >
        {status === "sending" ? "送信中…" : "この内容で依頼する"}
      </button>
    </form>
  );
}

function ArticleDraftPanel({ issueTitle, issueSummary, branchName }: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function generateDraft() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/article-draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ issueTitle, decisionSummary: issueSummary }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDraft(data.draft as string);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {!draft && (
        <button
          type="button"
          onClick={generateDraft}
          disabled={loading}
          className="mt-3 inline-flex items-center gap-1 rounded-full border border-brand bg-white px-5 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-brand-soft/40 disabled:opacity-40"
        >
          {loading ? "下書きを作成中…" : "この決定事項から記事下書きを作る"}
        </button>
      )}
      {error && <p className="mt-2 text-xs text-red-600">下書きの生成に失敗しました。時間をおいて再度お試しください。</p>}
      {draft && (
        <div className="mt-3 rounded-xl border border-brand-soft bg-white p-4">
          <p className="text-xs font-semibold text-foreground/60">AIによる記事下書き(そのまま掲載されるわけではありません)</p>
          <pre className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{draft}</pre>
          <p className="mt-2 text-xs text-foreground/50">
            このままritokei.com「読者だより」への掲載を依頼できます。実際の掲載可否・文面の確認は離島経済新聞社の編集部が行います。
          </p>
          <RequestForm
            kind="article"
            branchName={branchName}
            issueTitle={issueTitle}
            detail={draft}
            placeholder="下書き本文(編集して依頼できます)"
          />
        </div>
      )}
    </div>
  );
}

export default function PaidSupportOptions({ branchName, issueTitle, issueSummary }: Props) {
  const [open, setOpen] = useState<"dialogue" | "article" | null>(null);

  return (
    <div className="mt-4 rounded-xl border border-dashed border-brand-soft bg-brand-soft/10 p-4">
      <p className="text-xs font-semibold tracking-wide text-brand-dark">有料オプション</p>
      <div className="mt-2 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setOpen(open === "dialogue" ? null : "dialogue")}
          className="rounded-full border border-brand-dark/30 px-4 py-2 text-xs font-semibold text-brand-dark transition hover:bg-brand-soft/40"
        >
          🗣️ リトケイに対話支援(住民ヒアリング・座談会)を依頼する
        </button>
        <button
          type="button"
          onClick={() => setOpen(open === "article" ? null : "article")}
          className="rounded-full border border-brand-dark/30 px-4 py-2 text-xs font-semibold text-brand-dark transition hover:bg-brand-soft/40"
        >
          📰 決定事項から記事を作成・読者だよりに掲載を依頼する
        </button>
      </div>

      {open === "dialogue" && (
        <RequestForm
          kind="dialogue"
          branchName={branchName}
          issueTitle={issueTitle}
          placeholder="どんな対話支援を希望しますか?(例: 航路問題について住民ヒアリングを開催してほしい)"
        />
      )}
      {open === "article" && (
        <ArticleDraftPanel branchName={branchName} issueTitle={issueTitle} issueSummary={issueSummary} />
      )}
    </div>
  );
}
