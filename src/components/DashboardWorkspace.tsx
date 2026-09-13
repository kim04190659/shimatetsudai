"use client";

// 意思決定支援ダッシュボードの3ペイン構成(左: 資料投入／中央: ダッシュボード／右: 質問チャット)。
// 2026-09-13 鯨本さん(離島経済新聞社)からの追加依頼で、それまでの単純な1本フォーム(DashboardDraftForm)を
// 置き換える形で作成した。
// - 左の「資料投入エリア」に論点タイトルと資料テキストを貼り付けて「ダッシュボードに反映する」を押すと、
//   既存の /api/issue-summary を呼び出し、結果を中央のダッシュボードに反映する。
//   テキストの貼り付けに加えて、.txt/.md/.pdf ファイルのアップロードにも対応している
//   (.txt/.mdはブラウザ側でそのまま読み込み、.pdfは新設の /api/extract-document でAIに文字起こしさせる)。
// - 右の「質問チャット」では、中央に表示されているダッシュボードの内容について質問すると、
//   新設の /api/dashboard-chat がその内容にもとづいて回答する。
//   日本語入力(IME)で変換確定のEnterを押したときに誤って送信されないよう、
//   IME変換中(isComposing)のEnterは無視するようにしている。
// - 左右のパネルは、それぞれ独立して折りたためる(スマホ幅では縦積みになる)。
import { useState } from "react";

type ChatMessage = { role: "user" | "ai"; text: string };

type DashboardState = {
  title: string;
  draft: string;
  provider: string;
  model: string;
};

function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      // "data:application/pdf;base64,xxxx" の先頭部分を取り除く
      const base64 = result.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function DashboardWorkspace() {
  // 左パネル: 資料投入エリア
  const [issueTitle, setIssueTitle] = useState("");
  const [sourceNotes, setSourceNotes] = useState("");
  const [genStatus, setGenStatus] = useState<"idle" | "loading" | "error">("idle");
  const [fileStatus, setFileStatus] = useState<"idle" | "reading" | "error">("idle");
  const [leftOpen, setLeftOpen] = useState(true);

  // 中央: ダッシュボード本体
  const [dashboard, setDashboard] = useState<DashboardState | null>(null);

  // 右パネル: 質問チャット
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [chatStatus, setChatStatus] = useState<"idle" | "loading">("idle");
  const [rightOpen, setRightOpen] = useState(true);

  function appendToSourceNotes(text: string) {
    setSourceNotes((prev) => (prev.trim() ? `${prev}\n\n${text}` : text));
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 同じファイルを続けて選び直せるようにする
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isTextLike =
      file.type.startsWith("text/") ||
      file.name.toLowerCase().endsWith(".txt") ||
      file.name.toLowerCase().endsWith(".md");

    if (!isPdf && !isTextLike) {
      setFileStatus("error");
      return;
    }

    setFileStatus("reading");
    try {
      if (isTextLike) {
        const text = await readTextFile(file);
        appendToSourceNotes(text);
      } else {
        const dataBase64 = await readFileAsBase64(file);
        const res = await fetch("/api/extract-document", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ fileName: file.name, mimeType: "application/pdf", dataBase64 }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        appendToSourceNotes(data.text);
      }
      setFileStatus("idle");
    } catch {
      setFileStatus("error");
    }
  }

  async function handleReflect(e: React.FormEvent) {
    e.preventDefault();
    if (genStatus === "loading") return;
    setGenStatus("loading");
    try {
      const res = await fetch("/api/issue-summary", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ issueTitle, sourceNotes }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDashboard({ title: issueTitle, draft: data.draft, provider: data.provider, model: data.model });
      setGenStatus("idle");
      // 資料を反映し直したら、前のダッシュボードに対する質問履歴はリセットする
      setMessages([]);
    } catch {
      setGenStatus("error");
    }
  }

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || !dashboard || chatStatus === "loading") return;
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setQuestion("");
    setChatStatus("loading");
    try {
      const res = await fetch("/api/dashboard-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          issueTitle: dashboard.title,
          dashboardContent: dashboard.draft,
          question: q,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "ai", text: data.draft }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "すみません、回答の生成に失敗しました。時間をおいて再度お試しください。" },
      ]);
    } finally {
      setChatStatus("idle");
    }
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      {/* 左: 資料投入エリア */}
      <div className={leftOpen ? "w-full lg:w-80 lg:shrink-0" : "w-full lg:w-auto"}>
        <div className="rounded-2xl border border-brand-soft bg-card">
          <button
            type="button"
            onClick={() => setLeftOpen((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-brand-dark"
          >
            <span>📥 資料投入エリア</span>
            <span className="text-xs font-normal text-foreground/50">{leftOpen ? "折りたたむ" : "開く"}</span>
          </button>
          {leftOpen && (
            <form onSubmit={handleReflect} className="flex flex-col gap-3 border-t border-brand-soft p-4">
              <div>
                <label htmlFor="dw-issueTitle" className="block text-xs font-semibold text-foreground/70">
                  論点のタイトル
                </label>
                <input
                  id="dw-issueTitle"
                  required
                  placeholder="例: 生活航路の維持をどう支えるか"
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-brand-soft bg-white px-3 py-2 text-base outline-none focus:border-brand sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="dw-sourceNotes" className="block text-xs font-semibold text-foreground/70">
                  資料・議事録・ヒアリングメモなど(テキストを貼り付け)
                </label>
                <textarea
                  id="dw-sourceNotes"
                  required
                  rows={8}
                  placeholder="ここに議事録やメモの文章を貼り付けてください"
                  value={sourceNotes}
                  onChange={(e) => setSourceNotes(e.target.value)}
                  className="mt-1 w-full resize-none rounded-xl border border-brand-soft bg-white px-3 py-2 text-base outline-none focus:border-brand sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="dw-fileUpload" className="block text-xs font-semibold text-foreground/70">
                  または、ファイルをアップロード(.txt / .md / .pdf)
                </label>
                <input
                  id="dw-fileUpload"
                  type="file"
                  accept=".txt,.md,.pdf,text/plain,text/markdown,application/pdf"
                  onChange={handleFileSelected}
                  disabled={fileStatus === "reading"}
                  className="mt-1 w-full text-xs text-foreground/70 file:mr-3 file:rounded-full file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-dark disabled:opacity-40"
                />
                {fileStatus === "reading" && (
                  <p className="mt-1 text-xs text-foreground/50">
                    ファイルを読み込んでいます…(PDFはAIによる文字起こしに30秒ほどかかります)
                  </p>
                )}
                {fileStatus === "error" && (
                  <p className="mt-1 text-xs text-red-600">
                    ファイルの読み込みに失敗しました。.txt / .md / .pdf のいずれかをお試しください。
                  </p>
                )}
              </div>
              {genStatus === "error" && (
                <p className="text-xs text-red-600">生成中にエラーが発生しました。時間をおいて再度お試しください。</p>
              )}
              <button
                type="submit"
                disabled={genStatus === "loading"}
                className="rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-40"
              >
                {genStatus === "loading" ? "反映中…(30秒ほど)" : "この内容をダッシュボードに反映する"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 中央: ダッシュボード本体 */}
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl border border-brand-soft bg-white p-5">
          {!dashboard ? (
            <p className="text-sm leading-relaxed text-foreground/60">
              左側の「資料投入エリア」に、論点のタイトルと議事録・メモの文章(または.txt/.md/.pdfファイル)を
              追加して「ダッシュボードに反映する」を押すと、ここに意思決定支援ダッシュボードの下書きが表示されます。
            </p>
          ) : (
            <div>
              <p className="text-xs font-semibold text-foreground/60">
                {dashboard.title}(AIによる下書き / {dashboard.provider} / {dashboard.model})
              </p>
              <pre className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {dashboard.draft}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* 右: 質問チャットエリア */}
      <div className={rightOpen ? "w-full lg:w-72 lg:shrink-0" : "w-full lg:w-auto"}>
        <div className="rounded-2xl border border-brand-soft bg-card">
          <button
            type="button"
            onClick={() => setRightOpen((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-brand-dark"
          >
            <span>💬 ダッシュボードに質問する</span>
            <span className="text-xs font-normal text-foreground/50">{rightOpen ? "折りたたむ" : "開く"}</span>
          </button>
          {rightOpen && (
            <div className="border-t border-brand-soft p-4">
              <div className="max-h-72 space-y-3 overflow-y-auto text-sm">
                {messages.length === 0 && (
                  <p className="text-xs leading-relaxed text-foreground/50">
                    {dashboard
                      ? "ダッシュボードの内容について、気になることを質問できます。(例: 「懸念点は?」)"
                      : "先に左側の資料投入エリアからダッシュボードを作成すると、質問できるようになります。"}
                  </p>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                    <span
                      className={`inline-block max-w-[90%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                        m.role === "user"
                          ? "bg-brand text-white"
                          : "border border-brand-soft bg-white text-foreground/90"
                      }`}
                    >
                      {m.text}
                    </span>
                  </div>
                ))}
                {chatStatus === "loading" && (
                  <p className="text-left text-xs text-foreground/50">考え中…</p>
                )}
              </div>
              <form onSubmit={handleAsk} className="mt-3 flex gap-2">
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    // 日本語入力(IME)で変換を確定するEnterで誤送信しないようにする。
                    // isComposing(またはkeyCode===229、古いSafari向けのフォールバック)の間は
                    // Enterのデフォルト動作(フォーム送信)を止める。
                    if (e.key === "Enter" && (e.nativeEvent.isComposing || e.keyCode === 229)) {
                      e.preventDefault();
                    }
                  }}
                  placeholder={dashboard ? "質問を入力…" : "先にダッシュボードを作成してください"}
                  disabled={!dashboard}
                  className="w-full rounded-full border border-brand-soft bg-white px-3 py-2 text-sm outline-none focus:border-brand disabled:opacity-40"
                />
                <button
                  type="submit"
                  disabled={!dashboard || chatStatus === "loading" || question.trim() === ""}
                  className="shrink-0 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-dark disabled:opacity-40"
                >
                  送信
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
