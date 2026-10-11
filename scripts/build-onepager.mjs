#!/usr/bin/env node
// しまてつだい「決める人のページ（1枚）」生成スクリプト
//
// 使い方（リポジトリのルートで）:
//   node scripts/build-onepager.mjs            # 全データ → public/case-studies/<slug>-onepager.html を生成
//   node scripts/build-onepager.mjs <slug>     # 1件だけ生成
//   node scripts/build-onepager.mjs --link     # 各ダッシュボードに1枚ページへのリンクを追加（何度実行しても重複しない）
//   node scripts/build-onepager.mjs --check    # データの必須項目・禁止事項（決定欄など）を検査
//
// データ: scripts/onepager-data/<slug>.json （スキーマは同フォルダの README.md）
// 決定欄（誰が・いつ・何に決めた）はこのページに置かない。決定は別の議論の場で進める。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'scripts/onepager-data');
const OUT = path.join(ROOT, 'public/case-studies');

// 8つの確認観点（全イシュー共通・順序固定）。内容(s=状態, n=説明)だけをイシューごとに書く。
export const CHECK_TITLES = [
  '① お金', '② 制度・補助・ルール', '③ 必要なもの（場所・設備・手段）', '④ 担い手（人）',
  '⑤ うまくいかない時の備え', '⑥ 住民・関係者の声', '⑦ 時間', '⑧ 後戻りのしやすさ',
];
const STATES = ['ok', 'part', 'check', 'none', 'base'];
const FEAS_MARKS = ['◎', '○', '△', '✕'];

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// 本文の <b>…</b> だけ許可する（それ以外はエスケープ）
const rich = (s) => esc(s).replace(/&lt;b&gt;/g, '<b>').replace(/&lt;\/b&gt;/g, '</b>');

export function validate(d) {
  const errs = [];
  const need = (c, m) => { if (!c) errs.push(m); };
  need(d.slug && /^[a-z0-9-]+$/.test(d.slug), 'slug');
  for (const k of ['org', 'title', 'dashboardTitle', 'decisionDate', 'decider', 'reversibility', 'sources']) need(d[k], k);
  need(Array.isArray(d.plain) && d.plain.length >= 1, 'plain(住民向けのことば)');
  need(Array.isArray(d.facts) && d.facts.length >= 1 && d.facts.length <= 4, 'facts(1〜4件)');
  need(d.north && Array.isArray(d.north.candidates) && d.north.candidates.length >= 1, 'north.candidates');
  need(Array.isArray(d.options) && d.options.length >= 2 && d.options.length <= 3, 'options(2〜3案)');
  (d.options || []).forEach((o, i) => {
    for (const k of ['name', 'say', 'voice']) need(o[k], `options[${i}].${k}`);
    need(o.merits?.length >= 1, `options[${i}].merits`);
    need(o.demerits?.length >= 1, `options[${i}].demerits`);
    need(o.feas?.length >= 2, `options[${i}].feas(2行以上)`);
    need(o.residents?.text, `options[${i}].residents.text`);
  });
  need(Array.isArray(d.checks) && d.checks.length === 8, 'checks は8件');
  (d.checks || []).forEach((c, i) => { need(STATES.includes(c.s), `checks[${i}].s`); need(c.n, `checks[${i}].n`); });
  need(Array.isArray(d.timeline) && d.timeline.length === 5, 'timeline は5件');
  need(d.warn, 'warn');
  // 禁止: 決定欄を置かない
  const blob = JSON.stringify(d);
  if (/決定欄|決めた内容|決定者の署名/.test(blob)) errs.push('決定欄に関する語が含まれています（置かない方針）');
  return errs;
}

const css = `:root{--ink:#2C2C2B;--muted:#7D7A75;--line:#E6E5E3;--soft:#F9F8F7;--blue:#2783DE;--blueSoft:#E5F2FC;--green:#46A171;--greenSoft:#E8F1EC;--orange:#D5803B;--orangeSoft:#FBEBDE;--red:#E56458;--redSoft:#FCE9E7;--yellow:#C9A227;--yellowSoft:#FBF4D9;--purple:#7A5CC7;--purpleSoft:#EFEAFB}
*{box-sizing:border-box}
body{margin:0;background:#eee;color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans JP",sans-serif;line-height:1.6;font-size:14px}
.app{max-width:1180px;margin:0 auto;background:#fff;min-height:100vh}
.topBar{background:#2C2C2B;color:#fff;font-size:12px;padding:8px 28px;display:flex;gap:12px;justify-content:space-between;flex-wrap:wrap}
.topBar a{color:#9cd0ff}
.wrap{padding:22px 28px 40px}
.eyebrow{font-size:11px;color:var(--muted);letter-spacing:.08em;font-weight:800}
h1{font-size:26px;margin:4px 0 6px;font-weight:900}
.meta{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 0}
.chip{display:inline-block;border:1px solid var(--line);background:var(--soft);border-radius:999px;padding:4px 11px;font-size:12px;font-weight:700}
.chip.hot{background:var(--orangeSoft);border-color:#efc9a5;color:#93501a}
.sec{margin-top:22px}
.secH{display:flex;align-items:center;gap:10px;margin:0 0 8px;flex-wrap:wrap}
.num{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:var(--ink);color:#fff;font-weight:900;font-size:13px;flex:none}
.secH h2{font-size:17px;margin:0}
.secH .hint{font-size:12px;color:var(--muted)}
.simple{border:2px solid #9ac9ef;background:#fbfdff;border-radius:14px;padding:14px 16px;font-size:15px}
.simple p{margin:0 0 6px}
.facts{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:10px}
.fact{border:1px solid var(--line);border-radius:10px;padding:10px;background:#fff}
.fact b{display:block;font-size:18px}
.fact span{font-size:11.5px;color:var(--muted);display:block;line-height:1.4}
.north{border:2px solid var(--purple);background:var(--purpleSoft);border-radius:14px;padding:12px 16px}
.north .t{font-size:17px;font-weight:900;margin:4px 0}
.north select{width:100%;margin-top:6px;font:inherit;font-size:13px;border:1px solid #c9bdea;border-radius:8px;padding:6px 8px;background:#fff}
.pill{display:inline-block;border-radius:999px;padding:2px 9px;font-size:11px;font-weight:800;white-space:nowrap}
.pAI{background:var(--blueSoft);color:#165c9d}
.pHuman{background:var(--purpleSoft);color:#4b3494}
.small{font-size:11.5px;color:var(--muted)}
.opts{display:grid;gap:12px}
.opts.n3{grid-template-columns:repeat(3,1fr)}
.opts.n2{grid-template-columns:repeat(2,1fr)}
.opt{border:1px solid var(--line);border-radius:14px;padding:14px;background:#fff;display:flex;flex-direction:column;gap:8px}
.opt h3{margin:0;font-size:16px}
.opt .say{background:var(--soft);border-radius:8px;padding:8px 10px;font-size:13px}
.opt .lab{font-size:11.5px;font-weight:900;color:var(--muted);letter-spacing:.04em;margin-bottom:2px}
.opt ul{margin:0;padding-left:18px;font-size:13px}
.good{color:#1f6b46}
.bad{color:#a13327}
.feas{width:100%;border-collapse:collapse;font-size:12.5px}
.feas td{border-bottom:1px solid var(--line);padding:5px 4px;vertical-align:top}
.feas td:first-child{width:46%;color:var(--muted)}
.feas tr:last-child td{border-bottom:0}
.opt select{font:inherit;font-size:12.5px;border:1px solid var(--line);border-radius:8px;padding:5px 8px;width:100%}
.voice{font-size:12px;background:var(--yellowSoft);border-radius:8px;padding:7px 9px}
.hub{position:relative;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,auto);gap:14px;padding:6px 0}
.hub svg{position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none}
.hub svg line{stroke:#c9c7c3;stroke-width:2;stroke-dasharray:5 4;vector-effect:non-scaling-stroke}
.spoke,.core{position:relative;z-index:1;border-radius:12px;padding:10px 12px;background:#fff;border:2px solid var(--line);font-size:12.5px}
.spoke b{display:block;font-size:13.5px;margin-bottom:2px}
.spoke select{margin-top:6px;font:inherit;font-size:12px;border:1px solid var(--line);border-radius:8px;padding:4px 6px;width:100%;background:#fff;font-weight:800}
.s-ok{border-color:#9fd0b4;background:var(--greenSoft)}
.s-part{border-color:#e6d28a;background:var(--yellowSoft)}
.s-check{border-color:#efc09a;background:var(--orangeSoft)}
.s-none{border-color:#f1a9a2;background:var(--redSoft)}
.s-base{border-color:#b9c4d6;background:#eef2f8}
.core{display:flex;flex-direction:column;justify-content:center;text-align:center;border:3px solid var(--purple);background:var(--purpleSoft)}
.core b{font-size:14px}
.tally{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 10px;font-size:12px}
.tally span{border-radius:999px;padding:3px 10px;font-weight:800}
.tl{display:grid;grid-template-columns:repeat(5,1fr);gap:0;margin-top:6px}
.tl .n{position:relative;padding:34px 8px 0;font-size:12px;text-align:center}
.tl .n::before{content:"";position:absolute;top:13px;left:0;right:0;height:4px;background:#cfd6e2}
.tl .n::after{content:"";position:absolute;top:6px;left:calc(50% - 9px);width:18px;height:18px;border-radius:50%;background:#fff;border:4px solid var(--blue)}
.tl .n.now::after{border-color:var(--orange);background:var(--orange)}
.tl .n.dec::after{border-color:var(--purple);background:var(--purple)}
.tl .n b{display:block;font-size:12.5px}
.warnbar{margin-top:10px;border-left:5px solid var(--red);background:var(--redSoft);border-radius:8px;padding:9px 12px;font-size:12.5px}
.warnbar.premise{border-left-color:var(--orange);background:var(--orangeSoft)}
.foot{margin-top:18px;font-size:11.5px;color:var(--muted)}
@media(max-width:900px){.wrap{padding:16px}.opts.n3,.opts.n2,.facts{grid-template-columns:1fr}.hub{grid-template-columns:1fr;grid-template-rows:none}.hub svg{display:none}.tl{grid-template-columns:1fr}.tl .n{text-align:left;padding:4px 0 10px 30px}.tl .n::before{top:0;bottom:0;left:8px;right:auto;width:4px;height:auto}.tl .n::after{top:6px;left:0}}
@media print{@page{size:A3 landscape;margin:10mm}body{background:#fff}.topBar{display:none}.app{max-width:none}.wrap{padding:0}select{appearance:none;border:0}}`;

const js = `(function(){
var $=function(s){return document.querySelector(s)};var $$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s))};
var ns=$('#northSel');
function north(){var t=ns.options[ns.selectedIndex].text;$('#northText').textContent=t;var c=$('#coreText');if(c)c.textContent=t;}
ns.addEventListener('change',north);north();
var ST={ok:['確認済み','s-ok','#E8F1EC'],part:['一部わかっている','s-part','#FBF4D9'],check:['要確認','s-check','#FBEBDE'],none:['まだ未確認','s-none','#FCE9E7'],base:['前提（動かせない）','s-base','#eef2f8']};
function tally(){var c={ok:0,part:0,check:0,none:0,base:0};$$('.spoke').forEach(function(el){c[el.querySelector('select').value]++});
$('#tally').innerHTML=Object.keys(ST).map(function(k){return '<span style="background:'+ST[k][2]+'">'+ST[k][0]+' '+c[k]+'</span>'}).join('');}
$('#hub').addEventListener('change',function(e){var el=e.target.closest('.spoke');if(!el)return;el.className='spoke '+ST[e.target.value][1];tally();});
tally();
})();`;

const stateLabel = { ok: '確認済み', part: '一部わかっている', check: '要確認', none: 'まだ未確認', base: '前提（動かせない）' };
const stateClass = { ok: 's-ok', part: 's-part', check: 's-check', none: 's-none', base: 's-base' };

function optionHtml(o) {
  const feas = o.feas.map(([k, v]) => {
    const mark = FEAS_MARKS.find((m) => String(v).startsWith(m)) ? String(v)[0] : '';
    const rest = mark ? String(v).slice(1) : String(v);
    return `<tr><td>${esc(k)}</td><td><b>${esc(mark)}</b>${esc(rest)}</td></tr>`;
  }).join('');
  const resPill = o.residents.ai === false ? '' : ' <span class="pill pAI">🤖 下書き</span>';
  return `<div class="opt">
  <h3>${esc(o.name)}</h3>
  <div class="say">${esc(o.say)}</div>
  <div><div class="lab good">メリット</div><ul>${o.merits.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></div>
  <div><div class="lab bad">デメリット</div><ul>${o.demerits.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></div>
  <div><div class="lab">実現可能性</div><table class="feas">${feas}</table></div>
  <div><div class="lab">住民にとって${resPill}</div><div class="small" style="font-size:12.5px">${esc(o.residents.text)}</div></div>
  <div class="voice">これまでの声：${esc(o.voice)}</div>
  <div><div class="lab">北極星に近づくか <span class="pill pHuman">👤</span></div><select class="contrib" aria-label="北極星に近づくか"><option>未評価</option><option>あまり</option><option>ある程度</option><option>大きく</option></select></div>
</div>`;
}

const HUB_ORDER = [0, 1, 2, 7, -1, 3, 6, 5, 4]; // 3x3 の配置。-1 が中央（北極星）
const HUB_LINES = '<line x1="50" y1="50" x2="16.7" y2="16.7"/><line x1="50" y1="50" x2="50" y2="16.7"/><line x1="50" y1="50" x2="83.3" y2="16.7"/><line x1="50" y1="50" x2="16.7" y2="50"/><line x1="50" y1="50" x2="83.3" y2="50"/><line x1="50" y1="50" x2="16.7" y2="83.3"/><line x1="50" y1="50" x2="50" y2="83.3"/><line x1="50" y1="50" x2="83.3" y2="83.3"/>';

export function render(d) {
  const spokes = HUB_ORDER.map((i) => {
    if (i < 0) return `<div class="core"><b>🌟 北極星</b><span class="small" id="coreText"></span><span class="small" style="margin-top:6px">まわりの8つを確認してから決める</span></div>`;
    const c = d.checks[i];
    const opts = STATES.map((k) => `<option value="${k}"${k === c.s ? ' selected' : ''}>${stateLabel[k]}</option>`).join('');
    return `<div class="spoke ${stateClass[c.s]}"><b>${esc(CHECK_TITLES[i])}</b><div>${esc(c.n)}</div><select aria-label="状態">${opts}</select></div>`;
  }).join('\n      ');
  const tl = d.timeline.map((t, i) => `<div class="n${i === 0 ? ' now' : ''}${t.decide ? ' dec' : ''}"><b>${esc(t.b)}</b>${esc(t.t)}</div>`).join('');
  const northOpts = d.north.candidates.map((c, i) => `<option value="${i}">${esc(c)}</option>`).join('');
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(d.title)}｜決める人のページ</title>
<style>${css}</style>
</head>
<body>
<div class="app">
<div class="topBar"><span>決める人のための1枚ページ（AI下書き・内容は議論で更新されます）</span><a href="${esc(d.slug)}.html">議論のダッシュボードへ →</a></div>
<div class="wrap">
  <div class="eyebrow">${esc(d.org)} ／ 決める人のページ</div>
  <h1>${esc(d.title)}</h1>
  <div class="meta">
    <span class="chip hot">決める日：${esc(d.decisionDate)}</span>
    <span class="chip">決める人：${esc(d.decider)}</span>
    <span class="chip">後戻りのしやすさ：${esc(d.reversibility)}</span>
  </div>

  <div class="sec">
    <div class="secH"><span class="num">1</span><h2>何を決めるのか（住民向けのことば）</h2></div>
    <div class="simple">${d.plain.map((p) => `<p>${rich(p)}</p>`).join('')}</div>
    <div class="facts">${d.facts.map((f) => `<div class="fact"><b>${esc(f.b)}</b><span>${esc(f.span)}</span></div>`).join('')}</div>
  </div>

  <div class="sec">
    <div class="secH"><span class="num">2</span><h2>めざす姿（北極星）</h2><span class="hint">どの案も、これに近づくかで見ます</span></div>
    <div class="north">
      <span class="pill pHuman">👤 決める人が選ぶ</span> <span class="small">${esc(d.north.note || '仮置きです。決定の前に、関係者で文言を合意します')}</span>
      <div class="t" id="northText"></div>
      <select id="northSel" aria-label="北極星の候補を選ぶ">${northOpts}</select>
    </div>
  </div>

  <div class="sec">
    <div class="secH"><span class="num">3</span><h2>出ている${d.options.length}つの案</h2><span class="hint">メリット・デメリット・実現可能性（◎とても良い ○良い △難しい ✕かなり難しい）</span></div>
    <div class="opts n${d.options.length}">
${d.options.map(optionHtml).join('\n')}
    </div>${d.premise ? `\n    <div class="warnbar premise">${rich(d.premise)}</div>` : ''}
  </div>

  <div class="sec">
    <div class="secH"><span class="num">4</span><h2>決める前に、忘れてはいけないこと</h2><span class="hint">8つの確認。色は「どこまで分かっているか」。プルダウンで更新できます（議論が進んだら更新します）</span></div>
    <div class="tally" id="tally"></div>
    <div class="hub" id="hub">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${HUB_LINES}</svg>
      ${spokes}
    </div>
    <div class="secH" style="margin-top:18px"><h2 style="font-size:15px">時間の流れ（待ってくれないもの）</h2></div>
    <div class="tl">${tl}</div>
    <div class="warnbar">${rich(d.warn)}</div>
  </div>

  <div class="foot">🤖 は AI の下書き、👤 は人が決める欄です。AIは整理と下書きまで。北極星の文言と、案の評価は人が行います。決定そのものは、別の議論の場で進めます。入力内容は保存されません。<br>
  根拠：${esc(d.sources)}</div>
</div>
</div>
<script>${js}</script>
</body>
</html>
`;
}

const LINK_MARK = 'data-onepager-link';
export function addLink(html, slug) {
  if (html.includes(LINK_MARK)) return { html, changed: false };
  const anchor = '<div class="dh"';
  const i = html.indexOf(anchor);
  if (i < 0) return { html, changed: false, error: '.dh が見つかりません' };
  const link = `<p ${LINK_MARK} style="margin:0 0 10px"><a href="${slug}-onepager.html" style="display:inline-block;border:1px solid #9ac9ef;background:#E5F2FC;color:#165c9d;border-radius:999px;padding:5px 14px;font-size:13px;font-weight:800;text-decoration:none">📄 決める人のページ（1枚）を開く</a></p>\n  `;
  return { html: html.slice(0, i) + link + html.slice(i), changed: true };
}

function main() {
  const args = process.argv.slice(2);
  const files = fs.readdirSync(DATA).filter((f) => f.endsWith('.json'));
  const only = args.find((a) => !a.startsWith('--'));
  const targets = files.filter((f) => !only || f === `${only}.json`);
  if (!targets.length) { console.error('対象データがありません'); process.exit(1); }
  let bad = 0;
  for (const f of targets) {
    const d = JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
    const errs = validate(d);
    if (errs.length) { bad++; console.error(`✗ ${f}: ${errs.join(' / ')}`); continue; }
    if (args.includes('--check')) { console.log(`✓ ${f}`); continue; }
    if (args.includes('--link')) {
      const p = path.join(OUT, `${d.slug}.html`);
      const r = addLink(fs.readFileSync(p, 'utf8'), d.slug);
      if (r.error) { bad++; console.error(`✗ ${d.slug}: ${r.error}`); continue; }
      if (r.changed) fs.writeFileSync(p, r.html);
      console.log(`${r.changed ? '+ リンク追加' : '= 既にあり'}: ${d.slug}.html`);
      continue;
    }
    fs.writeFileSync(path.join(OUT, `${d.slug}-onepager.html`), render(d));
    console.log(`✓ 生成: ${d.slug}-onepager.html`);
  }
  if (bad) process.exit(1);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
