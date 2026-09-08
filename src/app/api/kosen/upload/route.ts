// 次世代高専教育サイト（public/kosen/）の資料アップロードAPI
// CR「ドキュメント登録→自動マッチングの連携が未実装」への対応(2026-09-09)。
// 先生・企業の登録フォームから送信された資料(PDF/画像/テキスト等)をNotionの File Upload API に
// アップロードし、file_upload id を返す。この id は続けて /api/kosen/register の fileUploadId に渡し、
// 「📥 先生・企業 登録リクエスト」DBの「資料」プロパティに添付する。
import { NextRequest, NextResponse } from "next/server";
import { createKosenFileUpload } from "@/lib/notion";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB。src/lib/notion.tsのMAX_KOSEN_UPLOAD_BYTESと合わせる

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "ファイルが指定されていません" }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "空のファイルはアップロードできません" }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "ファイルサイズが大きすぎます（8MBまで）" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileUploadId = await createKosenFileUpload(
      file.name || "資料",
      file.type || "application/octet-stream",
      buffer
    );

    return NextResponse.json({ ok: true, fileUploadId, filename: file.name, contentType: file.type });
  } catch (err) {
    console.error("kosen/upload error:", err);
    return NextResponse.json(
      { error: "アップロード中にエラーが発生しました。時間をおいて再度お試しください。" },
      { status: 500 }
    );
  }
}
