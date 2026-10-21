// LLMプロバイダーの切り替え口。
//
// 使い方:
//   環境変数 SUMMARY_LLM_PROVIDER で使うモデルを指定する(未設定なら "anthropic")
//     SUMMARY_LLM_PROVIDER=anthropic     … これまで通りClaude(既定・最も安定)
//     SUMMARY_LLM_PROVIDER=sakura-llmjp  … さくらのAI Engine経由のLLM-jp(国産・オープン・無償プラン第一候補)
//
//     SUMMARY_LLM_PROVIDER=nec-cotomi    … NEC Agentic AI Cloud のcotomi(2026-10-20〜 無償貸出・評価用。期限 2026-11-30)
//
//   2026-10-19: 国産LLMは LLM-jp の1種類に絞った。cotomi v3(NEC)は提供元の審査・申請が必要、
//   PLaMoは 2.0-31B が2026-10-12にさくら側で提供終了(後継は PLaMo 3.0 Prime・有償)のため、
//   契約が整うまで選択肢から外している。再開するときは、providers/openaiCompatible.ts の
//   SakuraCotomiProvider / SakuraPlamoProvider を PROVIDERS と SELECTABLE_CHAT_PROVIDERS に戻す
//   (PLaMoは新しいモデル名に直すこと)。画面側(各ダッシュボードHTMLの #chatProvider の<option>、
//   public/js/dashboard-left-menu.js、public/kosen/*.html)にも同じ選択肢がある。
//
// 2026-10-20: NECからcotomiの無償貸出を受けたため、さくら経由ではなくNEC直接の "nec-cotomi" として追加した
//   (設定は providers/openaiCompatible.ts の NecCotomiProvider のコメント参照)。
//
// sakura-* は、環境変数 SAKURA_AI_ENGINE_API_TOKEN(コントロールパネルで発行するアカウントトークン)
// さえ設定すれば、自前でGPUをホスティングせずに試せる。
//
// 環境変数 SUMMARY_LLM_FALLBACK=true (既定) にしておくと、
// 選んだプロバイダーの呼び出しが失敗したときに自動でanthropicへフォールバックする。
// 「国産モデルがまだ不安定でも、サイトの機能自体は止めたくない」場合はこのままでよい。
// フォールバックさせずに失敗を明示的に見たい場合は SUMMARY_LLM_FALLBACK=false にする。

import { AnthropicProvider } from "./providers/anthropic";
import { NecCotomiProvider, SakuraLlmJpProvider } from "./providers/openaiCompatible";
import { LlmProviderError, type LlmProvider, type SummaryInput, type SummaryOutput } from "./types";

const PROVIDERS: Record<string, LlmProvider> = {
  anthropic: new AnthropicProvider(),
  "sakura-llmjp": SakuraLlmJpProvider,
  "nec-cotomi": NecCotomiProvider,
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
  { id: "nec-cotomi", label: "cotomi(NEC・国産)" }, // 画面の先頭=既定(2026-10-21〜)
  { id: "sakura-llmjp", label: "LLM-jp(さくら・国産)" },
  { id: "anthropic", label: "Claude(安定)" }, // cotomi/LLM-jpが失敗したときのフォールバック先でもある
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
//   3. input.mode === "dashboardUpdate" (左メニュー「反映案を作る」でのモデル選択。2026-10-04〜。
//      呼び出し元のAPI(/api/dashboard-update)が SELECTABLE_CHAT_PROVIDERS で値を検証済み)
export async function summarizeIssueWithFallback(
  input: SummaryInput,
  overrideProviderName?: string
): Promise<SummaryOutput> {
  const overrideAllowed =
    process.env.SUMMARY_LLM_ALLOW_OVERRIDE === "true" ||
    input.mode === "dashboardChat" ||
    input.mode === "dashboardUpdate";
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
