// OpenAI互換API(POST {baseUrl}/chat/completions)形式でLLMを呼び出す共通プロバイダー。
// vLLM等の自前ホスティングにも、さくらのAI Engineのようなマネージドサービスにも使える。

import { getSystemPrompt, buildSummaryUserPrompt } from "../prompt";
import { LlmProviderError, type LlmProvider, type SummaryInput, type SummaryOutput } from "../types";

type OpenAiCompatibleConfig = {
  providerName: string;
  baseUrl: string;
  apiKey: string;
  model: string;
};

export function createOpenAiCompatibleProvider(config: OpenAiCompatibleConfig): LlmProvider {
  return {
    name: config.providerName,
    async summarizeIssue(input: SummaryInput): Promise<SummaryOutput> {
      if (!config.baseUrl) {
        throw new LlmProviderError(config.providerName, "APIのベースURLが未設定です");
      }
      if (!config.model) {
        throw new LlmProviderError(config.providerName, "モデル名が未設定です");
      }

      let res: Response;
      try {
        res = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(config.apiKey ? { authorization: `Bearer ${config.apiKey}` } : {}),
          },
          body: JSON.stringify({
            model: config.model,
            max_tokens: input.mode === "dashboardUpdate" ? 4096 : 1024,
            messages: [
              { role: "system", content: getSystemPrompt(input.mode) },
              { role: "user", content: buildSummaryUserPrompt(input) },
            ],
          }),
          // ホスティング先によっては初回応答が遅いことがあるため、余裕を持ったタイムアウトにする
          signal: AbortSignal.timeout(60_000),
        });
      } catch (err) {
        throw new LlmProviderError(config.providerName, "APIへの接続に失敗しました", err);
      }

      if (!res.ok) {
        const errText = await res.text();
        throw new LlmProviderError(config.providerName, `APIエラー(${res.status}): ${errText}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) {
        throw new LlmProviderError(config.providerName, "応答からテキストを取得できませんでした");
      }

      return { draft: text, provider: config.providerName, model: config.model };
    },
  };
}

// --- さくらのAI Engine ---
// https://ai.sakura.ad.jp/sakura-ai/ai-engine/
// OpenAI互換のChat Completions APIを、国内データセンター完結・複数の基盤モデル(国産含む)で提供するサービス。
// 自前でGPUを用意する必要がなく、月3,000リクエストまでの無償プランがあるため、
// Tanukiの自前ホスティングよりまずこちらで実証するのが現実的。
//
// 必要な環境変数:
//   SAKURA_AI_ENGINE_API_TOKEN … コントロールパネルで発行する「アカウントトークン」(<UUID>:<シークレット>形式)
//
// 参考: 2026年3月時点でさくらのAI Engineが提供する主なテキスト生成モデル
//   - llm-jp-3.1-8x13b-instruct4 (LLM-jp / 国立情報学研究所系, 国産MoEモデル)
//   - cotomi v3 (NEC, 久地井先生が挙げていた国産モデル。個別問い合わせプランの可能性あり、要確認)
//   - PLaMo 2.0-31B (Preferred Networks, 国産。同じく要確認)
//   - gpt-oss-120b (OpenAIのオープンソース版。無償プラン対象と明記されているが国産ではない)
const SAKURA_AI_ENGINE_BASE_URL = "https://api.ai.sakura.ad.jp/v1";

function sakuraProvider(providerName: string, model: string): LlmProvider {
  return createOpenAiCompatibleProvider({
    providerName,
    baseUrl: process.env.SAKURA_AI_ENGINE_BASE_URL ?? SAKURA_AI_ENGINE_BASE_URL,
    apiKey: process.env.SAKURA_AI_ENGINE_API_TOKEN ?? "",
    model,
  });
}

// 国産・オープンなMoEモデル。無償プランでの実証における第一候補。
export const SakuraLlmJpProvider = sakuraProvider("sakura-llmjp", "llm-jp-3.1-8x13b-instruct4");

// 【現在は未使用(index.tsのPROVIDERSに登録していない)】提供元の審査・申請が必要なため、契約が整うまで外している。
// 久地井先生が挙げていたNEC cotomi。さくらのAI Engine経由なら自前ホスティング不要で試せる。
export const SakuraCotomiProvider = sakuraProvider("sakura-cotomi", "cotomi v3");

// 【現在は未使用】PLaMo 2.0-31B は2026-10-12にさくら側で提供終了。後継は「PLaMo 3.0 Prime」(有償・クローズド)。
// 再開するときはモデル名を新しいものに直してからPROVIDERSに登録すること。
// Preferred NetworksのPLaMo。比較用の3つ目の選択肢として。
export const SakuraPlamoProvider = sakuraProvider("sakura-plamo", "PLaMo 2.0-31B");

// --- NEC Agentic AI Cloud(cotomi) ---
// 2026-10-20〜 NECから無償貸出(テナントRP000013、期間 2026/10/20〜2026/11/30、評価・検証目的のみ)。
// 仕様(マニュアル「Chat Completions API」): POST https://<FQDN>/aa-oai-api/v1/chat/completions、認証は Bearer。
// 必要な環境変数(Vercel):
//   NEC_AGENTIC_AI_BASE_URL … 管理ポータルのAPI画面に表示されるエンドポイント。"/chat/completions" の手前まで
//                              (例: https://<FQDN>/aa-oai-api/v1)
//   NEC_AGENTIC_AI_API_KEY  … 管理ポータルで確認するAPIキー
//   NEC_AGENTIC_AI_MODEL    … 使うcotomiのモデルID。管理ポータル/マニュアルで確認(未設定時はマニュアル例の cotomi-fast-v2.0)
//   NEC_COTOMI_VALID_UNTIL  … 利用期限(YYYY-MM-DD)。未設定なら 2026-11-30。過ぎたら呼ばずに失敗させ、Claudeへ自動で切り替える
// 無償貸出の条件: 商用案件では使わない / 大量・同時リクエストをしない / 月間コスト上限の目安5万円 / 期間後は環境が削除される。
// cotomi v4 は temperature 1.0 推奨で、ガイド記載外のパラメータ指定は禁止のため、本プロバイダーはtemperatureを送らない。
export const NecCotomiProvider: LlmProvider = {
  name: "nec-cotomi",
  async summarizeIssue(input: SummaryInput): Promise<SummaryOutput> {
    const until = process.env.NEC_COTOMI_VALID_UNTIL ?? "2026-11-30";
    if (Date.now() > new Date(`${until}T23:59:59+09:00`).getTime()) {
      throw new LlmProviderError("nec-cotomi", `無償貸出の利用期限(${until})を過ぎたため呼び出しません`);
    }
    if (!process.env.NEC_AGENTIC_AI_API_KEY) {
      throw new LlmProviderError("nec-cotomi", "NEC_AGENTIC_AI_API_KEY が未設定です");
    }
    return createOpenAiCompatibleProvider({
      providerName: "nec-cotomi",
      baseUrl: process.env.NEC_AGENTIC_AI_BASE_URL ?? "",
      apiKey: process.env.NEC_AGENTIC_AI_API_KEY,
      model: process.env.NEC_AGENTIC_AI_MODEL ?? "cotomi-fast-v2.0",
    }).summarizeIssue(input);
  },
};
