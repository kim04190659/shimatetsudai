// さくらのAI Engine経由の国産モデル(LLM-jp/cotomi/PLaMo)とClaudeの出力を、
// 同じ入力で並べて比較するための評価スクリプト。
//
// 使い方:
//   1. .env.local に以下を設定する
//        SUMMARY_LLM_ALLOW_OVERRIDE=true
//        SAKURA_AI_ENGINE_API_TOKEN=<さくらのAI Engineコントロールパネルで発行したアカウントトークン>
//   2. `npm run dev` でローカルサーバーを起動しておく
//   3. `node scripts/compare-llm-summary.mjs` を実行する
//
// サンプルの論点データ(渡名喜村・保育インフラの空洞化)で、
// anthropic(Claude)・sakura-llmjp・sakura-cotomi の出力を並べて表示する。
// 国産モデルの出力が明らかに崩れている/事実と違う場合は、
// SUMMARY_LLM_PROVIDER を anthropic に戻すだけで本番は安全に戻せる。

const API_URL = process.env.COMPARE_API_URL ?? "http://localhost:3000/api/issue-summary";

const SAMPLE_INPUT = {
  issueTitle: "保育・幼児教育インフラの空洞化",
  sourceNotes: `渡名喜村。2019年度に約8.5億円(ハード交付金)で整備した保育スペース付き施設が6年以上利用ゼロ。
村立幼稚園も在籍園児ゼロで実質休園状態。
施設整備だけでは解決しない運営モデル・人材確保の課題がある。
人口約317人、高齢化率44.1%、若い子育て世帯の転入が少ない。`,
  relatedIndicators: ["社会増減(転入-転出)"],
};

const PROVIDERS_TO_COMPARE = ["anthropic", "sakura-llmjp", "sakura-cotomi"];

async function callSummaryApi(provider) {
  const started = Date.now();
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...SAMPLE_INPUT, provider }),
    });
    const elapsedMs = Date.now() - started;

    if (!res.ok) {
      const errText = await res.text();
      return { provider, ok: false, elapsedMs, error: errText };
    }
    const data = await res.json();
    return { provider, ok: true, elapsedMs, ...data };
  } catch (err) {
    return { provider, ok: false, elapsedMs: Date.now() - started, error: String(err) };
  }
}

async function main() {
  console.log("=== LLM要約の比較評価 ===");
  console.log(`API: ${API_URL}`);
  console.log(`論点: ${SAMPLE_INPUT.issueTitle}\n`);

  for (const provider of PROVIDERS_TO_COMPARE) {
    const result = await callSummaryApi(provider);
    console.log(`\n----- provider指定: ${provider} -----`);
    if (!result.ok) {
      console.log(`❌ 失敗 (${result.elapsedMs}ms): ${result.error}`);
      continue;
    }
    console.log(`✅ 実際に使われたプロバイダー: ${result.provider} (${result.model})`);
    console.log(`所要時間: ${result.elapsedMs}ms\n`);
    console.log(result.draft);
  }

  console.log(
    "\n出力を見比べて、国産モデルの品質が十分でなければ .env.local の SUMMARY_LLM_PROVIDER を anthropic のままにしておけば、本番には影響しません。"
  );
}

main();
