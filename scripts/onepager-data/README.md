# 決める人のページ（1枚）データ

`<slug>.json` から `public/case-studies/<slug>-onepager.html` を生成します（`node scripts/build-onepager.mjs`）。

必須項目: slug / org / title / dashboardTitle / decisionDate / decider / reversibility / plain[] / facts[1〜4] / north{note,candidates[]} / options[2〜3]{name,say,merits[],demerits[],feas[[観点,◎○△✕＋補足]],residents{text,ai},voice} / checks[8]{s,n} / timeline[5]{b,t,decide?} / warn / sources
任意: premise（いま動いている前提・注意書き）

- checks の並びは固定（お金／制度・補助・ルール／必要なもの／担い手／うまくいかない時の備え／住民・関係者の声／時間／後戻りのしやすさ）。s は ok / part / check / none / base。
- 決定欄は置かない。数字は根拠のあるものだけ。不明は「未算出」「未確認」「要確認」と書く。
