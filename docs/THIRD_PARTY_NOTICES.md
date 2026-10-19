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
