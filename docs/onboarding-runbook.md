# 🧭 新しい島をオンボーディングする手順（Setup-san実行用ランブック）

> 2026-08-16に渡名喜村で実際に行った作業を、他の島にも展開できるよう手順化したもの。Setup-san（もしくは同等のツールアクセスを持つ生成AI）がこの手順を読んで実行できるよう、具体的なツール操作・注意点・確認クエリを明記する。
>
> **2026-08-18更新**：Phase 4（ダッシュボード作成）を、渡名喜・屋久島（2件）・りとけいの4ページを実際に作った経験をもとに全面改訂。旧「4タブ固定」は廃止し、新しい「6タブ標準フォーマット」に統一した。Phase 4の詳細手順・SQLテンプレート・データソースIDは、このリポジトリではなくNotion側の姉妹ドキュメントに集約している（→[🏁 意思決定支援ダッシュボード 作成手順書](https://app.notion.com/p/3c0960a91e2381f59673c810bf47cca5)）。このランブックとNotion側のどちらか一方だけを更新すると内容がズレるので、Phase 4を触るときは必ず両方を見比べてから直すこと。

## ⚠️ 重要：現在のSetup-sanとのギャップ

現在のSetup-san（`pages/api/chat.js` + `lib/intentMap.js`）は、Claude Haikuでの対話と、てつだって側API（`tetsudatteClient.js`）への限定的な呼び出ししかできない。以下の手順は **Notion APIへの広範な書き込み、複数リポジトリのコード編集、npm build、git commit** を伴うため、現在のSetup-san単体では実行できない。

- **今すぐSetup-sanが担える部分**: Phase 0のヒアリング（対話で島の基本情報・課題テーマを集める）のみ
- **将来的にSetup-sanに持たせるなら**: Notion MCP相当のツールアクセスと、GitHub API経由でのファイル編集（PR作成）権限が必要
- **当面の現実的な使い方**: Setup-sanがPhase 0を対話でやり、その結果をこのランブックと一緒にClaude（Cowork）に渡してPhase 1以降を実行させる、という分業が現実的

---

## Phase 0：事前ヒアリング（Setup-sanが対話で集める）

次の5項目を確定させる。

1. 島名・都道府県（例：渡名喜村・沖縄県島尻郡）
2. 基本統計（人口・高齢化率・特徴的な行政課題。e-Stat/RESASや報道記事から取得可）
3. 扱う意思決定テーマ1つ（例：役場職員不足による行政サービス維持）
4. 想定されるステークホルダー像（3～5人分。住民・自治体職員・事業者など）
5. 連携する外部パートナー（例：離島経済新聞社）

---

## Phase 1：合意形成プラットフォームの複製

1. 既存の島（例：屋久島町）の「○○町—合意形成プラットフォーム」ページを `notion-duplicate-page` で複製
2. 複製後のページタイトルを新しい島名にリネーム（`notion-update-page` update_properties）
3. 配下8DB（Stakeholder / Issue / PositionRecord / StakeholderGoal / Agreement / ExternalPartner / OpenDataSource / EvidenceRecord）のうち、「対象自治体」プロパティを持つIssue・ExternalPartnerに、新しい島名を選択肢追加（`notion-update-data-source` で `ALTER COLUMN "対象自治体" SET MULTI_SELECT(...)`）

### ⚠️ 注意：ここが一番の落とし穴

**Notionのページ複製（Duplicate）は、データベースの型（スキーマ）だけでなく、中身の既存レコードも全部コピーする**。「空のテンプレートが得られる」と思い込むと、元の島のデータが新しい島のデータと混在し、AI分析時のハルシネーションの原因になる。必ずPhase 2でクリーンアップすること。

> 💡 **代替案**：この落とし穴を避けるため、りとけい分室（2026-08-17）では複製ではなく `notion-create-database` で8DBを一から新規作成し、他自治体のデータが一切混入しない状態にした。スキーマだけを踏襲したい場合は、こちらの方法の方が安全。

> ⚠️ **`🌍 PolicyCaseLibrary DB`と`💰 補助金・交付金マッチングDB`は複製しない**。この2つは全島共通の1つのDBを、`対象自治体` multi_selectでフィルタして使い回す設計（2026-08-18導入）。新しい島を追加するときにやることは、この2DBの`対象自治体`選択肢に新しい島名を追加するだけでよい（8DBのように複製・新規作成する必要はない）。

---

## Phase 2：複製データのクリーンアップ（複製方式を選んだ場合は必須）

1. 8DB全てを `notion-query-data-sources`（SQL）で全件取得し、「新しい島名が入っていない（＝元の島の）行」を洗い出す
2. 対象行のIDを `notion-move-pages` で `new_parent: {type: "workspace"}` に退避（削除ではなく非公開ページに移動。復元可能）
3. **一括ではなく6～10件ずつの小バッチに分けて実行する**。（一度に70件以上を移動しようとしたところ、Coworkの安全装置（一括大量操作ブロック）に止められた実績がある）
4. 全DBを再度COUNTし、新しい島の行のみが残っていることを確認

---

## Phase 3：初期データ登録

- **Stakeholder**: Phase 0のステークホルダー像を3～5件（Roleは既存選択肢から: 住民/事業者/自治体職員/外部パートナー/県担当者/議員）
- **Issue**: 1件（Title=テーマ、Status=議論中、対象レベル=市町村、対象自治体=新しい島名）
- **ExternalPartner**: 連携パートナー（例：離島経済新聞社、対象自治体=新しい島名）
- **OpenDataSource**: 人口・高齢化率など、出典URL付きで2～3件
- **EvidenceRecord**: 上記OpenDataSourceの内容を「根拠データ」として2～3件登録（Title/要約/SourceType/Issue=Phase3で作ったIssueのID）。**Phase 4のダッシュボードはOpenDataSourceではなくEvidenceRecordを直接クエリして「現状データ」を表示する**ため、OpenDataSourceだけ登録してEvidenceRecordを忘れると、ダッシュボードの現状データ欄が空になる。

---

## Phase 4：意思決定支援ダッシュボード（HTML）作成

> 📎 **詳細手順はNotion側に集約**：[🏁 意思決定支援ダッシュボード 作成手順書(6タブ構成＋データ収集フロー)](https://app.notion.com/p/3c0960a91e2381f59673c810bf47cca5) に、6タブの構成・共通CSS/JS・タブ別の内容ハイライトの入れ方・データソース早見表（SQLテンプレート付き）まで書いてある。ここでは全体の流れだけを示す。

1. **データを集める**：Phase 3で登録したIssue／EvidenceRecord／PositionRecord／ExternalPartnerに加えて、`🌍 PolicyCaseLibrary DB`と`💰 補助金・交付金マッチングDB`を対象自治体でフィルタして素材を集める（SQLはNotion側のドキュメント参照）。情報が足りない場合はWeb検索→該当Notion DBへの登録→HTMLへ、の順で必ずNotionを経由させる。
2. **既存HTMLをコピーして土台にする**：`public/case-studies/` 配下の4ファイル（`tonaki-staffing-dss.html` / `yakushima-a3.html` / `yakushima-route-dss.html` / `ritokei-resource-dss-v6.html`）のうち、テーマが近いものをコピーして新規ファイル `[島slug]-[テーマ].html` を作る。ゼロから書かない。共通CSS変数・共通JS（タブ切替）はそのまま流用する。
3. **6タブ固定で構成する**（旧「4タブ固定」から変更）：① 議論まとめ ② 自治体目標（前提条件） ③ 提案内容・詳細 ④ 国内外の類似事例 ⑤ 活用できる補助金・交付金 ⑥ 生データ（補足）。タブの名前・順番・`data-tab`値は必ず統一する。
4. **「議論まとめ」タブはA3サマリー密度で作る**：他5タブの要点を`.a3Grid`+`.mini`カード6枚（判断材料／提案内容／ステークホルダーの声／類似事例／補助金／結論）に集約する。他タブは詳細のまま残してよい。
5. ※数値は公開情報・報道をもとにしたPoC用の概算であり、実際の施策検討には自治体の一次データが必要だと明記する
6. **機械チェック**：`data-tab`の値と`id="panel-〇〇"`が過不足なく対応しているか、Pythonの正規表現チェックで確認してからコミットする（スクリプトはNotion側のドキュメント参照）。
7. `shimatetsudai/src/lib/tools.ts` の `ishikettei.caseStudies` 配列に追加（これを忘れるとサイト上のリンクから辿れない）

---

## Phase 5：しまのみんな会議（カードゲーム）作成

1. `shimatetsudai-issue-cardgame/src/data/games/issue-[島slug]-[テーマ].json` を新規作成（52枚: 視点/価値観/懸念/結論 各13枚、既存ゲームのスキーマを踏襲）
2. `notion.issuePageId` = Phase 3で作ったIssueのID
3. `notion.positionRecordDataSourceId` = Phase 1で複製（または新規作成）されたPositionRecordのdata_source_id（**これを入れないと、意見が環境変数固定の別の島のDBに混入する**）
4. `games.json` に登録
5. `tools.ts` の `cardgame.caseStudies` にも追加

---

## Phase 6：分室ページ作成

`shimatetsudai/src/lib/branches.ts` の `branches` 配列に1件追加（slug/name/tagline/description/stats/tools/issues）。`/branches/[slug]/page.tsx` は汎用実装済みなのでコード変更不要。

> 💡 ダッシュボードを改訂したときは、`BranchIssue.dashboardUrl` を最新版に差し替えつつ、`pastDashboards`（`{url, label}[]`）に旧版のリンクを残すこと。初期版を消さずに履歴として残す運用にしている。

---

## Phase 7：てつだって拡張版との連携（※自治体以外も対象）

> ⚠️ **実例からの教訓**：りとけい分室（NPO法人・離島経済新聞社）の構築時、「てつだっては住民向けのアプリだから、NPOスタッフや会員には関係ない」と自己判断してPhase 7をスキップしたが、後から「しまのみんな会議の意見を回収する導線がない」という問題が発生した。てつだって拡張版は「住民向けアプリ」ではなく「その島（・団体）に関わる人へのお知らせ配信基盤」として汎用的に使える。自治体以外（NPO・企業・学校など）でも、「しまのみんな会議で意見を回収したい相手がいる」限り、Phase 7を省略しないこと。

1. `shimatetsudai-tetsudatte/src/lib/islands.ts` の `ISLANDS` 配列に新しい島名（または団体名）を追加
2. Notion **TetsudatteUserProfile** の `Island` selectに同じ選択肢を追加（`notion-update-data-source`）
3. Notion **TetsudatteAnnouncement** の `TargetIslands` multi_selectに同じ選択肢を追加
4. TetsudatteAnnouncementに新規お知らせを1件作成（LinkUrl=分室ページURL、TargetIslands=[新しい島名]、IsActive=true）

### 🔄 同期が必要な箇所一覧（自動同期されない）

| 箇所 | 内容 |
|---|---|
| `shimatetsudai-tetsudatte/src/lib/islands.ts` | ISLANDS配列 |
| Notion TetsudatteUserProfile | Island selectの選択肢 |
| Notion TetsudatteAnnouncement | TargetIslands multi_selectの選択肢 |
| 新島の合意形成プラットフォーム Issue/ExternalPartner | 対象自治体 multi_selectの選択肢 |

---

## Phase 8：現地スタッフ用ドキュメント（※忘れやすいので要注意）

1. 新しい島専用の「データベースリンク集」ページを作成（Phase1の8DB + 共通4DBのリンク）
2. マスターの「🔗 データベース一覧」ページにも追記

> ⚠️ **実例からの教訓**：りとけい分室（2026-08-17）の構築時、Phase 1〜7（DB作成・イシュー登録・ダッシュボード・カードゲーム・分室ページ）は完了させたのに、このPhase 8だけ実行し忘れた。原因は「コードを書く作業（Phase 4〜6）」に集中すると、Notion側のドキュメント整備が後回しになりやすいこと。対策として、**Phase 6（分室ページ作成）が終わった直後に、Phase 7と並行してPhase 8を必ず着手する**ことをルール化する。Phase 10のチェックリストでも明示的に確認すること。

---

## Phase 9：ビルド・コミット

`src/lib/tools.ts`や`src/lib/branches.ts`など、TypeScriptのコードを変更した場合：

1. `/tmp` 下にコピーして `npm install`（FUSEマウントはdelete制限があるため）
2. `npx eslint src`
3. `npm run build`（Google Fonts等外部ネットワーク依存の警告はサンドボックス固有の制約で無視可）
4. 実リポジトリに`rsync`で反映して `git commit`（pushは人が実施）

`public/case-studies/`配下の静的HTMLファイルのみを追加・編集した場合は、上記のビルド確認は不要（Next.jsのビルド対象外の静的ファイルのため）。`src/lib/tools.ts`への1行追加とあわせて、そのまま`git add`・`git commit`してよい。

> ⚠️ **`.git/index.lock`が残って`git commit`が失敗することがある（既知の不具合）**。「Another git process seems to be running」と出るが実際には動いているプロセスはない。以下でロックファイルを退避してから再実行する。
> ```bash
> mv .git/index.lock .git/index.lock.bak 2>/dev/null
> mv .git/HEAD.lock .git/HEAD.lock.bak 2>/dev/null
> git add <変更ファイル>
> git commit -m "コミットメッセージ"
> ```
> **`git push`はクラウドセッションからは実行できない（GitHub認証情報がない）。必ずユーザー自身のパソコンで`git push origin main`を実行してもらう。**

---

## Phase 10：最終確認チェックリスト

- [ ] 8DB全てで、他の島のデータが0件である（COUNTで確認）
- [ ] 分室ページ（`/branches/[slug]`）が表示される
- [ ] 意思決定支援・しまのみんな会議の事例が `/tools/ishikettei` `/tools/cardgame` に表示される
- [ ] しまのみんな会議で実際に意見を送信し、正しいPositionRecord DB（新しい島の方）に入ることを確認
- [ ] てつだって拡張版で新しい島を選べること、お知らせバナーがその島の利用者にのみ表示されることを確認
- [ ] 現地スタッフ用リンク集ページを作成し（Phase 8-1）、かつマスターの「🔗 データベース一覧」ページにも新しい島の項目を追記した（Phase 8-2）

---

## 参考：これまでの実例ページ（Notion）

- 渡名喜村 事例設定: https://app.notion.com/p/3be960a91e2381c1988cf6c7eddd1115
- 渡名喜村 合意形成プラットフォーム: https://app.notion.com/p/3be960a91e23817e9ffde3e880a49b5e
- 渡名喜村 データベースリンク集: https://app.notion.com/p/3be960a91e2381aa95a4e8ba7b066f23
- りとけい 合意形成プラットフォーム: https://app.notion.com/p/3bf960a91e238149b696d3cf2fac7608
- りとけい データベースリンク集: https://app.notion.com/p/3bf960a91e2381aba001fe9c78687bf7

---

*作成：2026-08-16 / 更新：2026-08-17, 2026-08-18（Phase 4を6タブ標準フォーマットに全面改訂、Phase 3にEvidenceRecord登録を追記、Phase 9にgit index.lock対処法を追記）/ 吉孝さん × Claude*
