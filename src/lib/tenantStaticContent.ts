// テナント(団体)ごとの「人が調査して書いた」静的コンテンツ。
//
// りとけいのritokeiDashboardHtml.tsと同じく、自治体目標(前提条件)・提案内容・
// 国内外の類似事例・生データの4タブは、Notionの構造化データだけでは再現できない
// 人による調査・執筆が必要なため、この分だけは団体ごとにコードで管理する。
// (ダッシュボードの「型」自体はTENANTS_CONFIGだけで全団体共通・自動生成されるが、
//  この中身の充実だけは、8DB作成と同様に都度の作業が必要、という位置づけ)
//
// slugに対応するエントリが無いテナントは、tenantDashboardHtml.tsが正直な
// 「調査中です」プレースホルダーを表示する(存在しないデータを捏造しない)。

export type TenantStaticContent = {
  /** heroの上に出る小さいラベル。例: "意思決定支援PoC ｜ 屋久島町商工会" */
  eyebrow: string;
  /** タイトル直下の説明文 */
  subtitle: string;
  /** 🌱かんたんに言うと ボックス */
  kidBoxText?: string;
  /** 「今日の意思決定」callout */
  decisionSummary: string;
  /** heroのKPIグリッド(4件想定) */
  kpis: { value: string; label: string }[];
  /** 議論まとめタブの冒頭にある番号付きmeasureCard */
  summaryPoints: { title: string; body: string }[];
  /** 議論まとめタブのA3サマリー(6枚のminiカード。見出しと箇条書き) */
  a3: { heading: string; items: string[] }[];
  /** 自治体目標(前提条件)タブ。生のHTML(tableWrap/card等、ritokeiと同じクラスを使う) */
  premiseHtml: string;
  /** 提案内容・詳細タブ */
  proposalHtml: string;
  /** 国内外の類似事例タブ */
  casesHtml: string;
  /** 生データ(補足)タブ */
  rawHtml: string;
};

const yakushimaShoukoukai: TenantStaticContent = {
  eyebrow: "意思決定支援PoC ｜ 屋久島町商工会",
  subtitle:
    "屋久島町商工会に加盟する商業施設の経営基盤強化を、会員事業者・商工会職員・自治体など、いろいろな立場の声を集めながら検討している事例です。",
  kidBoxText:
    "屋久島町には、お店や旅館などを営む小さな会社が704社くらいあります。その多くが「お客さんは来るけど、利益があまり残らない」という悩みを抱えています。この資料は、そのお店を続けていくために何ができるかを考えるためのものです。",
  decisionSummary:
    "会員事業者の収益力強化を、既存の公的支援制度(経営発達支援・小規模事業者持続化補助金等)の活用促進と、商工会による個社伴走支援のどちらを軸に進めるかを検討中。まずは申請のあった加盟事業者へのヒアリングを起点に、利益率が低い要因(観光の季節変動、仕入れコスト、人手不足など)を切り分けることを次の一手とする。",
  kpis: [
    { value: "704社", label: "屋久島町の小規模事業者数" },
    { value: "約37%", label: "観光関連業者の割合" },
    { value: "211社", label: "宿泊業・飲食サービス業(最多業種)" },
    { value: "未検証", label: "会員事業者の平均利益率(要調査)" },
  ],
  summaryPoints: [
    {
      title: "1. 論点の出発点",
      body: "商工会加盟の商業施設から「利益が足りず、閉鎖に追い込まれている」という問題提起が届いた。個社の経営問題であると同時に、屋久島町全体の商業基盤に関わる論点として扱う。",
    },
    {
      title: "2. 活用できる公的支援",
      body: "屋久島町商工会は中小企業庁認定の経営発達支援計画を持ち、小規模事業者持続化補助金(基本50万円・最大250万円)などの制度を仲介できる立場にある。まずは既存制度の周知・活用支援から着手できる可能性が高い。",
    },
    {
      title: "3. 次の一手",
      body: "申請のあった事業者・その他の会員へのヒアリングを行い、「利益が残らない」要因を仕入れ・人件費・季節変動・価格設定のどこに起因するか切り分ける。",
    },
  ],
  a3: [
    {
      heading: "📊 判断材料ハイライト",
      items: [
        "屋久島町の小規模事業者数は704社(宿泊・飲食211／卸小売129／建設87／製造86／生活関連85)",
        "観光関連業者が全体の約37%を占め、観光の季節変動の影響を受けやすい構造",
        "会員事業者の実際の利益率・原価構造は未計測(要ヒアリング)",
        "商工会は経営発達支援計画の認定を受けており、公的支援へのアクセスを持つ",
      ],
    },
    {
      heading: "💡 検討中の対応ハイライト",
      items: [
        "小規模事業者持続化補助金など、既存の公的支援制度の周知・申請支援",
        "商工会職員による個社伴走支援(経営相談)の強化",
        "利益が残らない要因(仕入れ・人件費・季節変動等)の切り分け調査",
        "観光業への偏りを踏まえた、閑散期対策の検討",
      ],
    },
    {
      heading: "🗣️ 課題の背景",
      items: [
        "観光関連業者の割合が高く、観光需要の季節変動が収益を圧迫しやすい",
        "小規模事業者が多く、個社での価格交渉力・仕入れ交渉力が弱い可能性",
        "後継者不足・人手不足が重なると、閉鎖リスクがさらに高まる",
      ],
    },
    {
      heading: "🌍 国内外の類似事例ハイライト",
      items: ["調査中: 他地域の商工会・小規模事業者支援の類似事例は、これから収集します"],
    },
    {
      heading: "💰 活用できる補助金・交付金ハイライト",
      items: ["活用できる補助金・交付金タブに、Notion上のマッチングDBから取得した最新の候補を掲載しています"],
    },
    {
      heading: "✅ 現時点の結論・次の一手",
      items: [
        "まずは申請のあった事業者へのヒアリングを実施し、利益が残らない要因を特定する",
        "並行して、既存の公的支援制度の周知・申請支援を進める",
        "個社の経営問題にとどめず、町全体の商業基盤の論点として継続して扱う",
      ],
    },
  ],
  premiseHtml: `
  <div class="card">
    <h3>屋久島町商工会の役割</h3>
    <p style="font-size:13px">地域の中小企業・小規模事業者(会員事業者)の経営相談・支援を行う団体。中小企業庁認定の「経営発達支援計画」に基づき、地域の商業・観光関連事業者の経営基盤強化を担う。</p>
  </div>
  <div class="tableWrap" style="margin-top:14px">
    <table>
      <tbody>
        <tr><th>対象</th><td>屋久島町内の会員事業者(商業・観光・建設・製造・生活関連サービス業など)</td></tr>
        <tr><th>小規模事業者数</th><td>704社(屋久島町商工会 経営発達支援計画より)</td></tr>
        <tr><th>業種内訳</th><td>宿泊業・飲食サービス業211社／卸売業・小売業129社／建設業87社／製造業86社／生活関連サービス業・娯楽業85社</td></tr>
        <tr><th>観光関連業者の割合</th><td>約37%(基幹産業である観光業への依存度が高い)</td></tr>
        <tr><th>出典</th><td><a href="https://www.chusho.meti.go.jp/keiei/shokibo/ninteikeikaku/download/46-28.pdf" target="_blank" rel="noopener noreferrer">屋久島町商工会 経営発達支援計画(中小企業庁認定・PDF)</a></td></tr>
      </tbody>
    </table>
  </div>
  <div class="grid3" style="margin-top:14px">
    <div class="card"><h3>収益構造</h3><p style="font-size:13px">観光関連業者の割合が高く、観光需要の季節変動の影響を受けやすい。個社の利益率・原価構造は今後のヒアリングで把握する必要がある。</p></div>
    <div class="card"><h3>支援体制</h3><p style="font-size:13px">経営発達支援計画の認定団体として、小規模事業者持続化補助金などの公的支援制度への橋渡し役を担える立場にある。</p></div>
    <div class="card"><h3>今後の課題</h3><p style="font-size:13px">「利益が残らない」という声の背景(仕入れ・人件費・季節変動・価格設定等)を、個社ヒアリングを通じて具体化する必要がある。</p></div>
  </div>
  <div class="callout warn" style="margin-top:14px"><b>データについて</b><p style="margin:6px 0 0">この分室はまだ立ち上がったばかりで、会員事業者全体の利益率・経営指標などの詳細な数値はまだ集計されていません。数値が確認できたもの(704社、業種内訳、観光比率)のみ掲載し、未確認の項目は「未検証」と明記しています。</p></div>
  `,
  proposalHtml: `
  <div class="card">
    <h3>検討中の対応(現時点の案)</h3>
    <div class="tableWrap">
      <table>
        <tbody>
          <tr><th>公的支援の周知・申請支援</th><td>小規模事業者持続化補助金(基本50万円・最大250万円)など、既存制度の説明会・個別相談を実施する。</td></tr>
          <tr><th>個社ヒアリング</th><td>申請のあった事業者を含む会員事業者へのヒアリングを行い、利益が残らない要因を特定する。</td></tr>
          <tr><th>季節変動への対応</th><td>観光関連業者の比率が高いことを踏まえ、閑散期の経営安定策(複数業種の組み合わせ、通年商品の開発等)を検討する。</td></tr>
        </tbody>
      </table>
    </div>
  </div>
  <div class="card" style="margin-top:14px">
    <h3>課題の優先順位(現時点の仮案)</h3>
    <div class="tableWrap">
      <table>
        <thead><tr><th>優先</th><th>問題・課題</th><th>意思決定上の意味</th><th>対応の方向性</th></tr></thead>
        <tbody>
          <tr><td><b>1</b></td><td>利益が残らない具体的な要因が未特定</td><td>対策を決める前に、まず実態を把握する必要がある</td><td><span class="pill pblue">個社ヒアリング</span></td></tr>
          <tr><td><b>2</b></td><td>公的支援制度が十分に活用されていない可能性</td><td>既にある支援を使い切れていない場合、対応コストが低い</td><td><span class="pill pgreen">制度周知・申請支援</span></td></tr>
          <tr><td><b>3</b></td><td>観光関連業者への依存度が高い</td><td>季節変動リスクが収益不安定化の一因になりうる</td><td><span class="pill porange">閑散期対策の検討</span></td></tr>
        </tbody>
      </table>
    </div>
  </div>
  <p class="footNote">※ この提案は、申請時点で分かっている情報をもとにした初期案です。ヒアリング結果を踏まえて更新していきます。</p>
  `,
  casesHtml: `
  <div class="card">
    <h3>国内外の類似事例</h3>
    <p style="font-size:12.5px;color:var(--muted);margin:0 0 10px">この論点に関連する類似事例は、まだ調査・収集できていません。</p>
    <div class="callout warn"><b>調査中</b><p style="margin:6px 0 0">他地域の商工会・小規模事業者支援における類似の取り組み事例を、今後収集して掲載します。存在しない事例を掲載することは避けています。</p></div>
  </div>
  `,
  rawHtml: `
  <div class="card">
    <h3>参照した一次情報</h3>
    <div class="tableWrap">
      <table>
        <tbody>
          <tr><th>屋久島町商工会 経営発達支援計画</th><td><a href="https://www.chusho.meti.go.jp/keiei/shokibo/ninteikeikaku/download/46-28.pdf" target="_blank" rel="noopener noreferrer">中小企業庁 認定計画(PDF)</a> ― 小規模事業者数704社、業種内訳、観光関連業者比率の出典</td></tr>
          <tr><th>小規模事業者持続化補助金</th><td><a href="https://www.chusho.meti.go.jp/keiei/shokibo/jizoku/" target="_blank" rel="noopener noreferrer">中小企業庁(制度ページ)</a> ― 基本50万円、販路開拓等の取組で最大250万円</td></tr>
        </tbody>
      </table>
    </div>
  </div>
  <div class="card" style="margin-top:14px">
    <h3>生成AIとの業務分担</h3>
    <div class="tableWrap">
      <table>
        <tbody>
          <tr><th>AI</th><td>公開資料の整理、論点の要約下書き、既存制度とのマッチング候補の抽出。</td></tr>
          <tr><th>人間</th><td>会員事業者へのヒアリング、経営相談、最終的な支援方針の決定。</td></tr>
          <tr><th>禁止事項</th><td>AI単独で経営判断・支援可否を決定しない。個社の状況確認は必ず人が行う。</td></tr>
        </tbody>
      </table>
    </div>
  </div>
  `,
};

const staticContent: Record<string, TenantStaticContent> = {
  "yakushima-shoukoukai": yakushimaShoukoukai,
};

export function getTenantStaticContent(slug: string): TenantStaticContent | null {
  return staticContent[slug] ?? null;
}
