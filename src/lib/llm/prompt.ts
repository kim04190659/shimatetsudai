// どのLLMプロバイダーでも共通で使う、A3意思決定支援シート下書き生成用のプロンプト組み立て。
// プロンプトをここに1箇所集約しておくことで、
// 「Claudeでは良い結果だったがTanukiでは崩れる」といった差分の原因を
// プロンプトの違いではなくモデルの違いに絞って比較できるようにする。

import type { SummaryInput } from "./types";

export const SUMMARY_SYSTEM_PROMPT = `あなたは、自治体・商工会・観光協会などの意思決定を支援する「A3意思決定支援シート」の下書きを作成するアシスタントです。
与えられたヒアリングメモ・住民の声・公開データをもとに、会議にそのまま持ち込める形の下書きを日本語で作成してください。

# 出力ルール
- 見出しと箇条書きを使い、次の構成にする: 「論点の背景」「賛成・推進の立場と理由」「懸念・反対の立場と理由」「関連する地域指標との関係」「次に確認すべきこと」
- 与えられた情報に無い数字や事実を勝手に作らない(不明な場合は「要確認」と明記する)
- 専門用語は避け、自治体職員や住民が読んでも分かる言葉で書く
- 全体で800字程度にまとめる`;

export function buildSummaryUserPrompt(input: SummaryInput): string {
  const indicators =
    input.relatedIndicators && input.relatedIndicators.length > 0
      ? input.relatedIndicators.join("、")
      : "特になし";

  return `# 論点タイトル
${input.issueTitle}

# 関連する地域指標
${indicators}

# ヒアリングメモ・元情報
${input.sourceNotes}

上記をもとに、A3意思決定支援シートの下書きを作成してください。`;
}
