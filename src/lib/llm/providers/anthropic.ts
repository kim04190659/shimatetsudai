// これまで通り、Claude(Anthropic API)を使うプロバイダー。
// Tanuki等の国産モデルで結果が思わしくない場合に、いつでもここへ戻せるようにするための「安全な既定値」。

import { SUMMARY_SYSTEM_PROMPT, buildSummaryUserPrompt } from "../prompt";
import { LlmProviderError, type LlmProvider, type SummaryInput, type SummaryOutput } from "../types";

const MODEL = "claude-haiku-4-5-20251001";

export class AnthropicProvider implements LlmProvider {
  readonly name = "anthropic";

  async summarizeIssue(input: SummaryInput): Promise<SummaryOutput> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new LlmProviderError(this.name, "ANTHROPIC_API_KEY が未設定です");
    }

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
          max_tokens: 1024,
          system: SUMMARY_SYSTEM_PROMPT,
          messages: [{ role: "user", content: buildSummaryUserPrompt(input) }],
        }),
      });
    } catch (err) {
      throw new LlmProviderError(this.name, "APIへの接続に失敗しました", err);
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new LlmProviderError(this.name, `APIエラー: ${errText}`);
    }

    const data = await res.json();
    const text = data.content?.find((b: { type: string }) => b.type === "text")?.text;
    if (!text) {
      throw new LlmProviderError(this.name, "応答からテキストを取得できませんでした");
    }

    return { draft: text, provider: this.name, model: MODEL };
  }
}
