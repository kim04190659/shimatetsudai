// 高専サイト「先生ページ編集モード」に入るためのログインAPI。
// 先生用の合い言葉(KOSEN_EDIT_PASSPHRASE)とお名前(自由記述)を受け取り、
// 正しければ署名付きCookieを発行する。

import { NextRequest, NextResponse } from "next/server";
import {
  checkKosenEditPassphrase,
  createKosenEditSessionToken,
  KOSEN_EDIT_SESSION_COOKIE_NAME,
} from "@/lib/kosenEditAuth";

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
  if (!checkKosenEditPassphrase(passphrase)) {
    return NextResponse.json({ error: "合い言葉が違います" }, { status: 401 });
  }

  const { token, maxAgeSeconds } = createKosenEditSessionToken(editorName);
  const res = NextResponse.json({ ok: true, editorName });
  res.cookies.set(KOSEN_EDIT_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: maxAgeSeconds,
    path: "/",
  });
  return res;
}
