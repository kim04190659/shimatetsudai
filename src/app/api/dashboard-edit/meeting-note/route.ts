// ダッシュボードの「議事メモ」を取得・登録するAPI。
// GET  ?slug=<dashboardSlug>                                → そのダッシュボードの議事メモを新しい順に返す(ログイン不要・閲覧用)
// POST { slug, issuePageId?, dashboardUrl?, title, body }   → 1件登録する(要・編集モードログインCookie)
//
// 旧 /admin/meeting-import (廃止) の代わりに、ダッシュボードの編集モードから
// 直接メモを書けるようにするための窓口。AIによる4分類・Notion4DBへの書き込みは
// ここでは行わない(しまてつだいダッシュボードエージェントに「反映して」と頼んだときに
// 会話の中で行う)。

import { NextRequest, NextResponse } from "next/server";
import { EDIT_SESSION_COOKIE_NAME, verifyEditSessionToken } from "@/lib/dashboardEditAuth";
import { createMeetingNote, listMeetingNotes } from "@/lib/dashboardMeetingNotes";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slugが必要です" }, { status: 400 });
  }

  try {
    const notes = await listMeetingNotes(slug);
    return NextResponse.json({ notes });
  } catch (err) {
    console.error("議事メモの取得に失敗:", err);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const sessionToken = req.cookies.get(EDIT_SESSION_COOKIE_NAME)?.value;
  const session = verifyEditSessionToken(sessionToken);
  if (!session) {
    return NextResponse.json({ error: "編集モードのログインが必要です" }, { status: 401 });
  }

  let body: {
    slug?: string;
    issuePageId?: string;
    dashboardUrl?: string;
    title?: string;
    body?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が不正です" }, { status: 400 });
  }

  const slug = (body.slug ?? "").trim();
  const title = (body.title ?? "").trim();
  const noteBody = (body.body ?? "").trim();

  if (!slug) {
    return NextResponse.json({ error: "slugが必要です" }, { status: 400 });
  }
  if (!noteBody) {
    return NextResponse.json({ error: "議事メモの本文を入力してください" }, { status: 400 });
  }

  try {
    const { pageUrl } = await createMeetingNote({
      dashboardSlug: slug,
      issuePageId: body.issuePageId?.trim() || null,
      dashboardUrl: body.dashboardUrl?.trim() || null,
      title: title || `${new Date().toLocaleDateString("ja-JP")} の議事メモ`,
      body: noteBody,
      authorName: session.editorName,
    });
    return NextResponse.json({ ok: true, editorName: session.editorName, pageUrl });
  } catch (err) {
    console.error("議事メモの保存に失敗:", err);
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
  }
}
