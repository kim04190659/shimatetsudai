// 複数団体対応(マルチテナント化)版の、汎用ダッシュボードHTML。
//
// りとけい専用のritokeiDashboardHtml.tsと、CSS・8タブ構成を完全にそろえている。
// 「議論まとめ」「生成AI下書き」「現場の声」「活用できる補助金・交付金」の4タブは
// Notionからのライブ取得+生成AIで、どのテナントでも自動的に埋まる。
// 「自治体目標(前提条件)」「提案内容・詳細」「国内外の類似事例」「生データ」の4タブは、
// りとけいと同じく人による調査が必要なため、tenantStaticContent.tsに団体ごとの
// 内容がある場合のみそれを表示し、無い場合は「調査中です」という正直なプレースホルダーを
// 表示する(存在しないデータを捏造しない)。
// 団体名・地域名は引数(meta)として渡さない限り一切出さない。

import type { TenantDashboardResult } from "./tenantDashboard";
import { getTenantStaticContent } from "./tenantStaticContent";

const CSS = `
:root{--ink:#2C2C2B;--muted:#7D7A75;--line:#E6E5E3;--soft:#F9F8F7;--blue:#2783DE;--blueSoft:#E5F2FC;--green:#46A171;--greenSoft:#E8F1EC;--orange:#D5803B;--orangeSoft:#FBEBDE;--red:#E56458;--redSoft:#FCE9E7;--purple:#7A5CCF;--purpleSoft:#EEE9FB}
*{box-sizing:border-box}
body{margin:0;background:#eee;color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans JP",sans-serif;line-height:1.5}
.app{max-width:1200px;margin:0 auto;background:#fff;min-height:100vh}
.hero{padding:24px 28px 14px;border-bottom:1px solid var(--line)}
.eyebrow{font-size:11px;color:var(--muted);letter-spacing:.08em;font-weight:800}
.title{font-size:26px;font-weight:900;margin:6px 0 4px}
.subtitle{color:var(--muted);font-size:13px}
.decision{border:2px solid #9ac9ef;border-radius:14px;background:#fbfdff;padding:14px;margin-top:14px}
.badge{display:inline-block;background:var(--blueSoft);color:#165c9d;border-radius:8px;padding:6px 10px;font-weight:900;font-size:12px}
.decision p{margin:8px 0 0;font-size:13px}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:14px}
.kpi{border:1px solid var(--line);border-radius:10px;padding:10px}
.kpi b{font-size:20px;display:block}
.kpi span{display:block;color:var(--muted);font-size:11px;margin-top:2px}
.tabs{position:sticky;top:0;background:rgba(255,255,255,.95);backdrop-filter:blur(10px);border-bottom:1px solid var(--line);padding:8px 28px;z-index:5;display:flex;gap:8px;overflow:auto}
.tabs button{border:1px solid var(--line);background:var(--soft);border-radius:999px;padding:9px 14px;font-weight:800;cursor:pointer;white-space:nowrap;font-size:13px}
.tabs button.active{background:var(--blue);border-color:var(--blue);color:#fff}
.panel{display:none;padding:20px 28px 36px}
.panel.active{display:block}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
.card{border:1px solid var(--line);border-radius:14px;background:#fff;padding:16px}
.card h3{margin:0 0 10px;font-size:16px}
.callout{border-left:5px solid var(--blue);background:var(--blueSoft);border-radius:10px;padding:10px;margin:8px 0;font-size:13px}
.ok{border-left-color:var(--green);background:var(--greenSoft)}
.warn{border-left-color:var(--orange);background:var(--orangeSoft)}
.risk{border-left-color:var(--red);background:var(--redSoft)}
.purpleCallout{border-left-color:var(--purple);background:var(--purpleSoft)}
.tableWrap{overflow:auto;border:1px solid var(--line);border-radius:12px}
table{width:100%;border-collapse:collapse;font-size:12.5px}
th,td{border-bottom:1px solid var(--line);padding:8px;vertical-align:top;text-align:left}
th{background:var(--soft);font-weight:900}
tr:last-child td{border-bottom:0}
.pill{display:inline-block;border-radius:999px;padding:3px 8px;font-size:10.5px;font-weight:800}
.pblue{background:var(--blueSoft);color:#165c9d}
.pgreen{background:var(--greenSoft);color:#1f6b46}
.porange{background:var(--orangeSoft);color:#93501a}
.pred{background:var(--redSoft);color:#a13327}
.ppurple{background:var(--purpleSoft);color:#4b3494}
.measureCard{border:1px solid var(--line);border-radius:14px;padding:14px;margin-bottom:12px}
.measureCard b{font-size:14.5px}
.footNote{font-size:11.5px;color:var(--muted);margin-top:18px}
.a3Grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.mini{border:1px solid var(--line);border-radius:12px;padding:12px;background:#fff}
.mini h4{margin:0 0 8px;font-size:13px}
.mini ul{margin:0;padding-left:16px;font-size:12px;line-height:1.55}
.mini li{margin:3px 0}
.kidBox{border:2px solid #F0C56B;background:#FFF8E8;border-radius:14px;padding:14px 16px;margin-top:14px}
.kidBox b{font-size:13px}
.kidBox p{margin:8px 0 0;font-size:14.5px;line-height:1.7;color:#4a3f28}
.updateBar{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:10px 28px;background:var(--purpleSoft);border-bottom:1px solid var(--line)}
.updateBar button{border:1px solid var(--purple);background:var(--purple);color:#fff;border-radius:999px;padding:7px 14px;font-weight:800;font-size:12.5px;cursor:pointer}
.updateBar button:disabled{opacity:.5;cursor:default}
.updateBar .msg{font-size:12px;color:#4b3494}
.liveDraft{white-space:pre-wrap;font-size:13px;line-height:1.8;border:1px solid var(--line);border-radius:14px;background:#fff;padding:16px}
@media(max-width:900px){.grid2,.grid3,.a3Grid{grid-template-columns:1fr}}
`;

/** LLMが返す簡易マークダウン(見出し・箇条書き・太字)を、最低限HTMLに変換する */
function markdownToHtml(markdown: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const bold = (s: string) => escape(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");

  const lines = markdown.split("\n");
  const html: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const closeList = () => {
    if (listType) {
      html.push(listType === "ul" ? "</ul>" : "</ol>");
      listType = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line === "" || line === "---") {
      closeList();
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      closeList();
      html.push(`<h4 style="margin:16px 0 8px;font-size:14px">${bold(h[2])}</h4>`);
      continue;
    }
    const ul = line.match(/^[-・]\s+(.*)$/);
    if (ul) {
      if (listType !== "ul") {
        closeList();
        html.push('<ul style="font-size:13px;line-height:1.7;margin:6px 0">');
        listType = "ul";
      }
      html.push(`<li>${bold(ul[1])}</li>`);
      continue;
    }
    const ol = line.match(/^\d+[.\)]\s+(.*)$/);
    if (ol) {
      if (listType !== "ol") {
        closeList();
        html.push('<ol style="font-size:13px;line-height:1.7;margin:6px 0">');
        listType = "ol";
      }
      html.push(`<li>${bold(ol[1])}</li>`);
      continue;
    }
    closeList();
    html.push(`<p style="font-size:13px;line-height:1.7;margin:6px 0">${bold(line)}</p>`);
  }
  closeList();
  return html.join("\n");
}

const stanceClass: Record<string, string> = {
  賛成: "pgreen",
  反対: "pred",
  条件付き賛成: "porange",
  保留: "pblue",
};

export type TenantDashboardMeta = {
  slug: string;
  /** 画面に表示してよい場合のみ渡す(通常は空のまま=団体名を出さない) */
  displayLabel?: string;
};

/** パスワード未入力・不一致のときに表示する、簡単な認証フォーム */
export function renderTenantPasswordGateHtml(slug: string, errorMessage?: string): string {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>意思決定支援ダッシュボード(試用版)</title>
<style>${CSS}
.gateWrap{max-width:360px;margin:80px auto;padding:0 20px}
.gateWrap h1{font-size:18px}
.gateWrap p{color:var(--muted);font-size:13px}
.gateWrap input{width:100%;border:1px solid var(--line);border-radius:8px;padding:10px 12px;font-size:14px;margin-top:10px}
.gateWrap button{width:100%;margin-top:12px;border:1px solid var(--purple);background:var(--purple);color:#fff;border-radius:999px;padding:10px 14px;font-weight:800;font-size:13px;cursor:pointer}
.gateWrap .err{color:#a13327;font-size:12.5px;margin-top:8px}
</style>
</head>
<body>
<div class="gateWrap">
  <h1>意思決定支援ダッシュボード</h1>
  <p>試用のご案内時にお伝えしたパスワードを入力してください。</p>
  <input id="pw" type="password" placeholder="パスワード">
  <button id="submitBtn" type="button">入る</button>
  <p class="err" id="err">${errorMessage ? errorMessage : ""}</p>
</div>
<script>
document.getElementById('submitBtn').addEventListener('click', function(){
  var pw = document.getElementById('pw').value;
  fetch('/api/dashboard/${slug}/auth', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: pw }),
  }).then(function(res){
    if (res.ok) {
      window.location.reload();
    } else {
      document.getElementById('err').textContent = 'パスワードが正しくありません。';
    }
  }).catch(function(){
    document.getElementById('err').textContent = 'エラーが発生しました。時間をおいて再度お試しください。';
  });
});
</script>
</body>
</html>`;
}

export function renderTenantDashboardHtml(
  data: TenantDashboardResult,
  meta: TenantDashboardMeta
): string {
  const generatedAtLabel = new Date(data.generatedAt).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
  });

  // unstable_cacheが古いデプロイ時点のデータを保持している可能性があるため、
  // undefinedでも落ちないように防御する。
  const evidenceRecords = data.evidenceRecords ?? [];
  const fundingMatches = data.fundingMatches ?? [];

  const positionRecordsHtml = data.positionRecords.length
    ? data.positionRecords
        .map(
          (r) => `
    <div class="measureCard">
      <span class="pill ${stanceClass[r.stance] ?? "pblue"}">${r.stance || "立場不明"}</span>
      <b>${r.title}</b>
      <p style="font-size:13px;margin:6px 0 0;white-space:pre-wrap">${r.content}</p>
      <p style="font-size:11px;color:var(--muted);margin:6px 0 0">登録: ${r.registeredAt}</p>
    </div>`
        )
        .join("\n")
    : `<p style="font-size:13px;color:var(--muted)">まだ登録されている議事録・意見がありません。</p>`;

  const evidenceHtml = evidenceRecords.length
    ? evidenceRecords
        .map(
          (e) => `
    <div class="measureCard">
      <b>${e.title}</b>
      <p style="font-size:13px;margin:6px 0 0">${e.summary}</p>
    </div>`
        )
        .join("\n")
    : `<p style="font-size:13px;color:var(--muted)">まだ登録されている根拠データがありません。</p>`;

  const fundingHtml = fundingMatches.length
    ? `<div class="tableWrap"><table>
        <thead><tr><th>制度名</th><th>所管</th><th>概要</th><th>マッチ理由</th></tr></thead>
        <tbody>
        ${fundingMatches
          .map(
            (f) => `
          <tr>
            <td><b>${f.name}</b><br><span style="font-size:11.5px;color:var(--muted)">補助率・上限額: ${f.amount}</span></td>
            <td>${f.agency}</td>
            <td>${f.summary}</td>
            <td>${f.matchReason}</td>
          </tr>`
          )
          .join("\n")}
        </tbody>
      </table></div>`
    : `<p style="font-size:13px;color:var(--muted)">まだ登録されている補助金・交付金の候補がありません。</p>`;

  const eyebrow = meta.displayLabel ? meta.displayLabel : "意思決定支援ダッシュボード(試用版)";

  const static_ = getTenantStaticContent(meta.slug);

  // 自治体目標(前提条件)・提案内容・類似事例・生データは、人が調査した内容がある
  // テナントだけ実際の中身を出し、無ければ「調査中」であることを正直に表示する。
  const investigatingNotice = (label: string) => `
    <div class="callout warn"><b>調査中</b><p style="margin:6px 0 0">${label}は、まだ十分な調査ができていません。準備が整い次第、このタブに反映します。</p></div>`;

  const premiseHtml = static_?.premiseHtml ?? investigatingNotice("この団体の目標・前提条件");
  const proposalHtml = static_?.proposalHtml ?? investigatingNotice("提案内容の詳細");
  const casesHtml = static_?.casesHtml ?? investigatingNotice("国内外の類似事例");
  const rawHtml = static_?.rawHtml ?? investigatingNotice("参照した一次情報などの生データ");

  const subtitle =
    static_?.subtitle ??
    "現地スタッフが集めた声をもとに、生成AIが議論の下書きを作成しています。詳しい調査を伴うタブは、準備が整い次第公開します。";
  const kidBox = static_?.kidBoxText
    ? `<div class="kidBox"><b>🌱 かんたんに言うと</b><p>${static_.kidBoxText}</p></div>`
    : "";
  const decisionSummary =
    static_?.decisionSummary ?? "この論点について、現時点で登録されている声をもとに議論を進めています。";
  const kpisHtml = static_?.kpis?.length
    ? `<div class="kpis">${static_.kpis
        .map((k) => `<div class="kpi"><b>${k.value}</b><span>${k.label}</span></div>`)
        .join("\n")}</div>`
    : "";
  const summaryPointsHtml = static_?.summaryPoints?.length
    ? static_.summaryPoints
        .map(
          (p) => `
    <div class="measureCard">
      <b>${p.title}</b>
      <p style="font-size:13px;margin:6px 0 0">${p.body}</p>
    </div>`
        )
        .join("\n")
    : "";
  const a3Html = static_?.a3?.length
    ? `<h3 style="margin-top:18px;font-size:15px">この論点の全体像(A3サマリー)</h3>
      <div class="a3Grid">
      ${static_.a3
        .map(
          (card) => `
        <div class="mini">
          <h4>${card.heading}</h4>
          <ul>${card.items.map((item) => `<li>${item}</li>`).join("")}</ul>
        </div>`
        )
        .join("\n")}
      </div>`
    : "";

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>意思決定支援ダッシュボード(試用版)</title>
<style>${CSS}</style>
</head>
<body>
<div class="app">

<div class="updateBar">
  <span class="badge">ライブ版(β)</span>
  <span style="font-size:12px;color:#4b3494">生成日時: ${generatedAtLabel} ／ ${data.generatedProvider} / ${data.generatedModel}</span>
  <button id="refreshBtn" type="button">最新の議事録で更新</button>
  <span id="refreshMsg" class="msg"></span>
</div>

<div class="hero">
  <span class="eyebrow">${eyebrow}</span>
  <div class="title">${data.issueTitle}</div>
  <div class="subtitle">${subtitle}</div>
  ${kidBox}
  <div class="decision">
    <span class="badge">今日の意思決定</span>
    <p>${decisionSummary}</p>
  </div>
  ${kpisHtml}
</div>

<nav class="tabs">
  <button class="tabBtn active" data-tab="summary">議論まとめ</button>
  <button class="tabBtn" data-tab="llmdraft">生成AI下書き(ライブ)</button>
  <button class="tabBtn" data-tab="voices">現場の声(ライブ)</button>
  <button class="tabBtn" data-tab="premise">自治体目標(前提条件)</button>
  <button class="tabBtn" data-tab="proposal">提案内容・詳細</button>
  <button class="tabBtn" data-tab="cases">国内外の類似事例</button>
  <button class="tabBtn" data-tab="funding">活用できる補助金・交付金</button>
  <button class="tabBtn" data-tab="raw">生データ(補足)</button>
</nav>

<section class="panel active" id="panel-summary">
  ${summaryPointsHtml}
  ${a3Html}
</section>

<section class="panel" id="panel-llmdraft">
  <div class="card">
    <h3>生成AI(${data.generatedModel})による下書き ― ライブ生成</h3>
    <p style="font-size:12.5px;color:var(--muted);margin:0 0 10px">
      Notion上の論点情報と現在登録されている現場の声を渡し、その場で生成した下書きです。人による編集は加えていません。
    </p>
    <div class="callout purpleCallout">
      <b>生成情報</b>
      <p style="margin:6px 0 0;font-size:13px">プロバイダー: ${data.generatedProvider} ／ モデル: ${data.generatedModel} ／ 生成日時: ${generatedAtLabel}</p>
    </div>
    <div style="margin-top:12px">
      ${markdownToHtml(data.generatedDraft)}
    </div>
    <p class="footNote">※ 事実確認・最終的な意思決定は、これまで通り拠点スタッフ・関係者が行ってください。</p>
  </div>
</section>

<section class="panel" id="panel-voices">
  <div class="card">
    <h3>現場の声(PositionRecord) ― ${data.positionRecords.length}件・ライブ</h3>
    <p style="font-size:12.5px;color:var(--muted);margin:0 0 10px">Notion上のPositionRecord(立場表明ログ)から、新しい順に取得しています。現地スタッフが議事録・新しい意見を追加すると、更新ボタンでここに反映されます。</p>
    ${positionRecordsHtml}
  </div>
</section>

<section class="panel" id="panel-premise">
  ${premiseHtml}
</section>

<section class="panel" id="panel-proposal">
  ${proposalHtml}
</section>

<section class="panel" id="panel-cases">
  ${casesHtml}
</section>

<section class="panel" id="panel-funding">
  <div class="card">
    <h3>活用できる補助金・交付金(候補)</h3>
    <p style="font-size:12.5px;color:var(--muted);margin:0 0 10px">Notion上の「補助金・交付金マッチングDB」から、この論点に関連が高いと判断した候補です。金額・締切等の詳細は必ず一次情報でご確認ください。</p>
    ${fundingHtml}
  </div>
</section>

<section class="panel" id="panel-raw">
  <div class="card">
    <h3>根拠データ(Evidence)</h3>
    ${evidenceHtml}
  </div>
  <div style="margin-top:14px">
    ${rawHtml}
  </div>
</section>

</div>
<script>
document.querySelectorAll('.tabBtn').forEach(function(btn){
  btn.addEventListener('click', function(){
    document.querySelectorAll('.tabBtn').forEach(function(b){ b.classList.remove('active'); });
    document.querySelectorAll('.panel').forEach(function(p){ p.classList.remove('active'); });
    btn.classList.add('active');
    document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
  });
});

(function(){
  var refreshBtn = document.getElementById('refreshBtn');
  var msg = document.getElementById('refreshMsg');
  refreshBtn.addEventListener('click', function(){
    refreshBtn.disabled = true;
    msg.textContent = '更新中…';
    fetch('/api/dashboard/${meta.slug}/refresh', { method: 'POST', credentials: 'same-origin' })
      .then(function(res){
        if (!res.ok) throw new Error('failed');
        msg.textContent = '更新しました。再読み込みします…';
        setTimeout(function(){ window.location.reload(); }, 800);
      })
      .catch(function(){
        msg.textContent = '更新に失敗しました。時間をおいて再度お試しください。';
        refreshBtn.disabled = false;
      });
  });
})();
</script>
</body>
</html>`;
}
