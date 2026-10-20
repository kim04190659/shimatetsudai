# 利用しているAIモデルとライセンス(第三者表示)

画面側の表示は `public/js/llm-license-note.js`(選択時の注記)と `public/legal/third-party-notices.html`(詳細ページ)。
モデルを追加・差し替えるときは、この3か所を同時に更新すること。

## LLM-jp-3.1-8x13b-instruct4

- 開発元: 国立情報学研究所 大規模言語モデル研究開発センター(LLM-jp)
- ライセンス: Apache License, Version 2.0 (https://www.apache.org/licenses/LICENSE-2.0)
- 入手先: https://huggingface.co/llm-jp/llm-jp-3.1-8x13b-instruct4
- 利用方法: さくらのAI Engine(OpenAI互換API)経由。モデルの改変・再配布なし。
- 確認日: 2026-10-20(Hugging Faceのモデルカードの `license: apache-2.0` と License 節)

守ること(Apache 2.0):
- 利用者に見える場所で、モデル名・開発元・ライセンスを示す(画面の注記と詳細ページで対応)。
- モデルの重み・コードを自前で配布する場合は、ライセンス全文と NOTICE を同梱し、改変したら改変した旨を明記する。
- 開発元の名称・ロゴを、推奨・保証の印象を与える形で使わない。
- 公式のモデルカードは「安全性・人の意図との整合は十分に調整されていない」と明記している。出力は人が確認してから使う(左メニューは確認後に保存する設計)。

注意: 学習データ側のライセンスはモデルカードに個別の記載がない。公募・契約で確認を求められたら、NIIに問い合わせる。

## cotomi(NEC) — Agentic AI Cloud 無償貸出

- 提供元: 日本電気株式会社(NEC) Agentic AI Cloud。テナント RP000013、利用者 木村好孝、サービス種別 Limited Edition、RAGなし
- 期間: 2026/10/20〜2026/11/30(最大3か月・延長不可)。期間後は翌日以降に環境が事前通告なく削除される。正式契約への移行はできない(新規契約が必要)
- 条件: 評価・検証目的のみ。商用案件(対価を得る案件)には使えず、貸出期間中に生成した結果の商用案件への利用も禁止。大量・同時の負荷試験は不可。月間コストの上限の目安は5万円(トークン度数×10円)。保守サポートなし
- コード: `src/lib/llm/providers/openaiCompatible.ts` の `NecCotomiProvider`。環境変数 `NEC_AGENTIC_AI_BASE_URL` / `NEC_AGENTIC_AI_API_KEY` / `NEC_AGENTIC_AI_MODEL` / `NEC_COTOMI_VALID_UNTIL`(既定 2026-11-30)
- 期限後は自動で呼び出しを止めてClaudeに切り替える。11/30以降は画面の選択肢も外すこと(HTMLの `nec-cotomi` の<option>、`src/lib/llm/index.ts`)
