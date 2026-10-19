// 国産LLM(LLM-jp)を選んだときに、モデルの提供元とライセンスを画面に表示する。
// Apache License 2.0 の表示義務・出所明示のため。選択を外すと消える。
// 使い方: 各ページで読み込むと #chatProvider に自動で付く。動的に作るプルダウンは
//   window.llmLicenseNoteAttach(selectElement) を呼ぶ。
// モデルを増やすときは NOTES に1件追加し、docs/THIRD_PARTY_NOTICES.md と public/legal/third-party-notices.html も更新する。
(function () {
  "use strict";
  var NOTES = {
    "sakura-llmjp": {
      text: "LLM-jp-3.1-8x13b-instruct4(国立情報学研究所 LLM-jp)を、さくらインターネットのAI Engine経由で利用しています。ライセンス: Apache License 2.0。モデルは改変していません。出力は人が確認してから使ってください。",
      links: [
        ["モデルカード", "https://huggingface.co/llm-jp/llm-jp-3.1-8x13b-instruct4"],
        ["Apache 2.0", "https://www.apache.org/licenses/LICENSE-2.0"],
        ["利用上の表示", "/legal/third-party-notices.html"]
      ]
    }
  };

  function attach(sel) {
    if (!sel || sel.dataset.licNote) return;
    sel.dataset.licNote = "1";
    var p = document.createElement("p");
    p.className = "llmLicNote";
    p.style.cssText = "display:none;font-size:11px;line-height:1.5;color:#5a6472;margin:4px 0 8px;background:#f4f7fb;border-radius:6px;padding:6px 8px";
    var host = sel.closest(".chatProviderRow, .field") || sel.parentNode;
    host.insertAdjacentElement("afterend", p);
    function update() {
      var n = NOTES[sel.value];
      p.textContent = "";
      if (!n) { p.style.display = "none"; return; }
      p.appendChild(document.createTextNode(n.text + " "));
      n.links.forEach(function (l, i) {
        var a = document.createElement("a");
        a.href = l[1]; a.target = "_blank"; a.rel = "noopener"; a.textContent = l[0];
        p.appendChild(a);
        if (i < n.links.length - 1) p.appendChild(document.createTextNode(" / "));
      });
      p.style.display = "block";
    }
    sel.addEventListener("change", update);
    update();
  }

  window.llmLicenseNoteAttach = attach;
  window.llmLicenseNotes = NOTES;
  function init() { attach(document.getElementById("chatProvider")); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
