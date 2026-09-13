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

export const LETTER_DRAFT_SYSTEM_PROMPT = `あなたは、地域コミュニティが話し合って決めた意志をもとに、ritokei.com「読者だより」に投稿する記事の下書きを作るアシスタントです。

# 出力ルール
- 一人称(「私たちは」「〜島では」など)の、読み物として自然な文章にする(A3シートのような箇条書き中心の構成にはしない)
- 見出し案を1行目に、本文を400〜600字程度でまとめる
- 与えられた情報に無い事実や数字を勝手に作らない(不明な場合は本文に含めない)
- 「決定した意志を社会に表明する」という趣旨が伝わるよう、何を決めたか・なぜそう決めたかを具体的に書く
- 文末に「※この記事は生成AIによる下書きです。掲載前に離島経済新聞社の編集部が内容を確認します。」を1行添える`;

function buildLetterDraftUserPrompt(input: SummaryInput): string {
  return `# 論点タイトル
${input.issueTitle}

# 決定事項・議論のまとめ
${input.sourceNotes}

上記の内容から、ritokei.com「読者だより」に投稿する記事の下書きを作成してください。`;
}

export function buildSummaryUserPrompt(input: SummaryInput): string {
  if (input.mode === "letterDraft") {
    return buildLetterDraftUserPrompt(input);
  }
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

export function getSystemPrompt(mode: SummaryInput["mode"]): string {
  return mode === "letterDraft" ? LETTER_DRAFT_SYSTEM_PROMPT : SUMMARY_SYSTEM_PROMPT;
}
