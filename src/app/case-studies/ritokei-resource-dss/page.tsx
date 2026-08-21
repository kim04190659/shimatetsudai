// りとけい「420島への限られた取材・支援リソース配分」ライブダッシュボード。
// v6/v7(静的HTML)と違い、このページはNotionのPositionRecord(立場表明ログ)を
// 都度キャッシュ経由で参照し、「更新」ボタンが押されたときだけ
// Notionの最新データ+国産LLM(既定: さくらのAI Engine経由のllm-jp)で再生成する。
//
// パイロット導入: りとけい1件のみ。うまくいけば屋久島・渡名喜にも展開する。

import type { Metadata } from "next";
import Link from "next/link";
import { getCachedRitokeiDashboard } from "@/lib/ritokeiDashboard";
import UpdateButton from "./UpdateButton";

export const metadata: Metadata = {
  title: "りとけい 意思決定支援ダッシュボード(ライブ版) ｜ 420島への取材・支援リソース配分",
};

const stanceColor: Record<string, string> = {
  賛成: "#1f6b46",
  反対: "#a13327",
  条件付き賛成: "#93501a",
  保留: "#5a5750",
};

export default async function RitokeiResourceDashboardPage() {
  const data = await getCachedRitokeiDashboard();

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 64px", fontFamily: "-apple-system,BlinkMacSystemFont,'Noto Sans JP',sans-serif", color: "#2C2C2B" }}>
      <Link href="/branches/ritokei" style={{ fontSize: 13, fontWeight: 700, color: "#165c9d" }}>
        ← りとけい分室に戻る
      </Link>

      <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <span style={{ fontSize: 11, letterSpacing: "0.08em", fontWeight: 800, color: "#7D7A75" }}>
            意思決定支援 ｜ ライブ版(β) ｜ 認定NPO法人 離島経済新聞社
          </span>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: "6px 0 4px" }}>{data.issueTitle}</h1>
        </div>
        <UpdateButton />
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 12,
          color: "#7D7A75",
          border: "1px dashed #E6E5E3",
          borderRadius: 10,
          padding: 10,
        }}
      >
        生成日時: {new Date(data.generatedAt).toLocaleString("ja-JP")} ／ 使用プロバイダー:{" "}
        <code>{data.generatedProvider}</code> ／ モデル: <code>{data.generatedModel}</code>
        <br />
        現地スタッフがNotion上のPositionRecord(立場表明ログ)に議事録や新しい意見を追加した後、右上の「更新」ボタンを押すと、その内容を反映して作り直されます。
      </div>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 900 }}>🇯🇵 国産LLMによる下書き</h2>
        <p style={{ fontSize: 12, color: "#7D7A75", margin: "4px 0 12px" }}>
          以下は、Notion上の論点情報と立場表明ログをもとに国産LLMが生成した下書きです。人による編集は加えていません。
          事実確認・最終的な意思決定は、これまで通り拠点スタッフ・関係者が行ってください。
        </p>
        <div
          style={{
            whiteSpace: "pre-wrap",
            fontSize: 13,
            lineHeight: 1.8,
            border: "1px solid #E6E5E3",
            borderRadius: 14,
            background: "#fff",
            padding: 18,
          }}
        >
          {data.generatedDraft}
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 900 }}>
          🗣️ 登録されている立場表明・議事録({data.positionRecords.length}件)
        </h2>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
          {data.positionRecords.length === 0 && (
            <p style={{ fontSize: 13, color: "#7D7A75" }}>まだ登録されているPositionRecordがありません。</p>
          )}
          {data.positionRecords.map((r, i) => (
            <div key={i} style={{ border: "1px solid #E6E5E3", borderRadius: 12, padding: 14, background: "#F9F8F7" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    borderRadius: 999,
                    padding: "2px 8px",
                    background: "#fff",
                    color: stanceColor[r.stance] ?? "#5a5750",
                    border: "1px solid #E6E5E3",
                  }}
                >
                  {r.stance || "立場不明"}
                </span>
                <b style={{ fontSize: 13 }}>{r.title}</b>
              </div>
              <p style={{ fontSize: 12.5, lineHeight: 1.6, margin: "8px 0 0", whiteSpace: "pre-wrap" }}>
                {r.content}
              </p>
              <p style={{ fontSize: 11, color: "#7D7A75", margin: "6px 0 0" }}>登録: {r.registeredAt}</p>
            </div>
          ))}
        </div>
      </section>

      <p style={{ marginTop: 28, fontSize: 11, color: "#7D7A75" }}>
        ※ このページはパイロット版です。財源設計・類似事例・補助金候補などの詳細タブは、これまで通り
        <a href="/case-studies/ritokei-resource-dss-v7.html" style={{ color: "#165c9d" }}>
          v7(静的版)
        </a>
        をご参照ください。
      </p>
    </div>
  );
}
