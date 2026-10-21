/* チャット回答の簡易Markdown表示(安全版)。
 * HTMLはすべてエスケープしてから、見出し・太字・箇条書き・番号リスト・改行だけを変換する。
 * window.chatRenderMarkdown(element, text) */
(function(){
  function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function inline(s){
    s = esc(s);
    s = s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
    s = s.replace(/`([^`]+)`/g,'<code>$1</code>');
    return s;
  }
  function render(text){
    // 1行に詰まった「1. **見出し** … 2. **見出し** …」を行ごとに分ける
    text = String(text||'').replace(/([^\n])\s+(\d{1,2}[.．]\s*\*\*)/g,'$1\n$2');
    var lines = text.split(/\r?\n/), out = [], list = null;
    function close(){ if(list){ out.push('</'+list+'>'); list=null; } }
    lines.forEach(function(raw){
      var l = raw.replace(/\s+$/,''), m;
      if(!l.trim()){ close(); return; }
      if((m = l.match(/^\s{0,3}#{1,6}\s+(.*)$/))){ close(); out.push('<p class="cmH"><strong>'+inline(m[1])+'</strong></p>'); return; }
      if((m = l.match(/^\s*[-*・]\s+(.*)$/))){ if(list!=='ul'){close(); out.push('<ul>'); list='ul';} out.push('<li>'+inline(m[1])+'</li>'); return; }
      if((m = l.match(/^\s*(\d{1,2})[.．)]\s+(.*)$/))){ if(list!=='ol'){close(); out.push('<ol>'); list='ol';} out.push('<li value="'+m[1]+'">'+inline(m[2])+'</li>'); return; }
      close(); out.push('<p>'+inline(l)+'</p>');
    });
    close();
    return out.join('');
  }
  window.chatRenderMarkdown = function(el, text){
    el.style.whiteSpace = 'normal';
    el.innerHTML = render(text);
    if(!document.getElementById('chatMdStyle')){
      var st = document.createElement('style'); st.id='chatMdStyle';
      st.textContent = '.chatMsg p{margin:0 0 .5em}.chatMsg p:last-child{margin-bottom:0}.chatMsg ul,.chatMsg ol{margin:.2em 0 .6em;padding-left:1.4em}.chatMsg li{margin:.25em 0}.chatMsg .cmH{margin-top:.4em}.chatMsg code{background:rgba(0,0,0,.06);padding:0 .25em;border-radius:3px}';
      document.head.appendChild(st);
    }
  };
})();
