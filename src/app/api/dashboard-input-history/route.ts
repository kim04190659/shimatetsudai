// 左メニューの入力履歴(議事録・資料の本文)の一覧・全文取得・保存。すべて編集モードのログインが必要。
// GET  ?slug=<slug>            → 履歴の一覧(本文は含めない)
// GET  ?slug=<slug>&id=<id>    → 1件の本文(文字データ)
// POST { slug, kind, title, body, provider }        → 新規保存して id を返す
// POST { slug, id, appliedCount }                   → 反映した件数を記録する

import { NextRequest, NextResponse } from "next/server";
import { EDIT_SESSION_COOKIE_NAME, verifyEditSessionToken } from "@/lib/dashboardEditAuth";
import {
  INPUT_HISTORY_MAX_BODY,
  createInputHistory,
  getInputHistoryBody,
  listInputHistory,
  markInputHistoryApplied,
} from "@/lib/dashboardInputHistory";

export const runtime = "nodejs";

function session(req: NextRequest) {
  return verifyEditSessionToken(req.cookies.get(EDIT_SESSION_COOKIE_NAME)?.value);
}

export async function GET(req: NextRequest) {
  if (!session(req)) {
    return NextResponse.json({ error: "編集モードのログインが必要です" }, { status: 401 });
  }
  const slug = req.nextUrl.searchParams.get("slug")?.trim();
  if (!slug) return NextResponse.json({ error: "slugが必要です" }, { status: 400 });
  const idParam = req.nextUrl.searchParams.get("id");
  try {
    if (idParam) {
      const id = Number(idParam);
      if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "idが不正です" }, { status: 400 });
      const body = await getInputHistoryBody(slug, id);
      if (body === null) return NextResponse.json({ error: "見つかりません" }, { status: 404 });
      return NextResponse.json({ body });
    }
    return NextResponse.json({ items: await listInputHistory(slug) });
  } catch (err) {
    console.error("input-history GET error:", err);
    return NextResponse.json({ error: "履歴の取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const s = session(req);
  if (!s) return NextResponse.json({ error: "編集モードのログインが必要です" }, { status: 401 });
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が不正です" }, { status: 400 });
  }
  const slug = typeof b.slug === "string" ? b.slug.trim() : "";
  if (!slug) return NextResponse.json({ error: "slugが必要です" }, { status: 400 });

  try {
    if (typeof b.id === "number") {
      const count = Number.isInteger(b.appliedCount) ? Math.max(0, b.appliedCount as number) : 0;
      await markInputHistoryApplied(slug, b.id, count);
      return NextResponse.json({ ok: true });
    }
    const body = typeof b.body === "string" ? b.body.trim() : "";
    if (!body) return NextResponse.json({ error: "本文が空です" }, { status: 400 });
    if (body.length > INPUT_HISTORY_MAX_BODY) {
      return NextResponse.json({ error: `本文が長すぎます(${INPUT_HISTORY_MAX_BODY.toLocaleString()}字まで)` }, { status: 413 });
    }
    const kind = b.kind === "material" ? "material" : "minutes";
    const id = await createInputHistory({
      slug,
      kind,
      title: typeof b.title === "string" ? b.title : "",
      body,
      provider: typeof b.provider === "string" ? b.provider.slice(0, 60) : null,
      editorName: s.editorName,
    });
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("input-history POST error:", err);
    return NextResponse.json({ error: "履歴の保存に失敗しました" }, { status: 500 });
  }
}
