// 次世代高専教育サイト（public/kosen/tetsudatte.html）の実施記録API
// CR「3ツール全てでデータがブラウザ内メモリ/静的配列のみで、Notion等への永続化がされていない」への対応(2026-09-09)。
// POST: 実施記録を1件作成しNotionに永続化する。
// GET : 実施日の新しい順に記録一覧を返す（ページ読み込み時に呼ばれ、統計カード・一覧を再構築する）。
import { NextRequest, NextResponse } from "next/server";
import { logKosenRecord, listKosenRecords } from "@/lib/notion";

export const runtime = "nodejs";

type KosenRecordBody = {
  school: string;
  teacher: string;
  date: string;
  tag: string;
  studentCount: number;
  memo: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<KosenRecordBody>;
    const { school, teacher, date, tag, studentCount, memo } = body;

    if (
      !isNonEmptyString(school) ||
      !isNonEmptyString(teacher) ||
      !isNonEmptyString(date) ||
      !isNonEmptyString(tag) ||
      !isNonEmptyString(memo) ||
      typeof studentCount !== "number" ||
      !Number.isFinite(studentCount) ||
      studentCount < 0
    ) {
      return NextResponse.json({ error: "すべての項目を正しく入力してください" }, { status: 400 });
    }

    const result = await logKosenRecord({ school, teacher, date, tag, studentCount, memo });
    return NextResponse.json({ ok: true, pageId: result.pageId });
  } catch (err) {
    console.error("kosen/record POST error:", err);
    return NextResponse.json(
      { error: "送信中にエラーが発生しました。時間をおいて再度お試しください。" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const records = await listKosenRecords(100);
    return NextResponse.json({ ok: true, records });
  } catch (err) {
    console.error("kosen/record GET error:", err);
    return NextResponse.json(
      { error: "実施記録の取得に失敗しました。" },
      { status: 500 }
    );
  }
}
