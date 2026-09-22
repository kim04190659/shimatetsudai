// LLMプロバイダーの切り替え口。
//
// 使い方:
//   環境変数 SUMMARY_LLM_PROVIDER で使うモデルを指定する(未設定なら "anthropic")
//     SUMMARY_LLM_PROVIDER=anthropic     … これまで通りClaude(既定・最も安定)
//     SUMMARY_LLM_PROVIDER=sakura-llmjp  … さくらのAI Engine経由のLLM-jp(国産・オープン・無償プラン第一候補)
//     SUMMARY_LLM_PROVIDER=sakura-cotomi … さくらのAI Engine経由のNEC cotomi v3(国産)
//     SUMMARY_LLM_PROVIDER=sakura-plamo  … さくらのAI Engine経由のPLaMo 2.0-31B(国産)
//
// いずれの sakura-* も、環境変数 SAKURA_AI_ENGINE_API_TOKEN(コントロールパネルで発行するアカウントトークン)
// さえ設定すれば、自前でGPUをホスティングせずに試せる。
//
// 環境変数 SUMMARY_LLM_FALLBACK=true (既定) にしておくと、
// 選んだプロバイダーの呼び出しが失敗したときに自動でanthropicへフォールバックする。
// 「国産モデルがまだ不安定でも、サイトの機能自体は止めたくない」場合はこのままでよい。
// フォールバックさせずに失敗を明示的に見たい場合は SUMMARY_LLM_FALLBACK=false にする。

import { AnthropicProvider } from "./providers/anthropic";
import {
  SakuraLlmJpProvider,
  SakuraCotomiProvider,
  SakuraPlamoProvider,
} from "./providers/openaiCompatible";
import { LlmProviderError, type LlmProvider, type SummaryInput, type SummaryOutput } from "./types";

const PROVIDERS: Record<string, LlmProvider> = {
  anthropic: new AnthropicProvider(),
  "sakura-llmjp": SakuraLlmJpProvider,
  "sakura-cotomi": SakuraCotomiProvider,
  "sakura-plamo": SakuraPlamoProvider,
};

function resolveProviderName(): string {
  const name = process.env.SUMMARY_LLM_PROVIDER ?? "anthropic";
  if (!(name in PROVIDERS)) {
    console.warn(`未知のSUMMARY_LLM_PROVIDER "${name}" が指定されたため、anthropicを使用します`);
    return "anthropic";
  }
  return name;
}

// ダッシュボードの質問チャット欄で、利用者が選べるLLMの一覧(表示名込み)。
// 「意思決定支援ダッシュボード作成エージェント3」の標準機能として、
// 全ダッシュボードの質問チャットUIにこの一覧をプルダウンで埋め込む(2026-09-23〜)。
// 新しいプロバイダーをPROVIDERSに追加したら、ここにも追加すること。
export const SELECTABLE_CHAT_PROVIDERS: { id: string; label: string }[] = [
  { id: "anthropic", label: "Claude(既定・安定)" },
  { id: "sakura-llmjp", label: "LLM-jp(さくら・国産)" },
  { id: "sakura-cotomi", label: "NEC cotomi v3(さくら・国産)" },
  { id: "sakura-plamo", label: "PLaMo 2.0-31B(さくら・国産)" },
];

// アプリ側から呼び出す、実際のエントリーポイント。
// 選んだプロバイダーが失敗した場合、必要ならClaudeにフォールバックし、
// どちらの結果でも「実際にどのプロバイダーで生成されたか」を返り値に含める。
//
// overrideProviderName: 呼び出し側が「今回はこのプロバイダーで試したい」を
// 明示的に指定するためのもの。次のいずれかの場合のみ有効になる
// (本番で誰でも任意のプロバイダーを叩けてしまわないようにするための安全弁)。
//   1. 環境変数 SUMMARY_LLM_ALLOW_OVERRIDE=true が設定されている(評価スクリプト向け)
//   2. input.mode === "dashboardChat" (ダッシュボードの質問チャット欄でのユーザー選択向け。
//      2026-09-23〜。選べる値は上のSELECTABLE_CHAT_PROVIDERSに限られ、PROVIDERSにない
//      名前はresolveProviderName()にフォールバックするため、任意の値を渡されても安全)
export async function summarizeIssueWithFallback(
  input: SummaryInput,
  overrideProviderName?: string
): Promise<SummaryOutput> {
  const overrideAllowed =
    process.env.SUMMARY_LLM_ALLOW_OVERRIDE === "true" || input.mode === "dashboardChat";
  const primaryName =
    overrideAllowed && overrideProviderName && overrideProviderName in PROVIDERS
      ? overrideProviderName
      : resolveProviderName();
  const fallbackEnabled = process.env.SUMMARY_LLM_FALLBACK !== "false";

  try {
    return await PROVIDERS[primaryName].summarizeIssue(input);
  } catch (err) {
    const isProviderError = err instanceof LlmProviderError;
    console.error(
      `LLMプロバイダー "${primaryName}" の呼び出しに失敗しました:`,
      isProviderError ? err.message : err
    );

    if (primaryName === "anthropic" || !fallbackEnabled) {
      throw err;
    }

    console.warn(`anthropicにフォールバックします(元のプロバイダー: ${primaryName})`);
    return PROVIDERS.anthropic.summarizeIssue(input);
  }
}

export type { SummaryInput, SummaryOutput };
