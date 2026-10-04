// 左メニュー「議事録・資料をダッシュボードに反映する」用のAPI(反映案の生成のみ)。
// 2026-10-04 離島経済新聞社 鯨本さんからの依頼:
//   ・議事録を読み込んで意思決定ダッシュボードに反映する
//   ・資料を読み込んで意思決定ダッシュボードに反映する
//   ・国産LLMも活用して意思決定ダッシュボードに反映する
//
// このAPIはダッシュボードを書き換えない。LLMに「どのセル(data-cell-id)をどう更新するか」の案だけを
// 作らせて返す。画面側で人が差分を確認し、選んだものだけを既存の /api/dashboard-edit/cell
// (要・編集モードログイン)で保存する。LLMの出力は信用せず、次の検証を必ず通す:
//   - cellId は、画面から送られたセル一覧に存在するものだけ
//   - newText は空でない文字列、長さ上限あり
//   - 国産LLMの出力がJSONとして壊れていた場合は、Claudeで1回だけやり直す(fallbackFrom で明示)

import { NextRequest, NextResponse } from "next/server";
import { SELECTABLE_CHAT_PROVIDERS, summarizeIssueWithFallback } from "@/lib/llm";

export const runtime = "nodejs";
export const maxDuration = 90;

const MAX_SOURCE_CHARS = 30_000;
const MAX_CELLS = 200;
const MAX_CELL_TEXT = 600;
const MAX_NEW_TEXT = 800;
const MAX_UPDATES = 10;

type Cell = { id: string; text: string };
type Update = { cellId: string; newText: string; reason: string };

// LLMは「JSONのみ」と指示しても ```json で囲んだり前置きを付けたりすることがあるため、
// コードフェンスを剥がし、最初の { から最後の } までを取り出してからパースする。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseLlmJson(raw: string): any {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const body = fenced ? fenced[1] : trimmed;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("no json object");
  return JSON.parse(body.slice(start, end + 1));
}

function validate(parsed: unknown, validIds: Set<string>): { summary: string; updates: Update[]; dropped: number } {
  if (!parsed || typeof parsed !== "object") throw new Error("not an object");
  const p = parsed as Record<string, unknown>;
  if (!Array.isArray(p.updates)) throw new Error("updates is not an array");
  const seen = new Set<string>();
  const updates: Update[] = [];
  let dropped = 0;
  for (const u of p.updates) {
    const r = (u ?? {}) as Record<string, unknown>;
    if (
      typeof r.cellId !== "string" ||
      !validIds.has(r.cellId) ||
      seen.has(r.cellId) ||
      typeof r.newText !== "string" ||
      r.newText.trim() === "" ||
      r.newText.length > MAX_NEW_TEXT
    ) {
      dropped++;
      continue;
    }
    seen.add(r.cellId);
    updates.push({
      cellId: r.cellId,
      newText: r.newText.trim(),
      reason: typeof r.reason === "string" ? r.reason.slice(0, 120) : "",
    });
    if (updates.length >= MAX_UPDATES) break;
  }
  return { summary: typeof p.summary === "string" ? p.summary.slice(0, 300) : "", updates, dropped };
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が不正です" }, { status: 400 });
  }

  const issueTitle = typeof body.issueTitle === "string" ? body.issueTitle : "";
  const sourceNotes = typeof body.sourceNotes === "string" ? body.sourceNotes.trim() : "";
  const sourceKind = body.sourceKind === "material" ? "資料" : "議事録";
  const provider =
    typeof body.provider === "string" && SELECTABLE_CHAT_PROVIDERS.some((p) => p.id === body.provider)
      ? body.provider
      : "anthropic";

  if (!sourceNotes) {
    return NextResponse.json({ error: "議事録または資料の本文を入力してください" }, { status: 400 });
  }
  if (sourceNotes.length > MAX_SOURCE_CHARS) {
    return NextResponse.json(
      { error: `本文が長すぎます(${MAX_SOURCE_CHARS.toLocaleString()}字まで)。分けて反映してください` },
      { status: 413 }
    );
  }
  if (!Array.isArray(body.cells) || body.cells.length === 0 || body.cells.length > MAX_CELLS) {
    return NextResponse.json({ error: "セル一覧が不正です" }, { status: 400 });
  }
  const cells: Cell[] = [];
  for (const c of body.cells) {
    const r = (c ?? {}) as Record<string, unknown>;
    if (typeof r.id !== "string" || typeof r.text !== "string") {
      return NextResponse.json({ error: "セル一覧が不正です" }, { status: 400 });
    }
    cells.push({ id: r.id, text: r.text.slice(0, MAX_CELL_TEXT) });
  }
  const validIds = new Set(cells.map((c) => c.id));

  const run = (providerId: string) =>
    summarizeIssueWithFallback(
      {
        mode: "dashboardUpdate",
        issueTitle,
        sourceNotes: `【入力の種類】${sourceKind}\n\n${sourceNotes}`,
        question: JSON.stringify(cells),
      },
      providerId
    );

  try {
    let result = await run(provider);
    let fallbackFrom: string | undefined = result.provider !== provider ? provider : undefined;
    let checked;
    try {
      checked = validate(parseLlmJson(result.draft), validIds);
    } catch (e) {
      if (result.provider === "anthropic") throw e;
      // 国産LLMの出力がJSONとして使えない場合は、Claudeで1回だけやり直す
      console.warn(`dashboard-update: ${result.provider} の出力を解析できないためClaudeで再実行します`);
      fallbackFrom = result.provider;
      result = await run("anthropic");
      checked = validate(parseLlmJson(result.draft), validIds);
    }
    return NextResponse.json({
      summary: checked.summary,
      updates: checked.updates,
      droppedCount: checked.dropped,
      provider: result.provider,
      model: result.model,
      fallbackFrom,
    });
  } catch (err) {
    console.error("dashboard-update error:", err);
    return NextResponse.json({ error: "反映案の作成に失敗しました。時間をおいて再度お試しください" }, { status: 502 });
  }
}
