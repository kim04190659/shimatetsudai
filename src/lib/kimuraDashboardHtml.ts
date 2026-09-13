// ============================================================
// 木村さん個人の「意思決定支援ダッシュボード」HTML生成
// ============================================================
// デザイン(配色・カード・テーブルの見た目)は、他団体向けダッシュボード
// (src/lib/tenantDashboardHtml.ts)のCSSをそのままコピーして流用しています。
// タブ切り替えやAI要約は不要なので、その部分は削り、
// 「今週の優先順位」「立場ごとの時間配分バランス」の2つの表だけのシンプルな
// 1枚ページにしています(既存デザインをコピーして、必要な差分だけ変えるという、
// このプロジェクトのページ作成ルールに沿った作り方)。

import type { KimuraBalanceItem, KimuraDashboardData, KimuraRequestItem } from "./kimuraDashboard";

// tenantDashboardHtml.ts の CSS から、このページで使う部分だけを持ってきたもの
const CSS = `
:root{--ink:#2C2C2B;--muted:#7D7A75;--line:#E6E5E3;--soft:#F9F8F7;--blue:#2783DE;--blueSoft:#E5F2FC;--green:#46A171;--greenSoft:#E8F1EC;--orange:#D5803B;--orangeSoft:#FBEBDE;--red:#E56458;--redSoft:#FCE9E7;--purple:#7A5CCF;--purpleSoft:#EEE9FB}
*{box-sizing:border-box}
body{margin:0;background:#eee;color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans JP",sans-serif;line-height:1.5}
.app{max-width:1000px;margin:0 auto;background:#fff;min-height:100vh}
.hero{padding:24px 28px 14px;border-bottom:1px solid var(--line)}
.eyebrow{font-size:11px;color:var(--muted);letter-spacing:.08em;font-weight:800}
.title{font-size:26px;font-weight:900;margin:6px 0 4px}
.subtitle{color:var(--muted);font-size:13px}
.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}
.kpi{border:1px solid var(--line);border-radius:10px;padding:10px}
.kpi b{font-size:22px;display:block}
.kpi span{display:block;color:var(--muted);font-size:11px;margin-top:2px}
.section{padding:20px 28px}
.section h2{font-size:16px;margin:0 0 10px}
.tableWrap{overflow:auto;border:1px solid var(--line);border-radius:12px}
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{border-bottom:1px solid var(--line);padding:9px;vertical-align:top;text-align:left}
th{background:var(--soft);font-weight:900}
tr:last-child td{border-bottom:0}
.pill{display:inline-block;border-radius:999px;padding:3px 9px;font-size:11px;font-weight:800}
.pgreen{background:var(--greenSoft);color:#1f6b46}
.porange{background:var(--orangeSoft);color:#93501a}
.pred{background:var(--redSoft);color:#a13327}
.pgray{background:var(--soft);color:var(--muted)}
.empty{color:var(--muted);font-size:13px;padding:16px}
.footNote{font-size:11.5px;color:var(--muted);padding:0 28px 24px}
@media(max-width:700px){.kpis{grid-template-columns:1fr}}
`;

// 優先度の文字列に応じたバッジの色クラスを返す
function priorityPillClass(priority: string): string {
  if (priority === "高") return "pred";
  if (priority === "中") return "porange";
  return "pgray";
}

// 立場の「状態」(🟢🟡🔴の文字列)に応じたバッジの色クラスを返す
function balanceStatusPillClass(status: string): string {
  if (status.includes("🔴")) return "pred";
  if (status.includes("🟡")) return "porange";
  return "pgreen";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderRequestRow(item: KimuraRequestItem): string {
  return `<tr>
    <td>${escapeHtml(item.title)}</td>
    <td>${escapeHtml(item.stance)}</td>
    <td><span class="pill ${priorityPillClass(item.priority)}">${escapeHtml(item.priority || "-")}</span></td>
    <td>${escapeHtml(item.dueDate || "未設定")}</td>
    <td>${escapeHtml(item.status)}</td>
  </tr>`;
}

function renderBalanceRow(item: KimuraBalanceItem): string {
  return `<tr>
    <td>${escapeHtml(item.stance)}</td>
    <td>${item.targetHours}h</td>
    <td>${item.usedHours}h</td>
    <td>${item.remainingHours}h</td>
    <td><span class="pill ${balanceStatusPillClass(item.status)}">${escapeHtml(item.status)}</span></td>
  </tr>`;
}

export function renderKimuraDashboardHtml(data: KimuraDashboardData): string {
  const overCapacityCount = data.balances.filter((b) => b.status.includes("🔴")).length;
  const lowMarginCount = data.balances.filter((b) => b.status.includes("🟡")).length;

  const requestsHtml = data.requests.length
    ? `<div class="tableWrap"><table>
        <thead><tr><th>依頼内容</th><th>立場</th><th>優先度</th><th>締切</th><th>状態</th></tr></thead>
        <tbody>${data.requests.map(renderRequestRow).join("")}</tbody>
      </table></div>`
    : `<div class="empty">現在、完了以外の依頼はありません。</div>`;

  const balancesHtml = data.balances.length
    ? `<div class="tableWrap"><table>
        <thead><tr><th>立場</th><th>目標(h/週)</th><th>使用中(h)</th><th>残り(h)</th><th>状態</th></tr></thead>
        <tbody>${data.balances.map(renderBalanceRow).join("")}</tbody>
      </table></div>`
    : `<div class="empty">立場マスタが未設定です。</div>`;

  const generatedAtJst = new Date(data.generatedAt).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
  });

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>意思決定支援ダッシュボード</title>
<style>${CSS}</style>
</head>
<body>
<div class="app">
  <div class="hero">
    <p class="eyebrow">PERSONAL DASHBOARD</p>
    <h1 class="title">意思決定支援ダッシュボード</h1>
    <p class="subtitle">Notionと連動・ページ再読み込みで最新化 / 最終取得: ${escapeHtml(generatedAtJst)}</p>
    <div class="kpis">
      <div class="kpi"><b>${data.requests.length}</b><span>完了以外の依頼件数</span></div>
      <div class="kpi"><b>${overCapacityCount}</b><span>🔴上限超過の立場</span></div>
      <div class="kpi"><b>${lowMarginCount}</b><span>🟡余裕少の立場</span></div>
    </div>
  </div>

  <div class="section">
    <h2>① 今週の優先順位（緊急度順）</h2>
    ${requestsHtml}
  </div>

  <div class="section">
    <h2>② 立場ごとの時間配分バランス</h2>
    ${balancesHtml}
  </div>

  <div class="section">
    <h2>③ 新しい依頼を受けるかどうかの判断</h2>
    <p style="font-size:13px;color:var(--muted);line-height:1.8;margin:0">
      新しい依頼が来たら、上の「②時間配分バランス」でその立場の状態を確認してください。
      🟢余裕あり→そのまま受けてOK。🟡余裕少→受ける前に同じ立場の他の依頼を後回しにできないか確認。
      🔴上限超過→基本は断る・延期する。どうしても受ける場合は、同じ立場の何かを明確に同じ量だけ削る。
    </p>
  </div>
</div>
<p class="footNote">目標時間・優先度・緊急度スコアの重み付けはNotion側（立場マスタ／役割別 依頼・気づき管理）で調整できます。</p>
</body>
</html>`;
}

// パスワード入力画面(未ログイン時に表示)。デザインはtenantDashboardHtml.tsの
// renderTenantPasswordGateHtmlと同じ考え方(CSSはこのファイル内の簡易版を使う)。
export function renderKimuraPasswordGateHtml(errorMessage?: string): string {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>意思決定支援ダッシュボード</title>
<style>${CSS}
.gateWrap{max-width:360px;margin:80px auto;padding:0 20px}
.gateWrap h1{font-size:18px}
.gateWrap p{color:var(--muted);font-size:13px}
.gateWrap input{width:100%;border:1px solid var(--line);border-radius:8px;padding:10px 12px;font-size:14px;margin-top:10px;box-sizing:border-box}
.gateWrap button{width:100%;margin-top:12px;border:1px solid var(--purple);background:var(--purple);color:#fff;border-radius:999px;padding:10px 14px;font-weight:800;font-size:13px;cursor:pointer}
.gateWrap .err{color:#a13327;font-size:12.5px;margin-top:8px}
</style>
</head>
<body>
<div class="gateWrap">
  <h1>意思決定支援ダッシュボード</h1>
  <p>パスワードを入力してください。</p>
  <input id="pw" type="password" placeholder="パスワード">
  <button id="submitBtn" type="button">入る</button>
  <p class="err" id="err">${errorMessage ? escapeHtml(errorMessage) : ""}</p>
</div>
<script>
document.getElementById('submitBtn').addEventListener('click', function(){
  var pw = document.getElementById('pw').value;
  fetch('/api/dashboard/kimura/auth', {
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
