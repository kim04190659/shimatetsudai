/*
 * ダッシュボードの「セル編集モード」用スクリプト。
 *
 * 使い方(ダッシュボードHTML側):
 *   1. <body> に data-dashboard-slug="ieshima-ryugaku-model-dss" のように、
 *      このダッシュボードのファイル名(拡張子なし)を指定する。
 *      議事メモをIssueに紐付けたい場合は data-issue-page-id="<NotionページID>" も付ける(任意)。
 *   2. 分室メンバーに直接直してほしい文言の要素に data-cell-id="一意な名前" を付ける。
 *      (例: <p data-cell-id="summary-tldr">…</p>)
 *   3. 議事メモを表示したい場所に <div id="meeting-notes-list">読み込み中…</div> を置く(任意)。
 *   4. </body>の直前で <script src="/js/dashboard-cell-editor.js"></script> を読み込む。
 *
 * 仕組み:
 *   - ページ読み込み時、まずSupabaseに保存された手修正(セル上書き)を取得し、
 *     該当セルの内容を差し替えて表示する(静的HTMLファイル自体は書き換えない)。
 *   - 右下の「✏️ 編集モード」ボタンを押すと、分室共通の合い言葉+お名前の入力を求め、
 *     成功すると data-cell-id を持つ要素がクリックで編集できるようになる。
 *   - 保存すると /api/dashboard-edit/cell にPOSTされ、Supabaseに保存される。
 *     次回アクセス時は全員(合い言葉を知らない人でも)その内容で表示される。
 *   - 編集モード中は「📝 議事メモを登録」ボタンも表示され、議事録・議事メモを
 *     自由記述でNotionに登録できる(旧/admin/meeting-import画面の代わり)。
 *   - #meeting-notes-list がページ内にあれば、登録済みの議事メモを新しい順に
 *     誰でも(編集モードでなくても)閲覧できるよう自動表示する。
 */
(function () {
  "use strict";

  var slug = document.body.getAttribute("data-dashboard-slug");
  if (!slug) return; // このダッシュボードでは編集機能を使わない設定

  var issuePageId = document.body.getAttribute("data-issue-page-id") || null;
  var editMode = false;
  var editorName = null;
  var memoButton = null;

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
    fetch("/api/dashboard-edit/cell?slug=" + encodeURIComponent(slug), { cache: "no-store" })
      .then(function (res) {
        return res.ok ? res.json() : { overrides: [] };
      })
      .then(function (data) {
        (data.overrides || []).forEach(function (ov) {
          var target = document.querySelector('[data-cell-id="' + cssEscape(ov.cell_id || ov.cellId) + '"]');
          if (!target) return;
          target.textContent = ov.content;
          target.setAttribute("data-edited", "true");
          target.title = "手修正: " + (ov.editor_name || ov.editorName || "匿名") + "(" + formatDate(ov.updated_at || ov.updatedAt) + ")";
        });
      })
      .catch(function (err) {
        console.warn("セル上書きの取得に失敗しました", err);
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
      text: "✏️ 編集モード",
      style:
        "position:fixed;right:20px;bottom:20px;z-index:9999;padding:10px 16px;border-radius:999px;" +
        "border:none;background:#1f2937;color:#fff;font-size:14px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.25);",
    });
    btn.addEventListener("click", function () {
      if (editMode) {
        disableEditMode();
        btn.textContent = "✏️ 編集モード";
      } else if (editorName) {
        enableEditMode();
        btn.textContent = "✅ 編集モード中(もう一度押すと終了)";
      } else {
        openLoginDialog(function () {
          enableEditMode();
          btn.textContent = "✅ 編集モード中(もう一度押すと終了)";
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
      placeholder: "お名前(例：中西)",
      style: "display:block;width:100%;margin-bottom:10px;padding:8px;font-size:14px;box-sizing:border-box;",
    });
    var passInput = el("input", {
      type: "password",
      placeholder: "分室共通の合い言葉",
      style: "display:block;width:100%;margin-bottom:14px;padding:8px;font-size:14px;box-sizing:border-box;",
    });
    var errorMsg = el("div", { style: "color:#dc2626;font-size:13px;margin-bottom:10px;min-height:16px;" });
    var submitBtn = el("button", {
      type: "button",
      text: "編集モードに入る",
      style: "padding:8px 16px;border:none;border-radius:6px;background:#2563eb;color:#fff;cursor:pointer;margin-right:8px;",
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
        el("h3", { text: "セル編集モード", style: "margin:0 0 12px;font-size:16px;" }),
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
      fetch("/api/dashboard-edit/login", {
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
      cell.style.outline = "2px dashed #2563eb";
      cell.style.cursor = "text";
      cell.setAttribute("contenteditable", "true");
      cell.addEventListener("blur", onCellBlur);
    });
    if (memoButton) memoButton.style.display = "block";
  }

  function disableEditMode() {
    editMode = false;
    document.querySelectorAll("[data-cell-id]").forEach(function (cell) {
      cell.style.outline = "";
      cell.style.cursor = "";
      cell.removeAttribute("contenteditable");
      cell.removeEventListener("blur", onCellBlur);
    });
    if (memoButton) memoButton.style.display = "none";
  }

  // ---- 5. 議事メモ登録ボタン(編集モード中のみ表示) ----
  function buildMemoButton() {
    memoButton = el("button", {
      type: "button",
      text: "📝 議事メモを登録",
      style:
        "position:fixed;right:20px;bottom:70px;z-index:9999;padding:10px 16px;border-radius:999px;" +
        "border:none;background:#7c3aed;color:#fff;font-size:14px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.25);" +
        "display:none;",
    });
    memoButton.addEventListener("click", openMemoDialog);
    document.body.appendChild(memoButton);
  }

  function openMemoDialog() {
    var overlay = el("div", {
      style:
        "position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:10000;" +
        "display:flex;align-items:center;justify-content:center;",
    });
    var titleInput = el("input", {
      type: "text",
      placeholder: "タイトル(省略可・例: 9/5 ワークショップ議事メモ)",
      style: "display:block;width:100%;margin-bottom:10px;padding:8px;font-size:14px;box-sizing:border-box;",
    });
    var bodyInput = el("textarea", {
      rows: "8",
      placeholder: "議事録・議事メモの本文を書く/貼り付ける",
      style: "display:block;width:100%;margin-bottom:10px;padding:8px;font-size:14px;box-sizing:border-box;font-family:inherit;",
    });
    var errorMsg = el("div", { style: "color:#dc2626;font-size:13px;margin-bottom:10px;min-height:16px;" });
    var noteMsg = el("div", {
      text: "登録後、しまてつだいダッシュボードエージェントに「議事メモを反映して」と頼むとダッシュボードに反映されます。",
      style: "color:#6b7280;font-size:12px;margin-bottom:10px;",
    });
    var submitBtn = el("button", {
      type: "button",
      text: "登録する",
      style: "padding:8px 16px;border:none;border-radius:6px;background:#7c3aed;color:#fff;cursor:pointer;margin-right:8px;",
    });
    var cancelBtn = el("button", {
      type: "button",
      text: "キャンセル",
      style: "padding:8px 16px;border:none;border-radius:6px;background:#e5e7eb;color:#111;cursor:pointer;",
    });

    var box = el(
      "div",
      { style: "background:#fff;border-radius:10px;padding:24px;width:420px;max-width:90vw;font-family:sans-serif;" },
      [
        el("h3", { text: "議事メモを登録", style: "margin:0 0 12px;font-size:16px;" }),
        titleInput,
        bodyInput,
        noteMsg,
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
      var content = bodyInput.value.trim();
      if (!content) {
        errorMsg.textContent = "本文を入力してください";
        return;
      }
      fetch("/api/dashboard-edit/meeting-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slug,
          issuePageId: issuePageId,
          dashboardUrl: window.location.href,
          title: titleInput.value.trim(),
          body: content,
        }),
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (result) {
          if (!result.ok) {
            errorMsg.textContent = result.data.error || "登録に失敗しました";
            return;
          }
          document.body.removeChild(overlay);
          renderMeetingNotes();
        })
        .catch(function () {
          errorMsg.textContent = "通信に失敗しました";
        });
    });
  }

  // ---- 6. 議事メモ一覧表示(ログイン不要・#meeting-notes-listがあれば自動表示) ----
  function renderMeetingNotes() {
    var container = document.getElementById("meeting-notes-list");
    if (!container) return;

    fetch("/api/dashboard-edit/meeting-note?slug=" + encodeURIComponent(slug), { cache: "no-store" })
      .then(function (res) {
        return res.ok ? res.json() : { notes: [] };
      })
      .then(function (data) {
        var notes = data.notes || [];
        container.innerHTML = "";
        if (notes.length === 0) {
          container.appendChild(
            el("p", { text: "まだ議事メモは登録されていません。", style: "color:#6b7280;" })
          );
          return;
        }
        notes.forEach(function (note) {
          var statusBadge = el("span", {
            text: note.status === "反映済み" ? "✅ 反映済み" : "⏳ 未反映",
            style:
              "display:inline-block;font-size:12px;padding:2px 8px;border-radius:999px;margin-left:8px;" +
              (note.status === "反映済み" ? "background:#dcfce7;color:#166534;" : "background:#fef3c7;color:#92400e;"),
          });
          var card = el(
            "div",
            { style: "border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;margin-bottom:12px;background:#fff;" },
            [
              el("div", { style: "display:flex;align-items:center;flex-wrap:wrap;gap:4px;margin-bottom:6px;" }, [
                el("strong", { text: note.title || "(無題)" }),
                statusBadge,
              ]),
              el("div", {
                text: (note.authorName || "匿名") + "・" + formatDate(note.postedAt),
                style: "color:#6b7280;font-size:12px;margin-bottom:8px;",
              }),
              el("p", { text: note.body, style: "white-space:pre-wrap;margin:0;font-size:14px;line-height:1.6;" }),
            ]
          );
          container.appendChild(card);
        });
      })
      .catch(function () {
        container.innerHTML = "";
        container.appendChild(
          el("p", { text: "議事メモの取得に失敗しました。", style: "color:#dc2626;" })
        );
      });
  }

  function onCellBlur(e) {
    var cell = e.currentTarget;
    var cellId = cell.getAttribute("data-cell-id");
    var content = cell.textContent.trim();
    if (!content) return; // 誤って空にした場合は保存しない

    fetch("/api/dashboard-edit/cell", {
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
        cell.title = "手修正: " + result.data.editorName + "(たった今)";
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
    buildMemoButton();
    renderMeetingNotes();
  }
})();
