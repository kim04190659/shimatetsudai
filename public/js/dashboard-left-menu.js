/*
 * ダッシュボード左メニュー「議事録・資料をダッシュボードに反映する」用スクリプト。
 * (2026-10-04 離島経済新聞社 鯨本さんの依頼: 議事録/資料の読み込み反映、国産LLMの活用)
 *
 * 使い方(ダッシュボードHTML側):
 *   1. 左メニュー内の送信ボタン(#genSubmit)の直前に <div id="genPlanMount"></div> を置く。
 *   2. 議事録・資料の本文は既存の #genTitle / #genNotes(ファイルアップロードで追記される)を使う。
 *   3. </body>の直前で、dashboard-cell-editor.js のあとにこのファイルを読み込む。
 *
 * 流れ: 「反映案を作る」→ /api/dashboard-update が、現在のセル(data-cell-id)ごとの更新案を返す
 *       → 差分を見て、反映するものにチェック → 「選んだ変更を反映」で既存の
 *       /api/dashboard-edit/cell に保存(要・編集モードログイン)。自動では書き込まない。
 * 手修正済み(data-edited)のセルは、既定ではチェックを外して表示する(上書きは明示的に選んだときだけ)。
 */
(function () {
  "use strict";
  var mount = document.getElementById("genPlanMount");
  var notesEl = document.getElementById("genNotes");
  var slug = document.body.getAttribute("data-dashboard-slug");
  if (!mount || !notesEl || !slug) return;

  var css = document.createElement("style");
  css.textContent =
    ".gpSeg{display:flex;gap:6px;margin-bottom:10px}" +
    ".gpSeg label{flex:1;display:flex;align-items:center;justify-content:center;gap:4px;border:1px solid var(--line);border-radius:8px;padding:7px 4px;font-size:12px;font-weight:800;cursor:pointer;margin:0;color:var(--ink)}" +
    ".gpSeg input{margin:0}.gpSeg label.on{background:var(--blueSoft);border-color:var(--blue);color:#165c9d}" +
    ".gpNote{font-size:11px;color:var(--muted);margin:4px 0 10px;line-height:1.5}" +
    ".gpMsg{font-size:11.5px;margin:8px 0 0;line-height:1.5}.gpMsg.err{color:var(--red)}.gpMsg.ok{color:var(--green);font-weight:700}" +
    ".gpBox{margin-top:10px;border-top:1px solid var(--line);padding-top:10px}" +
    ".gpItem{border:1px solid var(--line);border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:12px;line-height:1.5}" +
    ".gpItem .gpHead{display:flex;gap:6px;align-items:flex-start;font-weight:800}" +
    ".gpItem .gpHead input{margin-top:3px}" +
    ".gpItem .gpOld{color:var(--muted);text-decoration:line-through;margin-top:4px;word-break:break-word}" +
    ".gpItem .gpNew{margin-top:4px;background:var(--greenSoft);border-radius:6px;padding:4px 6px;word-break:break-word}" +
    ".gpItem .gpWhy{color:var(--muted);font-size:11px;margin-top:4px}" +
    ".gpTag{display:inline-block;background:var(--orangeSoft);color:#9a5a1f;border-radius:6px;padding:1px 6px;font-size:10.5px;margin-left:4px}" +
    ".gpBtn2{width:100%;border:1px solid var(--line);background:#fff;border-radius:999px;padding:8px;font-weight:800;font-size:12px;cursor:pointer;margin-top:6px;color:var(--ink)}" +
    ".gpBtn2:disabled{opacity:.5;cursor:default}";
  document.head.appendChild(css);

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text) n.textContent = text;
    return n;
  }

  // 入力の種類(議事録/資料)
  var seg = el("div", { class: "gpSeg" });
  var kinds = [["minutes", "📝 議事録"], ["material", "📄 資料"]];
  kinds.forEach(function (k, i) {
    var lab = el("label", { class: i === 0 ? "on" : "" });
    var r = el("input", { type: "radio", name: "gpKind", value: k[0] });
    if (i === 0) r.checked = true;
    lab.appendChild(r);
    lab.appendChild(document.createTextNode(k[1]));
    seg.appendChild(lab);
  });
  seg.addEventListener("change", function () {
    seg.querySelectorAll("label").forEach(function (l) {
      l.className = l.querySelector("input").checked ? "on" : "";
    });
  });

  // 使うAI(質問チャットのプルダウンと同じ一覧を使う。なければ既定の4択)
  var chatSel = document.getElementById("chatProvider");
  var sel = el("select", { id: "genProvider", style: "width:100%;border:1px solid var(--line);border-radius:8px;padding:7px;font-size:12px;background:#fff" });
  if (chatSel && chatSel.options.length) {
    Array.prototype.forEach.call(chatSel.options, function (o) {
      sel.appendChild(el("option", { value: o.value }, o.textContent));
    });
  } else {
    [["anthropic", "Claude(既定・安定)"], ["sakura-llmjp", "LLM-jp(さくら・国産)"],
     ["sakura-cotomi", "NEC cotomi v3(さくら・国産)"], ["sakura-plamo", "PLaMo 2.0-31B(さくら・国産)"]]
      .forEach(function (o) { sel.appendChild(el("option", { value: o[0] }, o[1])); });
  }
  var selField = el("div", { class: "field" });
  selField.appendChild(el("label", { for: "genProvider" }, "反映案を作るAI"));
  selField.appendChild(sel);
  selField.appendChild(el("p", { class: "gpNote" },
    "国産LLMで作れなかった場合は、Claudeで自動的にやり直し、結果に明記します。PDFは先にClaudeで文字に起こします。"));

  var planBtn = el("button", { type: "button", class: "primaryBtn", id: "genPlan" }, "反映案を作る(まだ書き換えません)");
  var msg = el("p", { class: "gpMsg", style: "display:none" });
  var box = el("div", { class: "gpBox", style: "display:none" });

  mount.appendChild(seg);
  mount.appendChild(selField);
  mount.appendChild(planBtn);
  mount.appendChild(msg);
  mount.appendChild(box);

  function say(text, cls) {
    msg.className = "gpMsg" + (cls ? " " + cls : "");
    msg.textContent = text;
    msg.style.display = text ? "block" : "none";
  }

  // 反映対象にできるセル: 子要素を持たない(文言だけの)data-cell-id。<b>や<span>pillを含むセルは
  // textContentで書き換えると装飾が消えるため、対象から外す。
  function collectCells() {
    var out = [], seen = {};
    document.querySelectorAll(".appWrap [data-cell-id]").forEach(function (n) {
      var id = n.getAttribute("data-cell-id");
      var text = (n.textContent || "").trim();
      if (!id || seen[id] || n.children.length > 0 || !text) return;
      seen[id] = true;
      out.push({ id: id, text: text });
    });
    return out;
  }
  function cellNode(id) {
    return document.querySelector('.appWrap [data-cell-id="' + id.replace(/["\\]/g, "\\$&") + '"]');
  }
  function cellLabel(id) {
    var n = cellNode(id);
    var host = n && n.closest(".hl,.opt,.card,.dhSec,.voice,.ev,.callout");
    var h = host && host.querySelector("h4,.dhLabel,h3,b");
    var t = h ? h.textContent.replace(/^\s*\d+\s*/, "").trim() : "";
    return (t ? t.slice(0, 24) + " / " : "") + id;
  }

  var lastPlan = null, undoStack = [];

  function render(plan) {
    box.textContent = "";
    box.style.display = "block";
    var model = plan.provider + (plan.model ? "(" + plan.model + ")" : "");
    box.appendChild(el("p", { class: "gpNote", style: "color:var(--ink)" }, "使用したAI: " + model));
    if (plan.fallbackFrom) {
      box.appendChild(el("p", { class: "gpMsg err" }, "選んだAI(" + plan.fallbackFrom + ")では作れなかったため、Claudeで作成しました。"));
    }
    if (plan.summary) box.appendChild(el("p", { class: "gpNote", style: "color:var(--ink)" }, plan.summary));
    if (!plan.updates.length) {
      box.appendChild(el("p", { class: "gpNote" }, "反映できる更新案はありませんでした。"));
      return;
    }
    plan.updates.forEach(function (u, i) {
      var node = cellNode(u.cellId);
      var edited = node && node.getAttribute("data-edited") === "true";
      var item = el("div", { class: "gpItem" });
      var head = el("label", { class: "gpHead", style: "margin:0;color:var(--ink);font-size:12px" });
      var cb = el("input", { type: "checkbox", "data-gp-index": String(i) });
      if (!edited) cb.checked = true;
      head.appendChild(cb);
      head.appendChild(document.createTextNode(cellLabel(u.cellId)));
      if (edited) head.appendChild(el("span", { class: "gpTag" }, "手修正済み・上書きに注意"));
      item.appendChild(head);
      item.appendChild(el("div", { class: "gpOld" }, node ? node.textContent.trim() : ""));
      item.appendChild(el("div", { class: "gpNew" }, u.newText));
      if (u.reason) item.appendChild(el("div", { class: "gpWhy" }, "根拠: " + u.reason));
      box.appendChild(item);
    });
    if (plan.droppedCount) {
      box.appendChild(el("p", { class: "gpNote" }, "※ 対象外のセルを指していた案が" + plan.droppedCount + "件あり、除外しました。"));
    }
    var apply = el("button", { type: "button", class: "primaryBtn", id: "genApply" }, "選んだ変更を反映する(保存・公開されます)");
    var undo = el("button", { type: "button", class: "gpBtn2", id: "genUndo", disabled: "disabled" }, "直前の反映を元に戻す");
    box.appendChild(apply);
    box.appendChild(undo);
    box.appendChild(el("p", { class: "gpNote" }, "保存には、右下の「✏️ 編集モード」でのログインが必要です。"));
    apply.addEventListener("click", function () { doApply(apply, undo); });
    undo.addEventListener("click", function () { doUndo(undo); });
  }

  function saveCell(cellId, content) {
    return fetch("/api/dashboard-edit/cell", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: slug, cellId: cellId, content: content })
    });
  }

  async function doApply(applyBtn, undoBtn) {
    var picks = [];
    box.querySelectorAll("input[data-gp-index]").forEach(function (c) {
      if (c.checked) picks.push(lastPlan.updates[Number(c.getAttribute("data-gp-index"))]);
    });
    if (!picks.length) { say("反映する項目にチェックを入れてください。", "err"); return; }
    applyBtn.disabled = true;
    var done = [];
    try {
      for (var i = 0; i < picks.length; i++) {
        var u = picks[i], node = cellNode(u.cellId);
        if (!node) continue;
        var prev = { id: u.cellId, text: node.textContent, edited: node.getAttribute("data-edited") === "true" };
        var res = await saveCell(u.cellId, u.newText);
        if (res.status === 401) {
          say(done.length ? "途中でログインが切れました。" + done.length + "件は反映済みです。" : "右下の「✏️ 編集モード」でログインしてから、もう一度押してください。", "err");
          break;
        }
        if (!res.ok) throw new Error("save failed");
        node.textContent = u.newText;
        node.setAttribute("data-edited", "true");
        node.title = "手修正(資料からの反映)";
        done.push(prev);
      }
      if (done.length) {
        undoStack = done;
        undoBtn.disabled = false;
        say(done.length + "件を反映しました。右の質問チャットにも反映後の内容が使われます。", "ok");
      }
    } catch (e) {
      say("保存に失敗しました。時間をおいて再度お試しください。" + (done.length ? "(" + done.length + "件は反映済み)" : ""), "err");
      if (done.length) { undoStack = done; undoBtn.disabled = false; }
    } finally {
      applyBtn.disabled = false;
    }
  }

  async function doUndo(undoBtn) {
    if (!undoStack.length) return;
    undoBtn.disabled = true;
    var failed = 0;
    for (var i = 0; i < undoStack.length; i++) {
      var p = undoStack[i], node = cellNode(p.id);
      try {
        var res = await saveCell(p.id, p.text);
        if (!res.ok) throw new Error("x");
        if (node) {
          node.textContent = p.text;
          if (!p.edited) { node.removeAttribute("data-edited"); node.removeAttribute("title"); }
        }
      } catch (e) { failed++; }
    }
    say(failed ? failed + "件を戻せませんでした。" : "元の文言に戻しました。", failed ? "err" : "ok");
    undoStack = [];
  }

  planBtn.addEventListener("click", async function () {
    var notes = notesEl.value.trim();
    if (!notes) { say("議事録または資料の本文を貼り付けるか、ファイルを選んでください。", "err"); return; }
    var kindInput = seg.querySelector("input:checked");
    var cells = collectCells();
    say("", "");
    box.style.display = "none";
    planBtn.disabled = true;
    planBtn.textContent = "反映案を作成中…(30秒〜1分)";
    try {
      var res = await fetch("/api/dashboard-update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          issueTitle: (document.getElementById("genTitle") || {}).value || "",
          sourceNotes: notes,
          sourceKind: kindInput ? kindInput.value : "minutes",
          provider: sel.value,
          cells: cells
        })
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) { say(data.error || "反映案の作成に失敗しました。", "err"); return; }
      lastPlan = data;
      render(data);
    } catch (e) {
      say("反映案の作成に失敗しました。時間をおいて再度お試しください。", "err");
    } finally {
      planBtn.disabled = false;
      planBtn.textContent = "反映案を作る(まだ書き換えません)";
    }
  });
})();
