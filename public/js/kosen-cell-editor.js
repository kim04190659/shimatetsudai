/*
 * 高専サイト「先生ページ編集モード」用スクリプト。
 * (public/js/dashboard-cell-editor.js の仕組みを流用。保存先だけSupabaseではなくNotionにしている)
 *
 * 使い方(先生ページHTML側):
 *   1. <body> に data-kosen-slug="case-yonago" のように、このページのファイル名(拡張子なし)を指定する。
 *   2. 生成AIが作成した、先生本人に直してほしい文章の要素に data-cell-id="一意な名前" を付ける。
 *      (例: <p data-cell-id="purpose-text">…</p>)
 *   3. </body>の直前で <script src="/js/kosen-cell-editor.js"></script> を読み込む。
 *
 * 仕組み:
 *   - ページ読み込み時、まずNotionに保存された手修正(セル上書き)を取得し、
 *     該当セルの内容を差し替えて表示する(静的HTMLファイル自体は書き換えない)。
 *   - 右下の「✏️ このページを編集」ボタンを押すと、先生用の合い言葉+お名前の入力を求め、
 *     成功すると data-cell-id を持つ要素がクリックで編集できるようになる。
 *   - 保存すると /api/kosen-edit/cell にPOSTされ、Notionの「📝 高専先生ページ 編集内容」DBに
 *     保存される。次回アクセス時は全員(合い言葉を知らない人でも)その内容で表示される。
 */
(function () {
  "use strict";

  var slug = document.body.getAttribute("data-kosen-slug");
  if (!slug) return; // このページでは編集機能を使わない設定

  var editMode = false;
  var editorName = null;

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === "text") node.textContent = attrs[key];
        else node.setAttribute(key, attrs[key]);
      });
    }
    (children || []).forEach(function (child) {
      node.appendChild(child);
    });
    return node;
  }

  // ---- 1. 起動時に既存の手修正を反映する ----
  function applyOverrides() {
    fetch("/api/kosen-edit/cell?slug=" + encodeURIComponent(slug), { cache: "no-store" })
      .then(function (res) {
        return res.ok ? res.json() : { overrides: [] };
      })
      .then(function (data) {
        (data.overrides || []).forEach(function (ov) {
          var target = document.querySelector('[data-cell-id="' + cssEscape(ov.cellId) + '"]');
          if (!target) return;
          target.textContent = ov.content;
          target.setAttribute("data-edited", "true");
          target.title = "先生による修正: " + (ov.editorName || "匿名") + "(" + formatDate(ov.updatedAt) + ")";
        });
      })
      .catch(function (err) {
        console.warn("先生ページのセル上書き取得に失敗しました", err);
      });
  }

  function cssEscape(value) {
    return String(value).replace(/["\\]/g, "\\$&");
  }

  function formatDate(iso) {
    if (!iso) return "";
    try {
      var d = new Date(iso);
      return d.toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch {
      return iso;
    }
  }

  // ---- 2. 右下の編集モードボタン ----
  function buildToggleButton() {
    var btn = el("button", {
      type: "button",
      text: "✏️ このページを編集",
      style:
        "position:fixed;right:20px;bottom:20px;z-index:9999;padding:10px 16px;border-radius:999px;" +
        "border:none;background:#c96f42;color:#fff;font-size:14px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.25);",
    });
    btn.addEventListener("click", function () {
      if (editMode) {
        disableEditMode();
        btn.textContent = "✏️ このページを編集";
      } else if (editorName) {
        enableEditMode();
        btn.textContent = "✅ 編集中(もう一度押すと終了)";
      } else {
        openLoginDialog(function () {
          enableEditMode();
          btn.textContent = "✅ 編集中(もう一度押すと終了)";
        });
      }
    });
    document.body.appendChild(btn);
  }

  // ---- 3. 合い言葉+お名前の入力ダイアログ(簡易モーダル) ----
  function openLoginDialog(onSuccess) {
    var overlay = el("div", {
      style:
        "position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:10000;" +
        "display:flex;align-items:center;justify-content:center;",
    });
    var nameInput = el("input", {
      type: "text",
      placeholder: "お名前(例：逆瀬川)",
      style: "display:block;width:100%;margin-bottom:10px;padding:8px;font-size:14px;box-sizing:border-box;",
    });
    var passInput = el("input", {
      type: "password",
      placeholder: "編集用の合い言葉",
      style: "display:block;width:100%;margin-bottom:14px;padding:8px;font-size:14px;box-sizing:border-box;",
    });
    var errorMsg = el("div", { style: "color:#dc2626;font-size:13px;margin-bottom:10px;min-height:16px;" });
    var submitBtn = el("button", {
      type: "button",
      text: "編集モードに入る",
      style: "padding:8px 16px;border:none;border-radius:6px;background:#c96f42;color:#fff;cursor:pointer;margin-right:8px;",
    });
    var cancelBtn = el("button", {
      type: "button",
      text: "キャンセル",
      style: "padding:8px 16px;border:none;border-radius:6px;background:#e5e7eb;color:#111;cursor:pointer;",
    });

    var box = el(
      "div",
      { style: "background:#fff;border-radius:10px;padding:24px;width:320px;max-width:90vw;font-family:sans-serif;" },
      [
        el("h3", { text: "先生ページ編集モード", style: "margin:0 0 8px;font-size:16px;" }),
        el("p", {
          text: "生成AIが作成した内容に間違いがあれば、この画面から直接修正できます。",
          style: "margin:0 0 12px;font-size:12px;color:#6b7280;",
        }),
        nameInput,
        passInput,
        errorMsg,
        submitBtn,
        cancelBtn,
      ]
    );
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    cancelBtn.addEventListener("click", function () {
      document.body.removeChild(overlay);
    });

    submitBtn.addEventListener("click", function () {
      var name = nameInput.value.trim();
      var pass = passInput.value;
      if (!name) {
        errorMsg.textContent = "お名前を入力してください";
        return;
      }
      fetch("/api/kosen-edit/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editorName: name, passphrase: pass }),
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (result) {
          if (!result.ok) {
            errorMsg.textContent = result.data.error || "ログインに失敗しました";
            return;
          }
          editorName = result.data.editorName;
          document.body.removeChild(overlay);
          onSuccess();
        })
        .catch(function () {
          errorMsg.textContent = "通信に失敗しました";
        });
    });
  }

  // ---- 4. 編集モードのON/OFF ----
  function enableEditMode() {
    editMode = true;
    document.querySelectorAll("[data-cell-id]").forEach(function (cell) {
      cell.style.outline = "2px dashed #c96f42";
      cell.style.cursor = "text";
      cell.setAttribute("contenteditable", "true");
      cell.addEventListener("blur", onCellBlur);
    });
  }

  function disableEditMode() {
    editMode = false;
    document.querySelectorAll("[data-cell-id]").forEach(function (cell) {
      cell.style.outline = "";
      cell.style.cursor = "";
      cell.removeAttribute("contenteditable");
      cell.removeEventListener("blur", onCellBlur);
    });
  }

  function onCellBlur(e) {
    var cell = e.currentTarget;
    var cellId = cell.getAttribute("data-cell-id");
    var content = cell.textContent.trim();
    if (!content) return; // 誤って空にした場合は保存しない

    fetch("/api/kosen-edit/cell", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: slug, cellId: cellId, content: content }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        if (!result.ok) {
          alert("保存に失敗しました: " + (result.data.error || ""));
          return;
        }
        cell.setAttribute("data-edited", "true");
        cell.title = "先生による修正: " + result.data.editorName + "(たった今)";
      })
      .catch(function () {
        alert("通信に失敗しました。保存できていない可能性があります。");
      });
  }

  // ---- 起動 ----
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function init() {
    applyOverrides();
    buildToggleButton();
  }
})();
