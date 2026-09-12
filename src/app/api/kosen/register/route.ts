// 次世代高専教育サイト（public/kosen/）の登録フォームAPI
// 先生向け「こんな授業をしてほしい」、企業向け「これだったらできる」を、
// Notionの「📥 先生・企業 登録リクエスト」データソースに1件記録する。
// CR「先生がやってほしい授業を簡単に登録できるインターフェースがない」
// CR「企業が自ら情報を登録する導線がなく、問い合わせフォームはダミー」への対応(2026-09-09)。
// AIによる自動処理・自動返信は行わない(対応状況=未確認で記録するのみ)。
import { NextRequest, NextResponse } from "next/server";
import { logKosenRegistration } from "@/lib/notion";

export const runtime = "nodejs";

// CR「matching.htmlに企業属性カード選択UIを追加」対応(2026-09-12)：
// 企業種別(単一選択)・業務種別/対応学科/対応地区(複数選択可)の4カテゴリ。
// https://app.notion.com/p/3d9960a91e2381d3ad0ce93826ac43c1
type KosenCardSelections = {
  industry?: string | null;
  jobtype?: string[];
  department?: string[];
  region?: string[];
};

type KosenRegisterBody = {
  type: "先生" | "企業";
  name: string;
  affiliation: string;
  content: string;
  contactEmail?: string;
  // CR「複数ファイルをまとめてアップロードしたい」対応(2026-09-09)で単一ファイルから配列に変更。
  files?: { url: string; name: string }[];
  // 企業属性カード選択（type="企業"のときのみ意味を持つ。先生登録では未使用）
  cardSelections?: KosenCardSelections | null;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

// カード選択の内容を、Notionの「内容」欄に追記できる読みやすいテキストに整形する。
// Notion側に専用プロパティを追加していないため、現状は「内容」欄の末尾にまとめて記録する。
function formatCardSelections(selections: KosenCardSelections | null | undefined): string {
  if (!selections) return "";
  const lines: string[] = [];
  if (isNonEmptyString(selections.industry)) {
    lines.push(`企業種別: ${selections.industry}`);
  }
  if (Array.isArray(selections.jobtype) && selections.jobtype.length > 0) {
    lines.push(`業務種別: ${selections.jobtype.join("、")}`);
  }
  if (Array.isArray(selections.department) && selections.department.length > 0) {
    lines.push(`対応可能な学科: ${selections.department.join("、")}`);
  }
  if (Array.isArray(selections.region) && selections.region.length > 0) {
    lines.push(`対応可能な地区: ${selections.region.join("、")}`);
  }
  if (lines.length === 0) return "";
  return `\n\n【企業属性（カード選択）】\n${lines.join("\n")}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<KosenRegisterBody>;
    const { type, name, affiliation, content, contactEmail, files, cardSelections } = body;

    if (type !== "先生" && type !== "企業") {
      return NextResponse.json({ error: "typeは「先生」または「企業」を指定してください" }, { status: 400 });
    }
    if (!isNonEmptyString(name) || !isNonEmptyString(affiliation) || !isNonEmptyString(content)) {
      return NextResponse.json({ error: "お名前・ご所属・内容は必須です" }, { status: 400 });
    }
    if (contactEmail !== undefined && contactEmail !== "" && !isNonEmptyString(contactEmail)) {
      return NextResponse.json({ error: "連絡先の形式が正しくありません" }, { status: 400 });
    }

    // カード選択（企業属性）は、既存の「内容」欄の末尾にテキストとして追記する形でNotionに記録する
    // （Notion側のプロパティ追加は行っていないため、まずは既存カラムの範囲内で対応）。
    const cardSelectionsText = type === "企業" ? formatCardSelections(cardSelections) : "";
    const combinedContent = (content + cardSelectionsText).slice(0, 2000);

    const result = await logKosenRegistration({
      type,
      name,
      affiliation,
      content: combinedContent,
      contactEmail: contactEmail || undefined,
      files: Array.isArray(files) && files.length > 0 ? files : undefined,
    });

    return NextResponse.json({ ok: true, pageId: result.pageId });
  } catch (err) {
    console.error("kosen/register error:", err);
    return NextResponse.json(
      { error: "送信中にエラーが発生しました。時間をおいて再度お試しください。" },
      { status: 500 }
    );
  }
}
