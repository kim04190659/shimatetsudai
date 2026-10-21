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
//   NEC_AGENTIC_AI_BASE_URL … 管理ポータルのAPI画面に表示されるURL(…/aa-api/v1/responses/ でも可。下のNecCotomiProviderが候補を補って試す)
//                              Chat Completions の正式な形は https://<FQDN>/aa-oai-api/v1/chat/completions
//   NEC_AGENTIC_AI_API_KEY  … 管理ポータルで確認するAPIキー
//   NEC_AGENTIC_AI_MODEL    … 使うcotomiのモデルID。管理ポータル/マニュアルで確認(未設定時はマニュアル例の cotomi-fast-v2.0)
//   NEC_COTOMI_VALID_UNTIL  … 利用期限(YYYY-MM-DD)。未設定なら 2026-11-30。過ぎたら呼ばずに失敗させ、Claudeへ自動で切り替える
// 無償貸出の条件: 商用案件では使わない / 大量・同時リクエストをしない / 月間コスト上限の目安5万円 / 期間後は環境が削除される。
// cotomi v4 は temperature 1.0 推奨で、ガイド記載外のパラメータ指定は禁止のため、本プロバイダーはtemperatureを送らない。
// 接続先URLの書き方の揺れで404にならないよう、候補を順に試す。
// 管理ポータルには Responses API のURL(…/aa-api/v1/responses/)が表示されるが、
// マニュアル上の Chat Completions のURLは …/aa-oai-api/v1/chat/completions と別系統のため、
//   1) 表示されたURLから末尾の /responses や /chat/completions を外し、aa-api → aa-oai-api に読み替えた候補
//   2) 外しただけの候補、/v1 や /aa-oai-api/v1 を補った候補
// を Chat Completions で試し、すべて404なら、設定されたURLそのままで Responses API として呼ぶ。
// 404のときだけ次の候補へ進み、成功・失敗のどちらもパス部分をログに残す(キーは出さない)。
function necBaseCandidates(raw: string): string[] {
  const given = raw.trim().replace(/\/+$/, "");
  if (!given) return [];
  const base = given.replace(/\/(responses|chat\/completions)$/, "").replace(/\/+$/, "");
  const out: string[] = [];
  if (base.includes("/aa-api/")) out.push(base.replace("/aa-api/", "/aa-oai-api/"));
  out.push(base);
  let path = "";
  try { path = new URL(base).pathname; } catch { return out; }
  if (!/\/v\d+$/.test(path)) out.push(`${base}/v1`);
  if (!path.includes("aa-oai-api") && !path.includes("aa-api")) out.push(`${base}/aa-oai-api/v1`);
  return Array.from(new Set(out));
}
function pathOf(u: string): string {
  try { const x = new URL(u); return `${x.host}${x.pathname}`; } catch { return "(URL不正)"; }
}

// Responses API(POST …/responses)で呼ぶ。Chat Completions がすべて404のときの代替。
async function callResponsesApi(url: string, apiKey: string, model: string, input: SummaryInput): Promise<SummaryOutput> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        instructions: getSystemPrompt(input.mode),
        input: buildSummaryUserPrompt(input),
      }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (err) {
    throw new LlmProviderError("nec-cotomi", "Responses APIへの接続に失敗しました", err);
  }
  if (!res.ok) {
    throw new LlmProviderError("nec-cotomi", `Responses APIエラー(${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  let text: string | undefined = typeof data.output_text === "string" ? data.output_text : undefined;
  if (!text && Array.isArray(data.output)) {
    text = data.output
      .flatMap((o: { content?: { type?: string; text?: string }[] }) => o.content ?? [])
      .filter((c: { type?: string; text?: string }) => typeof c.text === "string")
      .map((c: { text?: string }) => c.text)
      .join("");
  }
  if (!text) throw new LlmProviderError("nec-cotomi", "Responses APIの応答からテキストを取得できませんでした");
  return { draft: text, provider: "nec-cotomi", model };
}

export const NecCotomiProvider: LlmProvider = {
  name: "nec-cotomi",
  async summarizeIssue(input: SummaryInput): Promise<SummaryOutput> {
    const until = process.env.NEC_COTOMI_VALID_UNTIL ?? "2026-11-30";
    if (Date.now() > new Date(`${until}T23:59:59+09:00`).getTime()) {
      throw new LlmProviderError("nec-cotomi", `無償貸出の利用期限(${until})を過ぎたため呼び出しません`);
    }
    const apiKey = process.env.NEC_AGENTIC_AI_API_KEY;
    if (!apiKey) {
      throw new LlmProviderError("nec-cotomi", "NEC_AGENTIC_AI_API_KEY が未設定です");
    }
    const model = process.env.NEC_AGENTIC_AI_MODEL ?? "cotomi-fast-v2.0";
    const given = (process.env.NEC_AGENTIC_AI_BASE_URL ?? "").trim();
    const candidates = necBaseCandidates(given);
    if (candidates.length === 0) {
      throw new LlmProviderError("nec-cotomi", "NEC_AGENTIC_AI_BASE_URL が未設定です");
    }
    let lastErr: unknown;
    for (const baseUrl of candidates) {
      try {
        const r = await createOpenAiCompatibleProvider({ providerName: "nec-cotomi", baseUrl, apiKey, model }).summarizeIssue(input);
        console.info(`nec-cotomi: 応答OK(chat/completions) model=${model} path=${pathOf(baseUrl)}/chat/completions`);
        return r;
      } catch (err) {
        lastErr = err;
        const is404 = err instanceof LlmProviderError && err.message.includes("APIエラー(404)");
        console.warn(`nec-cotomi: 失敗 model=${model} path=${pathOf(baseUrl)}/chat/completions ${is404 ? "(404・次の候補を試します)" : ""}`);
        if (!is404) throw err;
      }
    }
    // Chat Completions がすべて404 → 設定されたURLが Responses API ならそのまま呼ぶ
    const responsesUrl = /\/responses$/.test(given.replace(/\/+$/, "")) ? given.replace(/\/+$/, "") : "";
    if (responsesUrl) {
      try {
        const r = await callResponsesApi(responsesUrl, apiKey, model, input);
        console.info(`nec-cotomi: 応答OK(responses) model=${model} path=${pathOf(responsesUrl)}`);
        return r;
      } catch (err) {
        console.warn(`nec-cotomi: 失敗(responses) model=${model} path=${pathOf(responsesUrl)}`);
        lastErr = err;
      }
    }
    throw lastErr;
  },
};
