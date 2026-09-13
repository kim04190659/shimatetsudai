// アップロードされたPDFファイルから、AI(Claude)にテキストを書き起こしてもらうAPI。
// 2026-09-13 鯨本さん(離島経済新聞社)からの依頼で、資料投入エリアに
// .txt/.md/.pdfのアップロード対応を追加した際に新設。
// .txt/.mdはブラウザ側でそのままテキストとして読み込めるため、
// このAPIはAIによる文字起こしが必要なPDFの処理のみを担当する。
//
// Claudeの Messages API はPDFを"document"コンテンツブロックとして直接受け取れるため、
// 別途OCRライブラリを使わずに済む。既存の要約系プロバイダー(src/lib/llm)とは独立した、
// 単発のAnthropic API呼び出しとして実装している。

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `あなたは、アップロードされた資料(PDF)の内容をテキストとして書き起こすアシスタントです。

# 出力ルール
- 資料に書かれている内容を、見出しや箇条書きの構造を保ったまま日本語のテキストとして書き起こす
- 表がある場合は、行の内容が分かるように書き出す(厳密な表組みの再現は不要)
- 資料に無い内容を推測で補わない
- 書き起こした本文だけを出力し、前置き・感想・要約コメントは書かない`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, mimeType, dataBase64 } = body ?? {};

    if (mimeType !== "application/pdf") {
      return NextResponse.json({ error: "現在PDFファイルのみ対応しています" }, { status: 400 });
    }
    if (typeof dataBase64 !== "string" || dataBase64.trim() === "") {
      return NextResponse.json({ error: "dataBase64 は必須です(文字列)" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY が未設定です" }, { status: 500 });
    }

    let res: Response;
    try {
      res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "document",
                  source: { type: "base64", media_type: "application/pdf", data: dataBase64 },
                },
                {
                  type: "text",
                  text: `この資料(${typeof fileName === "string" && fileName ? fileName : "アップロードされたPDF"})の内容を、書き起こしてください。`,
                },
              ],
            },
          ],
        }),
        signal: AbortSignal.timeout(60_000),
      });
    } catch {
      return NextResponse.json({ error: "PDFの読み取りに失敗しました(接続エラー)" }, { status: 502 });
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error("extract-document API error:", errText);
      return NextResponse.json({ error: "PDFの読み取りに失敗しました" }, { status: 502 });
    }

    const data = await res.json();
    const text = data.content?.find((b: { type: string }) => b.type === "text")?.text;
    if (!text) {
      return NextResponse.json({ error: "PDFからテキストを取得できませんでした" }, { status: 502 });
    }

    return NextResponse.json({ text });
  } catch (err) {
    console.error("extract-document error:", err);
    return NextResponse.json({ error: "PDFの読み取りに失敗しました" }, { status: 502 });
  }
}
