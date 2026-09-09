// 次世代高専教育サイト（public/kosen/）の資料アップロードAPI。
// CR「ドキュメント登録→自動マッチングの連携が未実装」への対応(2026-09-09)から拡張。
//
// 【背景】当初はブラウザ→このAPI(Vercelのサーバー関数)→Notion File Upload API、という経路で
// ファイルを中継していたが、Vercelのサーバー関数にはリクエストボディ4.5MBのハード制限があり
// (2026年現在も変更不可)、実質数MBしかアップロードできなかった。CR「資料アップロードの上限が
// 8MBと小さすぎる」への対応として、ブラウザがVercel Blob（Hobbyプランで無料枠内・最大5TB/ファイル）
// に直接アップロードする方式に切り替えた。このAPIはもうファイルの中身を受け取らず、
// @vercel/blob/client の handleUpload() を使って「アップロード用の署名付きトークン」を発行するだけ。
// アップロード自体はブラウザ→Vercel Blobで直接行われ、完了後に返るURLを
// /api/kosen/register の fileUrl に渡してNotionの「資料」プロパティに外部リンクとして保存する。
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 200 * 1024 * 1024; // 200MB。無認証の公開フォームのため上限は設けるが、100MB程度の資料は十分収まる想定
const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          addRandomSuffix: true,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          tokenPayload: JSON.stringify({ pathname }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // アップロード完了はブラウザ側がURLを受け取ってすぐ/api/kosen/registerに渡すため、
        // ここでは特に追加処理は不要(ログのみ)。
        console.log("kosen資料アップロード完了:", blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error("kosen/upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "アップロード中にエラーが発生しました" },
      { status: 400 }
    );
  }
}
