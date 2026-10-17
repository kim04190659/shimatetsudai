// 屋久島「入域料の使途限定問題」の「決める人のページ(1枚)」を、パスワード保護つきで配信するRoute Handler。
// 認証は元ダッシュボード(yakushima-nyuikiryo-earmarking-dss-protected)と共通:
// 同じパスワード・同じCookie(SESSION_SLUG)・同じ認証APIを使うので、どちらか一方に入れば
// もう一方も再入力なしで開ける。公開URLは next.config.ts の rewrites で
// /case-studies/yakushima-nyuikiryo-earmarking-dss-onepager.html をこのルートへ転送している。
import { cookies } from "next/headers";
import { verifySessionToken, tenantCookieName } from "@/lib/tenantAuth";
import { yakushimaNyuikiryoEarmarkingOnepagerHtmlBase64 } from "@/lib/protectedDashboards/yakushimaNyuikiryoEarmarkingOnepagerHtml";

const SLUG = "yakushima-nyuikiryo-earmarking-dss";
const SESSION_SLUG = `case-study:${SLUG}`;

export const runtime = "nodejs";

function gateHtml(): string {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>このページは非公開です | シマの北極星</title>
<style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F9F8F7;color:#2C2C2B;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans JP",sans-serif}
.box{max-width:360px;width:100%;margin:0 16px;padding:32px 28px;background:#fff;border:1px solid #E6E5E3;border-radius:16px}
h1{font-size:18px;margin:0 0 8px}
p{font-size:13px;color:#7D7A75;margin:0 0 18px;line-height:1.6}
input{width:100%;box-sizing:border-box;border:1px solid #E6E5E3;border-radius:8px;padding:10px 12px;font-size:14px}
button{margin-top:12px;width:100%;border:none;background:#2783DE;color:#fff;border-radius:999px;padding:10px;font-weight:700;font-size:14px;cursor:pointer}
button:disabled{opacity:.5;cursor:default}
.err{color:#E56458;font-size:12px;margin-top:8px}
</style>
</head>
<body>
<div class="box">
  <h1>このページは非公開です</h1>
  <p>ご案内時にお伝えしたパスワードを入力してください。</p>
  <form id="f">
    <input type="password" id="pw" placeholder="パスワード" autofocus>
    <button type="submit" id="submitBtn">入る</button>
    <p class="err" id="err" style="display:none"></p>
  </form>
</div>
<script>
document.getElementById('f').addEventListener('submit', async function (e) {
  e.preventDefault();
  var pw = document.getElementById('pw').value;
  var err = document.getElementById('err');
  var btn = document.getElementById('submitBtn');
  err.style.display = 'none';
  btn.disabled = true;
  try {
    var res = await fetch('/api/case-studies/${SLUG}/auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    });
    if (res.ok) {
      location.reload();
    } else {
      var body = await res.json().catch(function () { return {}; });
      err.textContent = body.error || 'パスワードが正しくありません。';
      err.style.display = 'block';
      btn.disabled = false;
    }
  } catch (e) {
    err.textContent = 'エラーが発生しました。時間をおいて再度お試しください。';
    err.style.display = 'block';
    btn.disabled = false;
  }
});
</script>
</body>
</html>`;
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(tenantCookieName(SESSION_SLUG))?.value;

  if (!verifySessionToken(SESSION_SLUG, token)) {
    return new Response(gateHtml(), {
      status: 401,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const html = Buffer.from(yakushimaNyuikiryoEarmarkingOnepagerHtmlBase64, "base64").toString("utf-8");
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
