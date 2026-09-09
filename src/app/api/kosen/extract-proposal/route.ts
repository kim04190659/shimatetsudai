// 次世代高専教育サイト（public/kosen/）のアップロード資料から、
// 「どんな教育ができるか／どんな協力ができるか」の下書き文章をAIに生成させるAPI。
// CR「ファイルの内容を読み取って自由記述欄に自動反映してほしい。複数ファイルもまとめてアップロードしたい」対応(2026-09-09)。
//
// フロント側の流れ:
//   1. 資料をVercel Blobにアップロード(/api/kosen/upload、複数可)
//   2. アップロード済みのURL一覧をこのAPIに渡し、下書き文章を取得
//   3. 自由記述欄(freeText/teacherContent)に自動で反映する
import { NextRequest, NextResponse } from "next/server";
import { draftProposalFromFiles, type UploadedFileRef } from "@/lib/llm/fileExtract";

export const runtime = "nodejs";

type ExtractProposalBody = {
  files: UploadedFileRef[];
};

function isValidFileRef(value: unknown): value is UploadedFileRef {
  if (!value || typeof value !== "object") return false;
  const f = value as Partial<UploadedFileRef>;
  return typeof f.url === "string" && f.url.length > 0 && typeof f.name === "string" && f.name.length > 0;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ExtractProposalBody>;
    const files = Array.isArray(body.files) ? body.files.filter(isValidFileRef) : [];

    if (files.length === 0) {
      return NextResponse.json({ error: "filesは1件以上必要です" }, { status: 400 });
    }
    // 一度に処理するファイル数が多すぎるとClaudeへのリクエストが肥大化するため上限を設ける
    if (files.length > 10) {
      return NextResponse.json({ error: "一度に自動読み取りできるのは10ファイルまでです" }, { status: 400 });
    }

    const result = await draftProposalFromFiles(files);
    if (!result) {
      return NextResponse.json(
        { error: "アップロードされた資料からは自動で内容を読み取れませんでした（対応形式：PDF/Word/画像/テキスト）" },
        { status: 422 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("kosen/extract-proposal error:", err);
    return NextResponse.json(
      { error: "資料の自動読み取り中にエラーが発生しました。時間をおいて再度お試しください。" },
      { status: 502 }
    );
  }
}
