// ダッシュボードの「セル編集モード」に入るためのログインAPI。
// 分室共通の合い言葉(DASHBOARD_EDIT_PASSPHRASE)とお名前(自由記述)を受け取り、
// 正しければ署名付きCookieを発行する。

import { NextRequest, NextResponse } from "next/server";
import {
  checkEditPassphrase,
  createEditSessionToken,
  EDIT_SESSION_COOKIE_NAME,
} from "@/lib/dashboardEditAuth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { passphrase?: string; editorName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が不正です" }, { status: 400 });
  }

  const passphrase = (body.passphrase ?? "").trim();
  const editorName = (body.editorName ?? "").trim();

  if (!editorName) {
    return NextResponse.json({ error: "お名前を入力してください" }, { status: 400 });
  }
  if (!checkEditPassphrase(passphrase)) {
    return NextResponse.json({ error: "合い言葉が違います" }, { status: 401 });
  }

  const { token, maxAgeSeconds } = createEditSessionToken(editorName);
  const res = NextResponse.json({ ok: true, editorName });
  res.cookies.set(EDIT_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: maxAgeSeconds,
    path: "/",
  });
  return res;
}
