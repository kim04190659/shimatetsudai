// 次世代高専教育サイト（public/kosen/）の資料アップロードAPI。
// CR「ドキュメント登録→自動マッチングの連携が未実装」への対応(2026-09-09)から拡張。
//
// 【背景1】当初はブラウザ→このAPI(Vercelのサーバー関数)→Notion File Upload API、という経路で
// ファイルを中継していたが、Vercelのサーバー関数にはリクエストボディ4.5MBのハード制限があり
// (2026年現在も変更不可)、実質数MBしかアップロードできなかった。CR「資料アップロードの上限が
// 8MBと小さすぎる」への対応として、ブラウザがVercel Blob（Hobbyプランで無料枠内・最大5TB/ファイル）
// に直接アップロードする方式に切り替えた。
//
// 【背景2・2026-09-10】上記を最初は@vercel/blob/clientの handleUpload()(クライアントトークン方式)で
// 実装していたが、本番で「アップロードが97%等で止まって完了しない」という不具合が発生。
// Claude Browserで実際に再現・調査した結果、handleUpload方式のブラウザ側SDKが内部で叩く
// `https://vercel.com/api/blob/?pathname=...` というエンドポイントがCORSヘッダーを返しておらず、
// ブラウザがブロック→SDKが無限リトライ、という Vercelプラットフォーム側の既知の不具合
// (Vercel Community: "Vercel Blob client upload blocked by CORS", 2026-08-01投稿, 未解決)に該当する
// ことが判明した。この不具合はコード側の問題ではなく回避のしようがないため、Vercelが新しく提供している
// 「署名付きURL(Signed URLs)」方式(handleUploadPresigned/uploadPresigned)に切り替えて回避している。
// こちらはブラウザ→Blobの通信にVercel管理のベアラートークンを使わず、HMAC署名済みURLに直接PUTする
// 別経路のため、上記のCORS不具合の影響を受けない。
//
// このAPIはファイルの中身を受け取らず、「アップロード用の署名付きURLの発行に必要な署名トークン」を
// 発行するだけ。アップロード自体はブラウザ→Vercel Blobで直接行われ、完了後に返るURLを
// /api/kosen/register の files に渡してNotionの「資料」プロパティに外部リンクとして保存する。
import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
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

// 署名付きURLの有効期限(この時間内にアップロードを完了する必要がある)
const TOKEN_VALID_MS = 60 * 60 * 1000; // 1時間

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as HandleUploadPresignedBody;

  try {
    const jsonResponse = await handleUploadPresigned({
      body,
      request: req,
      getSignedToken: async (pathname) => {
        // pathnameごとに署名トークンを発行し、そのままアップロードURLの制約(urlOptions)にも反映する
        const validUntil = Date.now() + TOKEN_VALID_MS;
        const token = await issueSignedToken({
          pathname,
          operations: ["put"],
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          validUntil,
        });
        return {
          token,
          urlOptions: {
            allowedContentTypes: ALLOWED_CONTENT_TYPES,
            maximumSizeInBytes: MAX_UPLOAD_BYTES,
            addRandomSuffix: true,
            allowOverwrite: false,
            validUntil,
          },
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
