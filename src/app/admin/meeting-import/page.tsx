"use client";

// 管理者画面：議事録取り込みフロー
// 「イシュー叩き台自動生成パイプライン設計書」フェーズ1の操作フローに対応。
//
// 1. 分室スタッフが対象Issue・対象ミーティングノートのページIDを入力
// 2. 「取り込み実行」→ バックエンドがNotion APIで議事録を取得しAIで構造化
// 3. 画面上でプレビュー表示し、人が内容を確認・修正してから確定(このステップは省略しない)
// 4. 確定後、Notion APIで各DBに書き込み、ダッシュボードを再生成
//
// 本格的なロール別ログイン(Supabase Auth)は別CRで対応予定。それまでの仮運用として、
// 共有シークレットをブラウザに保存して x-admin-key ヘッダで送る簡易ゲートを使う。

import { useState } from "react";

type Stance = "賛成" | "反対" | "条件付き賛成" | "保留";
type GoalType = "need" | "offer" | "seek";

type StructuredEvidence = { title: string; summary: string };
type StructuredPosition = { title: string; content: string; stance: Stance };
type StructuredGoal = { title: string; content: string; goalType: GoalType };
type StructuredAgreement = { title: string; summary: string; opposingSummary?: string };

type StructuredMeetingResult = {
  evidence: StructuredEvidence[];
  positions: StructuredPosition[];
  goals: StructuredGoal[];
  agreements: StructuredAgreement[];
};

type IssueRelationTargets = {
  issueTitle: string;
  evidenceDataSourceId: string | null;
  positionDataSourceId: string | null;
  goalDataSourceId: string | null;
  agreementDataSourceId: string | null;
};

const ADMIN_KEY_STORAGE = "shimatetsudai_admin_key";

function getAdminKey(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(ADMIN_KEY_STORAGE) ?? "";
}

export default function MeetingImportPage() {
  const [adminKey, setAdminKey] = useState(getAdminKey());
  const [issuePageId, setIssuePageId] = useState("");
  const [meetingNotePageId, setMeetingNotePageId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targets, setTargets] = useState<IssueRelationTargets | null>(null);
  const [structured, setStructured] = useState<StructuredMeetingResult | null>(null);
  const [transcriptPreview, setTranscriptPreview] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<{ writtenCount: number; dashboardRevalidated: boolean; tenantSlug: string | null } | null>(null);

  function saveAdminKey(v: string) {
    setAdminKey(v);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ADMIN_KEY_STORAGE, v);
    }
  }

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    setResult(null);
    setStructured(null);
    try {
      const res = await fetch("/api/admin/meeting-import/analyze", {
        method: "POST",
        headers: { "content-type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ issuePageId, meetingNotePageId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "取り込みに失敗しました");
      setTargets(data.targets);
      setStructured(data.structured);
      setTranscriptPreview(data.transcriptPreview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "予期しないエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!structured || !targets) return;
    setConfirming(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/meeting-import/confirm", {
        method: "POST",
        headers: { "content-type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ issuePageId, targets, confirmed: structured }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "確定処理に失敗しました");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "予期しないエラーが発生しました");
    } finally {
      setConfirming(false);
    }
  }

  function updateEvidence(i: number, patch: Partial<StructuredEvidence>) {
    if (!structured) return;
    const next = [...structured.evidence];
    next[i] = { ...next[i], ...patch };
    setStructured({ ...structured, evidence: next });
  }
  function removeEvidence(i: number) {
    if (!structured) return;
    setStructured({ ...structured, evidence: structured.evidence.filter((_, idx) => idx !== i) });
  }
  function updatePosition(i: number, patch: Partial<StructuredPosition>) {
    if (!structured) return;
    const next = [...structured.positions];
    next[i] = { ...next[i], ...patch };
    setStructured({ ...structured, positions: next });
  }
  function removePosition(i: number) {
    if (!structured) return;
    setStructured({ ...structured, positions: structured.positions.filter((_, idx) => idx !== i) });
  }
  function updateGoal(i: number, patch: Partial<StructuredGoal>) {
    if (!structured) return;
    const next = [...structured.goals];
    next[i] = { ...next[i], ...patch };
    setStructured({ ...structured, goals: next });
  }
  function removeGoal(i: number) {
    if (!structured) return;
    setStructured({ ...structured, goals: structured.goals.filter((_, idx) => idx !== i) });
  }
  function updateAgreement(i: number, patch: Partial<StructuredAgreement>) {
    if (!structured) return;
    const next = [...structured.agreements];
    next[i] = { ...next[i], ...patch };
    setStructured({ ...structured, agreements: next });
  }
  function removeAgreement(i: number) {
    if (!structured) return;
    setStructured({ ...structured, agreements: structured.agreements.filter((_, idx) => idx !== i) });
  }

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "28px 20px", fontFamily: "sans-serif", lineHeight: 1.6 }}>
      <h1 style={{ fontSize: 22, fontWeight: 900 }}>議事録取り込みフロー</h1>
      <p style={{ color: "#666", fontSize: 13 }}>
        録音・文字起こしはNotion側(AIミーティングノート)で完了している前提です。ここでは、その文字起こし結果をIssueに紐づく各DB(EvidenceRecord/PositionRecord/StakeholderGoal/Agreement)へ、内容を確認しながら反映します。
      </p>

      <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, marginTop: 16 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
          管理者アクセスキー(共有シークレット)
        </label>
        <input
          type="password"
          value={adminKey}
          onChange={(e) => saveAdminKey(e.target.value)}
          placeholder="未設定運用の場合は空欄のままでOK"
          style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
        />
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, marginTop: 16 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>対象IssueのページID</label>
        <input
          value={issuePageId}
          onChange={(e) => setIssuePageId(e.target.value)}
          placeholder="Notionページ URL/IDをそのまま貼り付け可"
          style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
        />
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, margin: "12px 0 4px" }}>
          対象ミーティングノートのページID
        </label>
        <input
          value={meetingNotePageId}
          onChange={(e) => setMeetingNotePageId(e.target.value)}
          placeholder="AIミーティングノートのページ URL/ID"
          style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
        />
        <button
          onClick={handleAnalyze}
          disabled={loading || !issuePageId || !meetingNotePageId}
          style={{
            marginTop: 14,
            padding: "10px 18px",
            borderRadius: 999,
            border: "none",
            background: loading ? "#999" : "#2783DE",
            color: "#fff",
            fontWeight: 800,
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "取り込み中…" : "取り込み実行"}
        </button>
      </section>

      {error && (
        <div style={{ marginTop: 16, padding: 12, background: "#FCE9E7", borderRadius: 8, color: "#a13327" }}>
          {error}
        </div>
      )}

      {targets && (
        <section style={{ marginTop: 16, fontSize: 12.5, color: "#666" }}>
          対象Issue: <b>{targets.issueTitle}</b>
          {!targets.evidenceDataSourceId && !targets.positionDataSourceId && !targets.goalDataSourceId && !targets.agreementDataSourceId && (
            <div style={{ color: "#a13327", marginTop: 6 }}>
              ⚠️ このIssueのDBから書き込み先を特定できませんでした。Issue DBのリレーション設定を確認してください。
            </div>
          )}
        </section>
      )}

      {transcriptPreview && (
        <details style={{ marginTop: 16 }}>
          <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 13 }}>取得した議事録テキスト(先頭部分)を確認する</summary>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, background: "#f7f7f7", padding: 12, borderRadius: 8, marginTop: 8 }}>
            {transcriptPreview}
          </pre>
        </details>
      )}

      {structured && (
        <>
          <h2 style={{ marginTop: 28, fontSize: 16 }}>📊 事実(EvidenceRecord) — {structured.evidence.length}件</h2>
          {structured.evidence.map((item, i) => (
            <div key={i} style={{ border: "1px solid #eee", borderRadius: 8, padding: 10, marginTop: 8 }}>
              <input
                value={item.title}
                onChange={(e) => updateEvidence(i, { title: e.target.value })}
                style={{ width: "100%", fontWeight: 700, border: "none", borderBottom: "1px solid #eee", marginBottom: 6, padding: 4 }}
              />
              <textarea
                value={item.summary}
                onChange={(e) => updateEvidence(i, { summary: e.target.value })}
                rows={2}
                style={{ width: "100%", border: "1px solid #eee", borderRadius: 6, padding: 6 }}
              />
              <button onClick={() => removeEvidence(i)} style={{ fontSize: 11, color: "#a13327", background: "none", border: "none", cursor: "pointer" }}>
                この項目を除外する
              </button>
            </div>
          ))}

          <h2 style={{ marginTop: 28, fontSize: 16 }}>🗣️ 発言(PositionRecord) — {structured.positions.length}件</h2>
          {structured.positions.map((item, i) => (
            <div key={i} style={{ border: "1px solid #eee", borderRadius: 8, padding: 10, marginTop: 8 }}>
              <input
                value={item.title}
                onChange={(e) => updatePosition(i, { title: e.target.value })}
                style={{ width: "100%", fontWeight: 700, border: "none", borderBottom: "1px solid #eee", marginBottom: 6, padding: 4 }}
              />
              <textarea
                value={item.content}
                onChange={(e) => updatePosition(i, { content: e.target.value })}
                rows={2}
                style={{ width: "100%", border: "1px solid #eee", borderRadius: 6, padding: 6 }}
              />
              <select
                value={item.stance}
                onChange={(e) => updatePosition(i, { stance: e.target.value as Stance })}
                style={{ marginTop: 6 }}
              >
                <option value="賛成">賛成</option>
                <option value="反対">反対</option>
                <option value="条件付き賛成">条件付き賛成</option>
                <option value="保留">保留</option>
              </select>
              <button onClick={() => removePosition(i)} style={{ fontSize: 11, color: "#a13327", background: "none", border: "none", cursor: "pointer", marginLeft: 10 }}>
                この項目を除外する
              </button>
            </div>
          ))}

          <h2 style={{ marginTop: 28, fontSize: 16 }}>🎯 目標(StakeholderGoal) — {structured.goals.length}件</h2>
          {structured.goals.map((item, i) => (
            <div key={i} style={{ border: "1px solid #eee", borderRadius: 8, padding: 10, marginTop: 8 }}>
              <input
                value={item.title}
                onChange={(e) => updateGoal(i, { title: e.target.value })}
                style={{ width: "100%", fontWeight: 700, border: "none", borderBottom: "1px solid #eee", marginBottom: 6, padding: 4 }}
              />
              <textarea
                value={item.content}
                onChange={(e) => updateGoal(i, { content: e.target.value })}
                rows={2}
                style={{ width: "100%", border: "1px solid #eee", borderRadius: 6, padding: 6 }}
              />
              <select
                value={item.goalType}
                onChange={(e) => updateGoal(i, { goalType: e.target.value as GoalType })}
                style={{ marginTop: 6 }}
              >
                <option value="need">need(必要としていること)</option>
                <option value="offer">offer(提供できること)</option>
                <option value="seek">seek(模索していること)</option>
              </select>
              <button onClick={() => removeGoal(i)} style={{ fontSize: 11, color: "#a13327", background: "none", border: "none", cursor: "pointer", marginLeft: 10 }}>
                この項目を除外する
              </button>
            </div>
          ))}

          <h2 style={{ marginTop: 28, fontSize: 16 }}>✅ 決定(Agreement) — {structured.agreements.length}件</h2>
          {structured.agreements.map((item, i) => (
            <div key={i} style={{ border: "1px solid #eee", borderRadius: 8, padding: 10, marginTop: 8 }}>
              <input
                value={item.title}
                onChange={(e) => updateAgreement(i, { title: e.target.value })}
                style={{ width: "100%", fontWeight: 700, border: "none", borderBottom: "1px solid #eee", marginBottom: 6, padding: 4 }}
              />
              <textarea
                value={item.summary}
                onChange={(e) => updateAgreement(i, { summary: e.target.value })}
                rows={2}
                style={{ width: "100%", border: "1px solid #eee", borderRadius: 6, padding: 6 }}
                placeholder="合意概要"
              />
              <textarea
                value={item.opposingSummary ?? ""}
                onChange={(e) => updateAgreement(i, { opposingSummary: e.target.value })}
                rows={2}
                style={{ width: "100%", border: "1px solid #eee", borderRadius: 6, padding: 6, marginTop: 6 }}
                placeholder="反対意見要約(あれば)"
              />
              <button onClick={() => removeAgreement(i)} style={{ fontSize: 11, color: "#a13327", background: "none", border: "none", cursor: "pointer" }}>
                この項目を除外する
              </button>
            </div>
          ))}

          <button
            onClick={handleConfirm}
            disabled={confirming}
            style={{
              marginTop: 24,
              padding: "12px 22px",
              borderRadius: 999,
              border: "none",
              background: confirming ? "#999" : "#46A171",
              color: "#fff",
              fontWeight: 800,
              cursor: confirming ? "default" : "pointer",
            }}
          >
            {confirming ? "書き込み中…" : "この内容でNotionに反映する"}
          </button>
        </>
      )}

      {result && (
        <div style={{ marginTop: 20, padding: 14, background: "#E8F1EC", borderRadius: 10, color: "#1f6b46" }}>
          {result.writtenCount}件をNotionに登録しました。
          {result.dashboardRevalidated
            ? `ダッシュボード(テナント: ${result.tenantSlug})のキャッシュを再生成しました。`
            : "このIssueはテナントダッシュボード(/dashboard/[slug])に未登録のため、自動再生成の対象外です。既存のcase-studies HTMLを使っている場合は、手順書のステップ通りに手動更新してください。"}
        </div>
      )}
    </div>
  );
}
