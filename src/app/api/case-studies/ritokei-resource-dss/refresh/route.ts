// りとけいライブダッシュボードの「更新」ボタンから呼ばれるAPI。
// 共通パスワード(DASHBOARD_UPDATE_PASSWORD)が一致したときだけ、
// キャッシュタグを無効化して、次の表示でNotion+LLMから再生成させる。

import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { RITOKEI_DASHBOARD_CACHE_TAG } from "@/lib/ritokeiDashboard";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { password } = body ?? {};

    const expected = process.env.DASHBOARD_UPDATE_PASSWORD;
    if (!expected) {
      return NextResponse.json(
        { error: "サーバー側にDASHBOARD_UPDATE_PASSWORDが設定されていません" },
        { status: 500 }
      );
    }

    if (typeof password !== "string" || password !== expected) {
      return NextResponse.json({ error: "パスワードが正しくありません" }, { status: 401 });
    }

    // 第2引数はNext.js 16で必須になった「再生成後、次の更新までどれくらいキャッシュするか」のプロファイル。
    // 更新ボタンで手動更新する運用なので、次に押されるまで長期間キャッシュしてよい("max")。
    revalidateTag(RITOKEI_DASHBOARD_CACHE_TAG, "max");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("dashboard refresh error:", err);
    return NextResponse.json({ error: "更新処理に失敗しました" }, { status: 500 });
  }
}
