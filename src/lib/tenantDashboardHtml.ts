// 複数団体対応(マルチテナント化)版の、汎用ダッシュボードHTML。
//
// りとけい専用のritokeiDashboardHtml.tsとは別ファイルにしている。理由は、
// りとけい版には財源設計・類似事例・補助金候補といった「人が時間をかけて調査した
// 静的タブ」が5つ含まれているが、新しく試用してもらう団体にはまだその調査内容が
// 存在しないため。ここでは、Notion+生成AIだけで作れる「生成AI下書き」と
// 「現場の声」の2タブだけを持つ、正直な最小構成にしている。
// 団体名・地域名は引数(meta)として渡さない限り一切出さない。

import type { TenantDashboardResult } from "./tenantDashboard";

const CSS = `
:root{--ink:#2C2C2B;--muted:#7D7A75;--line:#E6E5E3;--soft:#F9F8F7;--blue:#2783DE;--blueSoft:#E5F2FC;--green:#46A171;--greenSoft:#E8F1EC;--orange:#D5803B;--orangeSoft:#FBEBDE;--red:#E56458;--redSoft:#FCE9E7;--purple:#7A5CCF;--purpleSoft:#EEE9FB}
*{box-sizing:border-box}
body{margin:0;background:#eee;color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans JP",sans-serif;line-height:1.5}
.app{max-width:1000px;margin:0 auto;background:#fff;min-height:100vh}
.updateBar{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:10px 24px;background:var(--purpleSoft);border-bottom:1px solid var(--line)}
.updateBar button{border:1px solid var(--purple);background:var(--purple);color:#fff;border-radius:999px;padding:7px 14px;font-weight:800;font-size:12.5px;cursor:pointer}
.updateBar button:disabled{opacity:.5;cursor:default}
.updateBar .msg{font-size:12px;color:#4b3494}
.badge{display:inline-block;background:#fff;color:#4b3494;border-radius:8px;padding:6px 10px;font-weight:900;font-size:12px}
.hero{padding:22px 24px 10px;border-bottom:1px solid var(--line)}
.eyebrow{font-size:11px;color:var(--muted);letter-spacing:.08em;font-weight:800}
.title{font-size:22px;font-weight:900;margin:6px 0 4px}
.tabs{position:sticky;top:0;background:rgba(255,255,255,.95);backdrop-filter:blur(10px);border-bottom:1px solid var(--line);padding:8px 24px;z-index:5;display:flex;gap:8px;overflow:auto}
.tabs button{border:1px solid var(--line);background:var(--soft);border-radius:999px;padding:9px 14px;font-weight:800;cursor:pointer;white-space:nowrap;font-size:13px}
.tabs button.active{background:var(--blue);border-color:var(--blue);color:#fff}
.panel{display:none;padding:20px 24px 36px}
.panel.active{display:block}
.card{border:1px solid var(--line);border-radius:14px;background:#fff;padding:16px;margin-bottom:12px}
.pill{display:inline-block;border-radius:999px;padding:3px 8px;font-size:10.5px;font-weight:800}
.pblue{background:var(--blueSoft);color:#165c9d}
.pgreen{background:var(--greenSoft);color:#1f6b46}
.porange{background:var(--orangeSoft);color:#93501a}
.pred{background:var(--redSoft);color:#a13327}
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

  const positionRecordsHtml = data.positionRecords.length
    ? data.positionRecords
        .map(
          (r) => `
    <div class="card">
      <span class="pill ${stanceClass[r.stance] ?? "pblue"}">${r.stance || "立場不明"}</span>
      <p style="font-size:14px;font-weight:700;margin:8px 0 4px">${r.title}</p>
      <p style="font-size:13px;margin:0;white-space:pre-wrap;color:#4b5563">${r.content}</p>
      <p style="font-size:11px;color:var(--muted);margin:8px 0 0">登録: ${r.registeredAt}</p>
    </div>`
        )
        .join("\n")
    : `<p style="font-size:13px;color:var(--muted)">まだ登録されている議事録・意見がありません。</p>`;

  const eyebrow = meta.displayLabel ? meta.displayLabel : "意思決定支援ダッシュボード(試用版)";

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
</div>

<div class="tabs">
  <button class="active" data-tab="draft">生成AI下書き(ライブ)</button>
  <button data-tab="voices">現場の声(ライブ)</button>
</div>

<div class="panel active" id="panel-draft">
  ${markdownToHtml(data.generatedDraft)}
</div>

<div class="panel" id="panel-voices">
  ${positionRecordsHtml}
</div>

</div>
<script>
(function(){
  var tabs = document.querySelectorAll('.tabs button');
  tabs.forEach(function(btn){
    btn.addEventListener('click', function(){
      tabs.forEach(function(b){ b.classList.remove('active'); });
      document.querySelectorAll('.panel').forEach(function(p){ p.classList.remove('active'); });
      btn.classList.add('active');
      document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
    });
  });

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
