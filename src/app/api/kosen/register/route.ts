// 次世代高専教育サイト（public/kosen/）の登録フォームAPI
// 先生向け「こんな授業をしてほしい」、企業向け「これだったらできる」を、
// Notionの「📥 先生・企業 登録リクエスト」データソースに1件記録する。
// CR「先生がやってほしい授業を簡単に登録できるインターフェースがない」
// CR「企業が自ら情報を登録する導線がなく、問い合わせフォームはダミー」への対応(2026-09-09)。
// AIによる自動処理・自動返信は行わない(対応状況=未確認で記録するのみ)。
import { NextRequest, NextResponse } from "next/server";
import { logKosenRegistration } from "@/lib/notion";

export const runtime = "nodejs";

type KosenRegisterBody = {
  type: "先生" | "企業";
  name: string;
  affiliation: string;
  content: string;
  contactEmail?: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<KosenRegisterBody>;
    const { type, name, affiliation, content, contactEmail } = body;

    if (type !== "先生" && type !== "企業") {
      return NextResponse.json({ error: "typeは「先生」または「企業」を指定してください" }, { status: 400 });
    }
    if (!isNonEmptyString(name) || !isNonEmptyString(affiliation) || !isNonEmptyString(content)) {
      return NextResponse.json({ error: "お名前・ご所属・内容は必須です" }, { status: 400 });
    }
    if (contactEmail !== undefined && contactEmail !== "" && !isNonEmptyString(contactEmail)) {
      return NextResponse.json({ error: "連絡先の形式が正しくありません" }, { status: 400 });
    }

    const result = await logKosenRegistration({
      type,
      name,
      affiliation,
      content,
      contactEmail: contactEmail || undefined,
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
