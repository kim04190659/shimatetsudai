// 「しまのみんな会議」で選ばれた意見カード(+任意の一言コメント)を、
// 生成AIで自然な一人称の意見文にまとめるための、小さな専用呼び出し。
//
// ダッシュボードの論点要約(summarizeIssueWithFallback)とは目的が違うため
// あえて別関数にしている。要約用のプロバイダー切り替え(国産LLM等)は使わず、
// 常にClaude(Haiku)を使う軽量な処理として割り切っている。

import { LlmProviderError } from "./types";

const MODEL = "claude-haiku-4-5-20251001";

export type OpinionCardInput = {
  issueTitle: string;
  cardTitle: string;
  cardDescription: string;
  comment?: string;
};

export type OpinionSummaryOutput = {
  content: string;
  provider: string;
  model: string;
};

const SYSTEM_PROMPT = `あなたは、住民から寄せられた意見カードの選択結果を、議事録に残すための短い一人称の文章にまとめる担当者です。
- 選ばれたカードの立場・内容を尊重し、話を大きく変えたり誇張したりしないでください。
- 住民が実際に話しているような、自然で簡潔な日本語(2〜3文、120文字程度)にしてください。
- 一言コメントがあれば、その内容も自然に組み込んでください。
- 出力は本文のみ。前置きや見出しは不要です。`;

/** 選ばれたカードと任意コメントから、PositionRecordに記録する短い意見文を生成する */
export async function summarizeOpinionCard(input: OpinionCardInput): Promise<OpinionSummaryOutput> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // APIキーが無い場合は、AIでの言い換えをスキップしてカードの内容をそのまま使う
    // (サイトの機能自体は止めない、というこれまでの方針を踏襲)
    const fallback = input.comment
      ? `${input.cardDescription}(補足: ${input.comment})`
      : input.cardDescription;
    return { content: fallback, provider: "fallback", model: "none" };
  }

  const userPrompt = `論点: ${input.issueTitle}
選ばれたカード: ${input.cardTitle}
カードの内容: ${input.cardDescription}
一言コメント: ${input.comment && input.comment.trim() ? input.comment.trim() : "(なし)"}`;

  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
  } catch (err) {
    throw new LlmProviderError("anthropic", "APIへの接続に失敗しました", err);
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new LlmProviderError("anthropic", `APIエラー: ${errText}`);
  }

  const data = await res.json();
  const text = data.content?.find((b: { type: string }) => b.type === "text")?.text;
  if (!text) {
    throw new LlmProviderError("anthropic", "応答からテキストを取得できませんでした");
  }

  return { content: text.trim(), provider: "anthropic", model: MODEL };
}
