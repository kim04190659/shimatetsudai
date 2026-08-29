// 管理者画面用の簡易アクセス制御。
//
// 本格的なロール別ログイン基盤(Supabase Auth)は別のChangeRequest
// 「Supabase Authログイン基盤＋ロール別/adminメニュー・API」で対応予定(現在Status=保留)。
// それまでの間、/admin配下のAPIを誰でも叩ける状態にしないための最低限の仮ゲートとして、
// 共有シークレット(ADMIN_ACCESS_KEY)による簡易チェックのみを行う。
import { NextRequest, NextResponse } from "next/server";

/**
 * リクエストヘッダ x-admin-key が環境変数 ADMIN_ACCESS_KEY と一致するか確認する。
 * ADMIN_ACCESS_KEY が未設定の場合は、開発・試用段階とみなしチェックをスキップする
 * (本番運用に入る際は必ず設定すること)。
 * 拒否する場合はNextResponseを返し、呼び出し側はそれをそのままreturnする。問題なければnull。
 */
export function assertAdminAccess(req: NextRequest): NextResponse | null {
  const expected = process.env.ADMIN_ACCESS_KEY;
  if (!expected) {
    console.warn("ADMIN_ACCESS_KEY が未設定のため、管理者APIのアクセス制御をスキップしています");
    return null;
  }
  const provided = req.headers.get("x-admin-key");
  if (provided !== expected) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }
  return null;
}
