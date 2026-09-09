// アップロードされた資料(PDF/Word/画像/テキスト)の内容をClaudeに読ませて、
// 「どんな教育ができるのか／どんな協力ができるのか」の自由記述欄に使える下書き文章を生成する。
// CR「ファイルの内容を読み取って自動的に記載できるようにしてほしい。複数ファイルもまとめてアップロードしたい」対応(2026-09-09)。
//
// 対応形式ごとの扱い方:
//   - PDF・画像       … Claudeの「document/image」入力機能にそのまま渡す(base64化して送信)。
//                        Claudeはページを画像として見た上でテキストも読み取ってくれる。
//   - .txt/.md        … プレーンテキストとしてそのまま読ませる。
//   - .doc/.docx      … Claude APIはWord形式を直接読めないため、サーバー側でmammothライブラリを
//                        使ってテキストを抽出してから渡す。
//   - 上記以外の形式    … 自動読み取りは行わず、呼び出し側に「未対応」として伝える。
//
// 既存のsrc/lib/llm(A3意思決定支援シート要約)とは目的も入力形式も異なるため、あえて別ファイルに分けている。
// モデルは既存のAnthropicProviderと同じClaude Haiku(安価・高速)を使う。

import mammoth from "mammoth";
import { get as getBlob } from "@vercel/blob";
import { LlmProviderError } from "./types";

const MODEL = "claude-haiku-4-5-20251001";

// Claudeへの1リクエストの上限は32MB(base64化・他コンテンツ込み)。
// 複数ファイル・複数リクエストの余裕を見て、1ファイルあたりの元サイズをこれ以下に制限する。
const MAX_FILE_BYTES_FOR_AI = 20 * 1024 * 1024; // 20MB

export type UploadedFileRef = {
  url: string; // Vercel Blobの公開URL
  name: string;
  contentType?: string;
};

export type FileProposalOutput = {
  draft: string;
  provider: string;
  model: string;
  // 自動読み取りをスキップしたファイル名(未対応形式・サイズ超過など)
  skippedFiles: string[];
};

const SYSTEM_PROMPT = `あなたは、高専(高等専門学校)の先生・企業人材向けサイトの登録フォームを手伝うアシスタントです。
ユーザーが添付した資料(シラバス案・企業紹介資料・技術資料など)の内容から、
「どんな教育ができるのか」「どんな協力ができるのか」を、登録フォームの自由記述欄にそのまま使える
日本語の文章として下書きしてください。

# 出力ルール
- 300字程度の自然な文章にする(箇条書きにしない。前置きや挨拶も不要で、本文だけを出力する)
- 資料に書かれていない事実を勝手に作らない
- 専門用語は避け、高専の先生や地域の企業人にも分かる言葉で書く
- 資料が複数ある場合は、内容を統合して1つの文章にまとめる
- 資料の内容から教育・協力の切り口が読み取れない場合は、資料の概要を短くまとめるだけにとどめる`;

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "document"; source: { type: "base64"; media_type: string; data: string } }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } };

type FileKind = "pdf" | "image" | "text" | "docx" | "unsupported";

// mimeタイプ・拡張子から、Claudeにどう渡すかを判定する
function guessKind(name: string, contentType?: string): FileKind {
  const lower = name.toLowerCase();
  if (contentType === "application/pdf" || lower.endsWith(".pdf")) return "pdf";
  if ((contentType && contentType.startsWith("image/")) || /\.(png|jpe?g|gif|webp)$/.test(lower)) {
    return "image";
  }
  if (lower.endsWith(".docx") || lower.endsWith(".doc")) return "docx";
  if (lower.endsWith(".txt") || lower.endsWith(".md") || contentType === "text/plain" || contentType === "text/markdown") {
    return "text";
  }
  return "unsupported";
}

// アップロード済みの資料をサーバー側で取得する。
// 素のfetch(url)だと「Blobストアが非公開(private)設定の場合に403で失敗する」ことが
// 判明したため(2026-09-10、Vercelログで実際に確認)、@vercel/blobの認証付きget()関数を使う。
// get()はストアの認証情報(このAPIルートが持つBLOB_READ_WRITE_TOKEN/OIDC)を使ってアクセスするため、
// ストアの公開・非公開設定によらず確実に取得できる。アップロード時にaccess:'public'を指定しているが、
// 念のためpublic→privateの順に試す。
async function fetchAsBuffer(url: string, label: string): Promise<Buffer> {
  for (const access of ["public", "private"] as const) {
    try {
      const result = await getBlob(url, { access });
      if (result && result.stream) {
        const arrayBuffer = await new Response(result.stream).arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
    } catch {
      // このaccessモードでは取得できなかった。次のモードを試す。
    }
  }
  throw new Error(`「${label}」の取得に失敗しました`);
}

// 1件のファイルを、Claudeに渡せるcontentブロックに変換する。
// 未対応形式・サイズ超過の場合はnullを返す(呼び出し側でスキップ扱いにする)。
async function fileToContentBlock(file: UploadedFileRef): Promise<ContentBlock | null> {
  const kind = guessKind(file.name, file.contentType);
  if (kind === "unsupported") return null;

  if (kind === "text") {
    const buf = await fetchAsBuffer(file.url, file.name);
    const text = buf.toString("utf-8").slice(0, 8000);
    return { type: "text", text: `--- 添付資料「${file.name}」 ---\n${text}` };
  }

  if (kind === "docx") {
    const buf = await fetchAsBuffer(file.url, file.name);
    if (buf.byteLength > MAX_FILE_BYTES_FOR_AI) return null;
    // mammothはWord(.docx)からプレーンテキストを抽出するライブラリ。
    // 旧形式の.docは正しく抽出できないことがあるため、抽出結果が空ならスキップ扱いにする。
    const { value: text } = await mammoth.extractRawText({ buffer: buf });
    if (!text.trim()) return null;
    return { type: "text", text: `--- 添付資料「${file.name}」(Word文書より抽出) ---\n${text.slice(0, 8000)}` };
  }

  if (kind === "pdf") {
    const buf = await fetchAsBuffer(file.url, file.name);
    if (buf.byteLength > MAX_FILE_BYTES_FOR_AI) return null;
    return { type: "document", source: { type: "base64", media_type: "application/pdf", data: buf.toString("base64") } };
  }

  // image
  const buf = await fetchAsBuffer(file.url, file.name);
  if (buf.byteLength > MAX_FILE_BYTES_FOR_AI) return null;
  const mediaType = file.contentType && file.contentType.startsWith("image/") ? file.contentType : "image/png";
  return { type: "image", source: { type: "base64", media_type: mediaType, data: buf.toString("base64") } };
}

/**
 * 複数の添付ファイルの内容から、「どんな教育ができるか／協力できるか」の下書き文章を生成する。
 * 対応形式のファイルが1件も無かった場合はnullを返す(呼び出し側で「自動反映できませんでした」を出す)。
 */
export async function draftProposalFromFiles(files: UploadedFileRef[]): Promise<FileProposalOutput | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new LlmProviderError("anthropic", "ANTHROPIC_API_KEY が未設定です");
  }

  // 各ファイルをcontentブロックに変換する。読み取れなかったファイルはskippedFilesに集めて、
  // ユーザーに「このファイルは自動反映されていません」と伝えられるようにする。
  const blocks: ContentBlock[] = [];
  const skippedFiles: string[] = [];
  for (const file of files) {
    try {
      const block = await fileToContentBlock(file);
      if (block) {
        blocks.push(block);
      } else {
        skippedFiles.push(file.name);
      }
    } catch (err) {
      console.error(`資料「${file.name}」の読み取りに失敗しました:`, err);
      skippedFiles.push(file.name);
    }
  }

  if (blocks.length === 0) return null;

  const userContent: ContentBlock[] = [
    ...blocks,
    { type: "text", text: "上記の添付資料の内容から、登録フォームの自由記述欄に使える下書き文章を作成してください。" },
  ];

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
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }),
    });
  } catch (err) {
    throw new LlmProviderError("anthropic", "APIへの接続に失敗しました", err);
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new LlmProviderError("anthropic", `APIエラー: ${errText}`);
  }

  const data = await res.json();
  const text = data.content?.find((b: { type: string }) => b.type === "text")?.text;
  if (!text) {
    throw new LlmProviderError("anthropic", "応答からテキストを取得できませんでした");
  }

  return { draft: text, provider: "anthropic", model: MODEL, skippedFiles };
}
