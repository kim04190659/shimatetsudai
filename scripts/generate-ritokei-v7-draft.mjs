// りとけい「420島への限られた取材・支援リソース配分」ダッシュボードの本文を、
// さくらのAI Engine経由の国産LLM(llm-jp-3.1-8x13b-instruct4 / cotomi v3)に生成させ、
// 結果をコンソールに出力するスクリプト。
//
// 使い方:
//   1. .env.local に SAKURA_AI_ENGINE_API_TOKEN が設定されていることを確認
//   2. node scripts/generate-ritokei-v7-draft.mjs を実行
//   3. 出力された2つのモデルの結果をコピーしてClaudeに貼り付ける
//      (Claudeがその結果をもとにv7のHTMLダッシュボードを作成します)

import fs from "node:fs";

function loadToken() {
  const envText = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const match = envText.match(/^SAKURA_AI_ENGINE_API_TOKEN=(.+)$/m);
  if (!match) {
    throw new Error(".env.local に SAKURA_AI_ENGINE_API_TOKEN が見つかりませんでした");
  }
  return match[1].trim();
}

const SYSTEM_PROMPT = `あなたは、NPO法人や自治体などの意思決定を支援する「A3意思決定支援ダッシュボード」の本文を作成するアシスタントです。
与えられた元データ(ミッション・現状・課題・対策案・財源設計・類似事例・補助金候補)をもとに、
会議にそのまま持ち込める形の分析文章を日本語で作成してください。

# 出力ルール
- 見出しと箇条書きを使い、次の構成にする: 「判断材料ハイライト」「提案内容ハイライト」「課題の背景」「類似事例からの示唆」「補助金・交付金の示唆」「結論・次の一手」
- 与えられた情報に無い数字や事実を勝手に作らない(不明な場合は「要確認」と明記する)
- 専門用語は避け、NPOスタッフや自治体職員が読んでも分かる言葉で書く
- 全体で1000字程度にまとめる`;

const SOURCE_NOTES = `
【対象組織】認定NPO法人 離島経済新聞社(りとけい)
【対象論点】420島への限られた取材・支援リソース配分

■ミッション
「島の宝を未来につなぐ」。島の可能性を社会に届け、島と島国の未来を支える。
4事業: 島の可能性普及啓発、島と人をつなぐ連携交流、島の魅力化促進、もしもに備える災害復興。
上位目標: 「島に愛のある関係人口」を100万人増やす。

■係数(現状)
対象カバー率: 417島(有人離島規模)、全島同一密度は非現実的、情報空白あり
関係人口形成力: +100万人目標、運営基盤が必要
現地取材持続性: 東西南北3,000km海洋エリア移動、交通費が経営を圧迫
財源安定度: 要転換。寄付・会費だけでは活動限界(最重要課題)
編集・検証品質: AIは整理・下書き、公開判断は人が担う(強みを維持)
地域担い手数: 育成必要。地域ライター・協力隊・インターンを活用
説明責任: KPI化。寄付者・自治体・助成団体へ配分根拠を提示
災害時発信網: 平時から取材網を災害時の確認・復興発信にも活用(設計必要)

■課題の優先順位
1. 財政基盤が弱く活動資金が不足(リソース配分以前に事業継続が課題)
2. 全島を同一密度で取材できない(基準なしでは不公平感)
3. 小規模・未取材島の情報空白が固定化(公共性・ミッションに反する)
4. 移動コストと編集工程が重い
5. 専任スタッフだけでは担い手不足

■対策案(推奨: 三層ハイブリッド配分)
重点取材40%・最低接点保障25%・地域ライター育成20%・AI編集基盤15%
財源: 自治体委託40%・国費連動30%・企業版ふるさと納税/協賛15%・寄付会員15%へ移行

■類似事例
ニジェールの保健施設事例: 公式な予算・行政チャネルだけでなく、自己負担・無償労働・地域の相互支援といった非公式プロセスも実際のリソース配分を支えていた。420島配分にも、拠点スタッフ・地域ライターの現場判断や島側からの持ち出し協力を組み合わせる設計が現実的。

■活用できる補助金・交付金候補
高: 関係人口創出・拡大の推進(総務省) — 「100万人」目標と直結
中: 地域公共交通確保維持改善事業・離島航路航空路補助(国交省) — 移動コスト軽減
中: 地域未来交付金(内閣官房、令和8年度160億円) — 島カルテ・AI取材デスクの財源候補

■90日アクション
30日: 島カルテ項目定義、既存/未取材島の棚卸し、自治体候補20件選定
60日: 3自治体ヒアリング、重点10島・最低接点30島で試行設計、AI取材デスク運用開始
90日: 自治体実証契約300〜500万円、企業版ふるさと納税候補10社提案、四半期説明レポート試作
`;

async function callModel(token, model) {
  const started = Date.now();
  try {
    const res = await fetch("https://api.ai.sakura.ad.jp/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 1500,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `以下の元データをもとに、A3ダッシュボードの本文を作成してください。\n\n${SOURCE_NOTES}`,
          },
        ],
      }),
    });
    const elapsed = Date.now() - started;
    if (!res.ok) {
      const errText = await res.text();
      console.log(`\n===== ${model} (失敗, ${elapsed}ms) =====`);
      console.log(errText);
      return;
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "(応答なし)";
    console.log(`\n===== ${model} (${elapsed}ms) =====`);
    console.log(text);
  } catch (err) {
    console.log(`\n===== ${model} (接続エラー) =====`);
    console.log(String(err));
  }
}

const token = loadToken();
await callModel(token, "llm-jp-3.1-8x13b-instruct4");
await callModel(token, "cotomi v3");
