// ダッシュボードの「セル単位の手修正」を取得・保存するAPI。
// GET  ?slug=<dashboardSlug>          → そのダッシュボードの手修正済みセルを全件返す(ログイン不要・表示用)
// POST { slug, cellId, content }      → 1セル分を保存する(要ログインCookie)

import { NextRequest, NextResponse } from "next/server";
import { EDIT_SESSION_COOKIE_NAME, verifyEditSessionToken } from "@/lib/dashboardEditAuth";
import { getCellOverrides, upsertCellOverride } from "@/lib/dashboardCellStore";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slugが必要です" }, { status: 400 });
  }

  try {
    const overrides = await getCellOverrides(slug);
    return NextResponse.json({ overrides });
  } catch (err) {
    console.error("セル上書きの取得に失敗:", err);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const sessionToken = req.cookies.get(EDIT_SESSION_COOKIE_NAME)?.value;
  const session = verifyEditSessionToken(sessionToken);
  if (!session) {
    return NextResponse.json({ error: "編集モードのログインが必要です" }, { status: 401 });
  }

  let body: { slug?: string; cellId?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が不正です" }, { status: 400 });
  }

  const slug = (body.slug ?? "").trim();
  const cellId = (body.cellId ?? "").trim();
  const content = body.content ?? "";

  if (!slug || !cellId) {
    return NextResponse.json({ error: "slugとcellIdが必要です" }, { status: 400 });
  }
  // 空文字での保存は事故(誤操作で全消し)の可能性が高いので弾く
  if (content.trim().length === 0) {
    return NextResponse.json({ error: "空の内容は保存できません" }, { status: 400 });
  }

  try {
    await upsertCellOverride({
      dashboardSlug: slug,
      cellId,
      content,
      editorName: session.editorName,
    });
    return NextResponse.json({ ok: true, editorName: session.editorName });
  } catch (err) {
    console.error("セル上書きの保存に失敗:", err);
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
  }
}
